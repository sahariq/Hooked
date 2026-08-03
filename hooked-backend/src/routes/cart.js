import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, money } from '../utils.js';

const router = Router();

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

  const items = rows.map((r) => ({
    itemId: r.item_id,
    productId: r.product_id,
    slug: r.slug,
    name: r.name,
    price: money(r.price_cents),
    bg: r.bg,
    icon: r.icon,
    color: r.color,
    qty: r.qty,
  }));

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { cartId, items, subtotal: Number(subtotal.toFixed(2)) };
}

// POST /api/cart  -> create a new empty cart
router.post('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(`INSERT INTO carts DEFAULT VALUES RETURNING id`);
  res.status(201).json({ cartId: rows[0].id, items: [], subtotal: 0 });
}));

// GET /api/cart/:cartId
router.get('/:cartId', asyncHandler(async (req, res) => {
  const cart = await pool.query('SELECT id FROM carts WHERE id = $1', [req.params.cartId]);
  if (!cart.rows[0]) return res.status(404).json({ error: 'Cart not found' });
  res.json(await getCartPayload(req.params.cartId));
}));

// POST /api/cart/:cartId/items  { productId, color, qty }
router.post('/:cartId/items', asyncHandler(async (req, res) => {
  const { cartId } = req.params;
  const { productId, color = null, qty = 1 } = req.body;

  const cart = await pool.query('SELECT id FROM carts WHERE id = $1', [cartId]);
  if (!cart.rows[0]) return res.status(404).json({ error: 'Cart not found' });

  const product = await pool.query('SELECT id FROM products WHERE id = $1 AND is_active = TRUE', [productId]);
  if (!product.rows[0]) return res.status(404).json({ error: 'Product not found' });

  await pool.query(
    `INSERT INTO cart_items (cart_id, product_id, color, qty)
     VALUES ($1,$2,$3,$4)
     ON CONFLICT (cart_id, product_id, color)
     DO UPDATE SET qty = cart_items.qty + EXCLUDED.qty`,
    [cartId, productId, color, qty]
  );
  await pool.query('UPDATE carts SET updated_at = now() WHERE id = $1', [cartId]);

  res.status(201).json(await getCartPayload(cartId));
}));

// PATCH /api/cart/:cartId/items/:itemId  { qty }
router.patch('/:cartId/items/:itemId', asyncHandler(async (req, res) => {
  const { cartId, itemId } = req.params;
  const { qty } = req.body;
  if (!qty || qty < 1) return res.status(400).json({ error: 'qty must be at least 1' });

  const { rows } = await pool.query(
    `UPDATE cart_items SET qty = $1 WHERE id = $2 AND cart_id = $3 RETURNING id`,
    [qty, itemId, cartId]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Cart item not found' });
  res.json(await getCartPayload(cartId));
}));

// DELETE /api/cart/:cartId/items/:itemId
router.delete('/:cartId/items/:itemId', asyncHandler(async (req, res) => {
  const { cartId, itemId } = req.params;
  await pool.query('DELETE FROM cart_items WHERE id = $1 AND cart_id = $2', [itemId, cartId]);
  res.json(await getCartPayload(cartId));
}));

export default router;
