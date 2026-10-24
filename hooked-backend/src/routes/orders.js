import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/tx.js';
import { asyncHandler, money, generateOrderNumber, isEmail, isStr, parsePaging, HttpError } from '../utils.js';
import { requireAdmin, optionalAdmin } from '../middleware/auth.js';
import { optionalCustomer } from '../middleware/customerAuth.js';
import { createCheckoutSession, verifyWebhookSignature } from '../services/safepay.js';
import { sendOrderConfirmationEmail } from '../services/email.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';
const ORDER_STATUSES = ['pending', 'paid', 'in_progress', 'shipped', 'completed', 'cancelled'];

// ---------- helpers ----------

/** `full` = includes personal data (name, email, address, notes). Public lookups get the redacted view. */
function serializeOrder(row, items = null, full = true) {
  const out = {
    id: row.id,
    orderNumber: row.order_number,
    countryCode: row.country_code,
    subtotal: money(row.subtotal_cents),
    shipping: money(row.shipping_cents),
    total: money(row.total_cents),
    displayCurrency: row.display_currency,
    displayTotal: row.display_total != null ? Number(row.display_total) : null,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    createdAt: row.created_at,
    items: items ? items.map((i) => ({
      productId: i.product_id,
      name: i.product_name,
      price: money(i.price_cents),
      color: i.color,
      qty: i.qty,
    })) : undefined,
  };
  if (full) {
    out.customerName = row.customer_name;
    out.customerEmail = row.customer_email;
    out.shippingAddress = row.shipping_address;
    out.notes = row.notes;
  }
  return out;
}

const signViewToken = (order) =>
  jwt.sign({ sub: String(order.id), type: 'order_view' }, process.env.JWT_SECRET, { expiresIn: '30d', algorithm: 'HS256' });

/** Who may see an order's personal details: admin, the owning customer, someone holding the view token, or the email owner. */
function canViewFull(req, row) {
  if (req.admin) return true;
  if (req.customer && row.customer_id != null && String(req.customer.sub) === String(row.customer_id)) return true;

  const { token, email } = req.query;
  if (typeof token === 'string') {
    try {
      const p = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
      if (p.type === 'order_view' && String(p.sub) === String(row.id)) return true;
    } catch { /* fall through */ }
  }
  if (typeof email === 'string' && row.customer_email && email.trim().toLowerCase() === row.customer_email.toLowerCase()) return true;
  return false;
}

const emailItems = (items) => items.map((r) => ({ product_name: r.name, price_cents: r.price_cents, color: r.color, qty: r.qty }));

/**
 * Cancels an order exactly once and returns its items to stock.
 * Safe to call repeatedly (webhook retries, double clicks): only the first call changes anything.
 */
async function cancelOrder(orderId, paymentStatus = null) {
  return withTransaction(async (client) => {
    const { rows } = await client.query(
      `UPDATE orders SET status = 'cancelled', payment_status = COALESCE($2, payment_status), updated_at = now()
       WHERE id = $1 AND status <> 'cancelled' RETURNING id`,
      [orderId, paymentStatus]
    );
    if (!rows[0]) return false;
    await client.query(
      `UPDATE products p SET stock = p.stock + oi.total, updated_at = now()
       FROM (SELECT product_id, SUM(qty) AS total FROM order_items WHERE order_id = $1 GROUP BY product_id) oi
       WHERE p.id = oi.product_id`,
      [orderId]
    );
    return true;
  });
}

// ---------- create order ----------
// body: { cartId, customerName, customerEmail, shippingAddress, countryCode, currencyCode, paymentMethod, notes }
router.post('/', optionalCustomer, asyncHandler(async (req, res) => {
  const b = req.body || {};
  const { cartId, shippingAddress } = b;
  const customerName = typeof b.customerName === 'string' ? b.customerName.trim() : '';
  const customerEmail = typeof b.customerEmail === 'string' ? b.customerEmail.trim().toLowerCase() : '';
  const countryCode = typeof b.countryCode === 'string' ? b.countryCode.trim().toUpperCase() : '';
  const notes = typeof b.notes === 'string' && b.notes.trim() ? b.notes.trim().slice(0, 1000) : null;

  if ((typeof cartId !== 'string' && typeof cartId !== 'number') || !cartId) return res.status(400).json({ error: 'cartId is required' });
  if (!isStr(customerName, 100)) return res.status(400).json({ error: 'customerName is required (max 100 chars)' });
  if (!isEmail(customerEmail)) return res.status(400).json({ error: 'A valid customerEmail is required' });
  if (!isStr(countryCode, 3)) return res.status(400).json({ error: 'countryCode is required' });

  const addressOk =
    (typeof shippingAddress === 'string' && shippingAddress.trim()) ||
    (shippingAddress && typeof shippingAddress === 'object' && !Array.isArray(shippingAddress) && Object.keys(shippingAddress).length > 0);
  if (!addressOk || JSON.stringify(shippingAddress).length > 2000) {
    return res.status(400).json({ error: 'A valid shippingAddress is required' });
  }

  const method = b.paymentMethod === 'cod' ? 'cod' : 'card';
  if (method === 'card' && isProd && !process.env.SAFEPAY_API_KEY) {
    return res.status(503).json({ error: 'Card payments are temporarily unavailable' });
  }

  const { order, items } = await withTransaction(async (client) => {
    // Lock the cart row so a double-click / two tabs can't turn the same cart into two orders
    const cart = await client.query('SELECT id FROM carts WHERE id = $1 FOR UPDATE', [cartId]);
    if (!cart.rows[0]) throw new HttpError(404, 'Cart not found');

    const country = (await client.query('SELECT * FROM countries WHERE code = $1', [countryCode])).rows[0];
    if (!country) throw new HttpError(400, "We don't currently ship to that country");
    if (method === 'cod' && !country.cod_available) throw new HttpError(400, 'Cash on Delivery is not available for this country');

    // Lock the product rows too (ordered by id -> no deadlocks) so stock can't be oversold by concurrent checkouts
    const itemsRes = await client.query(
      `SELECT ci.product_id, ci.color, ci.qty, p.name, p.price_cents, p.is_active, p.stock
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1
       ORDER BY ci.product_id, ci.color
       FOR UPDATE OF p`,
      [cartId]
    );
    const lines = itemsRes.rows;
    if (lines.length === 0) throw new HttpError(400, 'Cart is empty');

    const needed = new Map(); // product_id -> total qty across colours
    for (const l of lines) {
      if (!l.is_active) throw new HttpError(409, `"${l.name}" is no longer available`);
      needed.set(l.product_id, (needed.get(l.product_id) || 0) + l.qty);
    }
    for (const [productId, qty] of needed) {
      const l = lines.find((x) => x.product_id === productId);
      if (l.stock < qty) throw new HttpError(409, `Only ${l.stock} of "${l.name}" left in stock`);
    }

    // Prices always come from the database, never from the client
    const subtotalCents = lines.reduce((sum, l) => sum + l.price_cents * l.qty, 0);
    const shippingCents = country.shipping_flat_cents;
    const totalCents = subtotalCents + shippingCents;

    // snapshot the display-currency total for the receipt (fixed rate table)
    let displayCurrency = (typeof b.currencyCode === 'string' && b.currencyCode.trim().toUpperCase().slice(0, 5)) || country.default_currency;
    let displayTotal = null;
    const rate = (await client.query('SELECT rate_to_pkr FROM currency_rates WHERE code = $1', [displayCurrency])).rows[0];
    if (rate) displayTotal = Number((totalCents / 100 / Number(rate.rate_to_pkr)).toFixed(2));
    else displayCurrency = 'PKR';

    const order = (await client.query(
      `INSERT INTO orders (
         order_number, customer_id, customer_name, customer_email, shipping_address, country_code,
         subtotal_cents, shipping_cents, total_cents, display_currency, display_total,
         payment_method, payment_status, status, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        generateOrderNumber(), req.customer?.sub || null, customerName, customerEmail, JSON.stringify(shippingAddress), countryCode,
        subtotalCents, shippingCents, totalCents, displayCurrency, displayTotal,
        method, 'unpaid', 'pending', notes,
      ]
    )).rows[0];

    for (const l of lines) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price_cents, color, qty) VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, l.product_id, l.name, l.price_cents, l.color, l.qty]
      );
    }
    for (const [productId, qty] of needed) {
      await client.query('UPDATE products SET stock = stock - $1, updated_at = now() WHERE id = $2', [qty, productId]);
    }
    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);

    return { order, items: lines };
  });

  const serialized = {
    ...serializeOrder(order, items.map((l) => ({ product_id: l.product_id, product_name: l.name, price_cents: l.price_cents, color: l.color, qty: l.qty }))),
    viewToken: signViewToken(order), // pass as ?token= to GET /api/orders/:id to see full details later
  };

  if (method === 'card') {
    // The order is already committed. If the payment provider fails, cancel + restock instead of
    // leaving a paid-for-nothing order and an emptied cart (the old code returned a 500 here).
    try {
      const session = await createCheckoutSession(order);
      await pool.query('UPDATE orders SET safepay_tracker = $1 WHERE id = $2', [session.tracker, order.id]);
      return res.status(201).json({ ...serialized, checkoutUrl: session.checkoutUrl, mockPayment: session.mock });
    } catch (err) {
      console.error('Safepay checkout session failed', err);
      await cancelOrder(order.id, 'failed').catch((e) => console.error('Failed to cancel order after payment error', e));
      throw new HttpError(502, 'Could not start card payment. Please try again.');
    }
  }

  // COD orders are confirmed immediately (no payment step)
  sendOrderConfirmationEmail(order, emailItems(items)).catch((err) => console.error('Failed to send order confirmation email', err));
  res.status(201).json(serialized);
}));

// ---------- Safepay webhook ----------
// POST /api/orders/webhooks/safepay
router.post('/webhooks/safepay', asyncHandler(async (req, res) => {
  // Verify against the RAW bytes. JSON.stringify(req.body) re-serialises and rarely matches what was signed.
  const raw = req.rawBody ? req.rawBody.toString('utf8') : '';
  const signature = req.headers['x-sfpy-signature'];
  let valid = false;
  try { valid = !!raw && !!signature && (await verifyWebhookSignature(raw, signature)); } catch { valid = false; }
  if (!valid) return res.status(401).json({ error: 'Invalid webhook signature' });

  const { tracker, state } = req.body?.data || {};
  if (!tracker) return res.status(400).json({ error: 'Missing tracker in webhook payload' });

  if (state === 'TRACKER_ENDED') {
    // Idempotent: only the first "paid" webhook changes anything and sends the email.
    // Never moves an order that already shipped/completed back to "paid" (the old query did, on every retry).
    const { rows } = await pool.query(
      `UPDATE orders SET payment_status = 'paid',
              status = CASE WHEN status = 'pending' THEN 'paid' ELSE status END,
              updated_at = now()
       WHERE safepay_tracker = $1 AND payment_status <> 'paid' RETURNING *`,
      [tracker]
    );
    if (rows[0]) {
      if (rows[0].status === 'cancelled') console.error(`Payment received for CANCELLED order ${rows[0].order_number} - refund or reinstate manually`);
      const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [rows[0].id]);
      sendOrderConfirmationEmail(rows[0], itemsRes.rows).catch((err) => console.error('Failed to send order confirmation email', err));
    }
  } else if (state === 'TRACKER_FAILED') {
    const o = await pool.query('SELECT id, payment_status FROM orders WHERE safepay_tracker = $1', [tracker]);
    if (o.rows[0]?.payment_status === 'unpaid') await cancelOrder(o.rows[0].id, 'failed');
  }
  // any other state: acknowledge and ignore

  res.json({ received: true });
}));

// ---------- dev-only mock payment ----------
// POST /api/orders/:id/mock-pay
// SECURITY: this used to be enabled whenever SAFEPAY_API_KEY was unset - i.e. in any deployment that forgot the key,
// anyone could mark any order as paid for free. It is now impossible in production.
router.post('/:id/mock-pay', asyncHandler(async (req, res) => {
  if (isProd || process.env.SAFEPAY_API_KEY) return res.status(404).json({ error: 'Not found' });

  const { rows } = await pool.query(
    `UPDATE orders SET payment_status = 'paid', status = 'paid', updated_at = now()
     WHERE id = $1 AND payment_method = 'card' AND payment_status = 'unpaid' AND status = 'pending' RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'No unpaid card order with this id' });
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  sendOrderConfirmationEmail(rows[0], itemsRes.rows).catch((err) => console.error('Failed to send order confirmation email', err));
  res.json(serializeOrder(rows[0]));
}));

// ---------- public / customer lookup ----------
// GET /api/orders/:id  (?token=<viewToken> or ?email=<order email> to see personal details)
router.get('/:id', optionalAdmin, optionalCustomer, asyncHandler(async (req, res) => {
  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  const order = orderRes.rows[0];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  // Previously ANYONE with an order id got the buyer's name, email and home address.
  res.json(serializeOrder(order, itemsRes.rows, canViewFull(req, order)));
}));

// ===== ADMIN =====

// GET /api/orders?status=paid&limit=100&offset=0
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && !ORDER_STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` });
  }
  const { limit, offset } = parsePaging(req.query);

  const params = [];
  let sql = 'SELECT * FROM orders';
  if (status) {
    params.push(status);
    sql += ` WHERE status = $${params.length}`;
  }
  params.push(limit, offset);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await pool.query(sql, params);
  res.json(rows.map((r) => serializeOrder(r)));
}));

// PATCH /api/orders/:id/status  (admin)
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${ORDER_STATUSES.join(', ')}` });

  const current = await pool.query('SELECT status FROM orders WHERE id = $1', [req.params.id]);
  if (!current.rows[0]) return res.status(404).json({ error: 'Order not found' });
  // Un-cancelling would need stock re-reserved; create a new order instead.
  if (current.rows[0].status === 'cancelled' && status !== 'cancelled') {
    return res.status(409).json({ error: 'A cancelled order cannot be reopened' });
  }

  if (status === 'cancelled') {
    await cancelOrder(req.params.id); // restocks items
  } else {
    await pool.query(
      `UPDATE orders SET status = $1::text,
              -- cash-on-delivery is paid when delivered
              payment_status = CASE WHEN $1::text = 'completed' AND payment_method = 'cod' THEN 'paid' ELSE payment_status END,
              updated_at = now()
       WHERE id = $2`,
      [status, req.params.id]
    );
  }
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  res.json(serializeOrder(rows[0]));
}));

export default router;