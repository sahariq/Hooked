import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, money, generateOrderNumber } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';
import { optionalCustomer } from '../middleware/customerAuth.js';
import { createCheckoutSession, verifyWebhookSignature } from '../services/safepay.js';
import { sendOrderConfirmationEmail } from '../services/email.js';

const router = Router();

function serializeOrder(row, items = null) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    shippingAddress: row.shipping_address,
    countryCode: row.country_code,
    subtotal: money(row.subtotal_cents),
    shipping: money(row.shipping_cents),
    total: money(row.total_cents),
    displayCurrency: row.display_currency,
    displayTotal: row.display_total != null ? Number(row.display_total) : null,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    items: items ? items.map((i) => ({
      productId: i.product_id,
      name: i.product_name,
      price: money(i.price_cents),
      color: i.color,
      qty: i.qty,
    })) : undefined,
  };
}

// POST /api/orders
// body: { cartId, customerName, customerEmail, shippingAddress, countryCode, currencyCode, paymentMethod, notes }
// paymentMethod: 'card' (routes through Safepay) or 'cod' (only allowed if the country supports it)
router.post('/', optionalCustomer, asyncHandler(async (req, res) => {
  const { cartId, customerName, customerEmail, shippingAddress, countryCode, currencyCode, paymentMethod, notes } = req.body;
  if (!cartId || !customerName || !customerEmail || !shippingAddress || !countryCode) {
    return res.status(400).json({ error: 'cartId, customerName, customerEmail, shippingAddress, and countryCode are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const countryRes = await client.query('SELECT * FROM countries WHERE code = $1', [countryCode]);
    const country = countryRes.rows[0];
    if (!country) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `We don't currently ship to country code ${countryCode}` });
    }

    const method = paymentMethod === 'cod' ? 'cod' : 'card';
    if (method === 'cod' && !country.cod_available) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cash on Delivery is not available for this country' });
    }

    const itemsRes = await client.query(
      `SELECT ci.product_id, ci.color, ci.qty, p.name, p.price_cents
       FROM cart_items ci JOIN products p ON p.id = ci.product_id
       WHERE ci.cart_id = $1`,
      [cartId]
    );
    if (itemsRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const subtotalCents = itemsRes.rows.reduce((sum, r) => sum + r.price_cents * r.qty, 0);
    const shippingCents = country.shipping_flat_cents;
    const totalCents = subtotalCents + shippingCents;
    const orderNumber = generateOrderNumber();

    // snapshot the display currency total for the receipt (using the fixed rate table)
    let displayCurrency = currencyCode || country.default_currency;
    let displayTotal = null;
    const rateRes = await client.query('SELECT rate_to_pkr FROM currency_rates WHERE code = $1', [displayCurrency]);
    if (rateRes.rows[0]) {
      displayTotal = Number((totalCents / 100 / Number(rateRes.rows[0].rate_to_pkr)).toFixed(2));
    } else {
      displayCurrency = 'PKR';
    }

    const orderRes = await client.query(
      `INSERT INTO orders (
         order_number, customer_id, customer_name, customer_email, shipping_address, country_code,
         subtotal_cents, shipping_cents, total_cents, display_currency, display_total,
         payment_method, payment_status, status, notes
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
      [
        orderNumber, req.customer?.sub || null, customerName, customerEmail, JSON.stringify(shippingAddress), countryCode,
        subtotalCents, shippingCents, totalCents, displayCurrency, displayTotal,
        method, 'unpaid', 'pending', notes || null,
      ]
    );
    const order = orderRes.rows[0];

    for (const item of itemsRes.rows) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, price_cents, color, qty)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [order.id, item.product_id, item.name, item.price_cents, item.color, item.qty]
      );
    }

    await client.query('DELETE FROM cart_items WHERE cart_id = $1', [cartId]);
    await client.query('COMMIT');

    const serialized = serializeOrder(order, itemsRes.rows.map((r) => ({
      product_id: r.product_id, product_name: r.name, price_cents: r.price_cents, color: r.color, qty: r.qty,
    })));

    // For card payments, create a Safepay checkout session and hand the URL back to the frontend.
    if (method === 'card') {
      const session = await createCheckoutSession(order);
      await pool.query('UPDATE orders SET safepay_tracker = $1 WHERE id = $2', [session.tracker, order.id]);
      return res.status(201).json({ ...serialized, checkoutUrl: session.checkoutUrl, mockPayment: session.mock });
    }

    // COD orders are confirmed immediately (no payment step)
    if (method === 'cod') {
      sendOrderConfirmationEmail(order, itemsRes.rows.map((r) => ({ product_name: r.name, price_cents: r.price_cents, color: r.color, qty: r.qty })))
        .catch((err) => console.error('Failed to send order confirmation email', err));
    }
    res.status(201).json(serialized);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// GET /api/orders/:id  (order confirmation lookup - public, needs order id)
router.get('/:id', asyncHandler(async (req, res) => {
  const orderRes = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  if (!orderRes.rows[0]) return res.status(404).json({ error: 'Order not found' });
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  res.json(serializeOrder(orderRes.rows[0], itemsRes.rows));
}));

// POST /api/orders/:id/mock-pay  (dev-only: simulate a successful Safepay payment when no real keys are set)
router.post('/:id/mock-pay', asyncHandler(async (req, res) => {
  if (process.env.SAFEPAY_API_KEY) {
    return res.status(400).json({ error: 'Mock payment is disabled once real Safepay credentials are configured' });
  }
  const { rows } = await pool.query(
    `UPDATE orders SET payment_status = 'paid', status = 'paid', updated_at = now() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
  const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [req.params.id]);
  sendOrderConfirmationEmail(rows[0], itemsRes.rows).catch((err) => console.error('Failed to send order confirmation email', err));
  res.json(serializeOrder(rows[0]));
}));

// ===== SAFEPAY WEBHOOK =====

// POST /api/orders/webhooks/safepay  -> Safepay calls this when a payment succeeds/fails
router.post('/webhooks/safepay', asyncHandler(async (req, res) => {
  const signature = req.headers['x-sfpy-signature'];
  const valid = verifyWebhookSignature(JSON.stringify(req.body), signature);
  if (!valid) return res.status(401).json({ error: 'Invalid webhook signature' });

  const { tracker, state } = req.body?.data || {};
  if (!tracker) return res.status(400).json({ error: 'Missing tracker in webhook payload' });

  const paymentStatus = state === 'TRACKER_ENDED' ? 'paid' : state === 'TRACKER_FAILED' ? 'failed' : 'unpaid';
  const orderStatus = paymentStatus === 'paid' ? 'paid' : paymentStatus === 'failed' ? 'cancelled' : 'pending';

  await pool.query(
    `UPDATE orders SET payment_status = $1, status = $2, updated_at = now() WHERE safepay_tracker = $3`,
    [paymentStatus, orderStatus, tracker]
  );

  if (paymentStatus === 'paid') {
    const orderRes = await pool.query('SELECT * FROM orders WHERE safepay_tracker = $1', [tracker]);
    if (orderRes.rows[0]) {
      const itemsRes = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [orderRes.rows[0].id]);
      sendOrderConfirmationEmail(orderRes.rows[0], itemsRes.rows).catch((err) => console.error('Failed to send order confirmation email', err));
    }
  }

  res.json({ received: true });
}));

// ===== ADMIN =====

// GET /api/orders  (admin: list all orders)
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let sql = 'SELECT * FROM orders';
  if (status) {
    params.push(status);
    sql += ' WHERE status = $1';
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows.map((r) => serializeOrder(r)));
}));

// PATCH /api/orders/:id/status  (admin: update status)
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['pending', 'paid', 'in_progress', 'shipped', 'completed', 'cancelled'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });

  const { rows } = await pool.query(
    `UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found' });
  res.json(serializeOrder(rows[0]));
}));

export default router;
