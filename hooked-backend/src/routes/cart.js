import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, money, toInt, HttpError } from '../utils.js';

const router = Router();

const MAX_QTY = 50;        // per line item
const MAX_LINES = 50;      // distinct lines per cart

async function getCartPayload(cartId) {
  const { rows } = await pool.query(
    `SELECT ci.id AS item_id, ci.color, ci.qty,
            p.id AS product_id, p.slug, p.name, p.price_cents, p.bg, p.icon
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.cart_id = $1
     ORDER BY ci.created_at ASC`,
    [cartId]
  );

  // sum in integer cents - summing floats drifts (0.1 + 0.2)
  const subtotalCents = rows.reduce((sum, r) => sum + r.price_cents * r.qty, 0);
  const items = rows.map((r) => ({
    itemId: r.item_id,
    productId: r.product_id,
    slug: r.slug,
    name: r.name,
    price: money(r.price_cents),
    bg: r.bg,
    icon: r.icon,
    color: r.color || null,
    qty: r.qty,
  }));

  return { cartId, items, subtotal: money(subtotalCents) };
}

async function assertCartExists(cartId) {
  const cart = await pool.query('SELECT id FROM carts WHERE id = $1', [cartId]);
  if (!cart.rows[0]) throw new HttpError(404, 'Cart not found');
}

// POST /api/cart  -> create a new empty cart
router.post('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`INSERT INTO carts DEFAULT VALUES RETURNING id`);
  res.status(201).json({ cartId: rows[0].id, items: [], subtotal: 0 });
}));

// GET /api/cart/:cartId
router.get('/:cartId', asyncHandler(async (req, res) => {
  await assertCartExists(req.params.cartId);
  res.json(await getCartPayload(req.params.cartId));
}));

// POST /api/cart/:cartId/items  { productId, color, qty }
router.post('/:cartId/items', asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  const { productId } = req.body || {};

  // qty used to be unchecked: a negative qty reduced/zeroed items, a huge qty broke totals
  const qty = req.body?.qty === undefined ? 1 : toInt(req.body.qty, { min: 1, max: MAX_QTY });
  if (qty === null) return res.status(400).json({ error: `qty must be a whole number between 1 and ${MAX_QTY}` });
  if (typeof productId !== 'string' || !productId) return res.status(400).json({ error: 'productId is required' });

  // '' instead of NULL: a UNIQUE(cart_id, product_id, color) constraint never matches NULLs,
  // so adding the same product twice without a colour created duplicate rows.
  const rawColor = req.body?.color;
  if (rawColor != null && (typeof rawColor !== 'string' || rawColor.length > 50)) {
    return res.status(400).json({ error: 'color must be a string up to 50 characters' });
  }
  const color = (rawColor || '').trim();

  await assertCartExists(cartId);

  const product = await pool.query('SELECT id, stock FROM products WHERE id = $1 AND is_active = TRUE', [productId]);
  if (!product.rows[0]) throw new HttpError(404, 'Product not found');

  const existing = await pool.query(
    `SELECT COALESCE(SUM(qty) FILTER (WHERE product_id = $2), 0) AS product_qty,
            COUNT(*) FILTER (WHERE product_id = $2 AND color = $3) AS same_line,
            COUNT(*) AS lines
     FROM cart_items WHERE cart_id = $1`,
    [cartId, productId, color]
  );
  const { product_qty, same_line, lines } = existing.rows[0];
  if (Number(same_line) === 0 && Number(lines) >= MAX_LINES) {
    return res.status(400).json({ error: 'Cart is full' });
  }
  const limit = Math.min(product.rows[0].stock, MAX_QTY * 10);
  if (Number(product_qty) + qty > limit) {
    return res.status(409).json({ error: `Only ${product.rows[0].stock} in stock` });
  }

  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, color, qty)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (cart_id, product_id, color)
     DO UPDATE SET qty = LEAST(cart_items.qty + EXCLUDED.qty, ${MAX_QTY})`,
    [cartId, productId, color, qty]
  );
  await pool.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);

  res.status(201).json(await getCartPayload(cartId));
}));

// PATCH /api/cart/:cartId/items/:itemId  { qty }
router.patch('/:cartId/items/:itemId', asyncHandler(async (req, res) => {
  const { cartId, itemId } = req.params;
  const qty = toInt(req.body?.qty, { min: 1, max: MAX_QTY });
  if (qty === null) return res.status(400).json({ error: `qty must be a whole number between 1 and ${MAX_QTY}` });

  const item = await pool.query(
    `SELECT p.stock FROM cart_items ci JOIN products p ON p.id = ci.product_id
     WHERE ci.id = $1 AND ci.cart_id = $2`,
    [itemId, cartId]
  );
  if (!item.rows[0]) return res.status(404).json({ error: 'Cart item not found' });
  if (qty > item.rows[0].stock) return res.status(409).json({ error: `Only ${item.rows[0].stock} in stock` });

  await pool.query(`UPDATE cart_items SET qty = $1 WHERE id = $2 AND cart_id = $3`, [qty, itemId, cartId]);
  await pool.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);
  res.json(await getCartPayload(cartId));
}));

// DELETE /api/cart/:cartId/items/:itemId
router.delete('/:cartId/items/:itemId', asyncHandler(async (req, res) => {
  const { cartId, itemId } = req.params;
  await assertCartExists(cartId);
  await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [itemId, cartId]);
  await pool.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);
  res.json(await getCartPayload(cartId));
}));

export default router;