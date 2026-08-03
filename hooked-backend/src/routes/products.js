import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, money } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

function serializeProduct(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category_slug,
    price: money(row.price_cents),
    bg: row.bg,
    icon: row.icon,
    badge: row.badge,
    rating: Number(row.rating),
    reviews: row.reviews,
    description: row.description,
    details: row.details,
    colors: row.colors,
    stock: row.stock,
    isActive: row.is_active,
  };
}

const BASE_SELECT = `
  SELECT p.*, c.slug AS category_slug
  FROM products p
  LEFT JOIN categories c ON c.id = p.category_id
`;

// GET /api/products?category=keychains&sort=price-asc&search=fox
router.get('/', asyncHandler(async (req, res) => {
  const { category, sort, search } = req.query;
  const clauses = ['p.is_active = TRUE'];
  const params = [];

  if (category) {
    params.push(category);
    clauses.push(`c.slug = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`p.name ILIKE $${params.length}`);
  }

  let orderBy = 'p.created_at DESC';
  if (sort === 'price-asc') orderBy = 'p.price_cents ASC';
  if (sort === 'price-desc') orderBy = 'p.price_cents DESC';
  if (sort === 'rating') orderBy = 'p.rating DESC';

  const sql = `${BASE_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY ${orderBy}`;
  const { rows } = await pool.query(sql, params);
  res.json(rows.map(serializeProduct));
}));

// GET /api/products/:idOrSlug
router.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const sql = `${BASE_SELECT} WHERE p.is_active = TRUE AND ${isUuid ? 'p.id = $1' : 'p.slug = $1'}`;
  const { rows } = await pool.query(sql, [idOrSlug]);
  if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json(serializeProduct(rows[0]));
}));

// GET /api/products/:idOrSlug/related
router.get('/:idOrSlug/related', asyncHandler(async (req, res) => {
  const product = await pool.query(`${BASE_SELECT} WHERE p.slug = $1 OR p.id::text = $1`, [req.params.idOrSlug]);
  if (!product.rows[0]) return res.json([]);
  const { rows } = await pool.query(
    `${BASE_SELECT} WHERE c.slug = $1 AND p.id != $2 AND p.is_active = TRUE LIMIT 4`,
    [product.rows[0].category_slug, product.rows[0].id]
  );
  res.json(rows.map(serializeProduct));
}));

// ===== ADMIN =====

// POST /api/products
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { slug, name, category, price, bg, icon, badge, description, details, colors, stock } = req.body;
  if (!slug || !name || !price) return res.status(400).json({ error: 'slug, name, and price are required' });

  const cat = await pool.query('SELECT id FROM categories WHERE slug = $1', [category]);
  const { rows } = await pool.query(
    `INSERT INTO products (slug, name, category_id, price_cents, bg, icon, badge, description, details, colors, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [slug, name, cat.rows[0]?.id || null, Math.round(price * 100), bg || '#F6D9E4', icon || 'star',
     badge || null, description || '', JSON.stringify(details || []), JSON.stringify(colors || []), stock ?? 999]
  );
  res.status(201).json(serializeProduct({ ...rows[0], category_slug: category }));
}));

// PUT /api/products/:id
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { name, category, price, bg, icon, badge, description, details, colors, stock, isActive } = req.body;
  const cat = category ? await pool.query('SELECT id FROM categories WHERE slug = $1', [category]) : null;

  const { rows } = await pool.query(
    `UPDATE products SET
       name = COALESCE($1, name),
       category_id = COALESCE($2, category_id),
       price_cents = COALESCE($3, price_cents),
       bg = COALESCE($4, bg),
       icon = COALESCE($5, icon),
       badge = $6,
       description = COALESCE($7, description),
       details = COALESCE($8, details),
       colors = COALESCE($9, colors),
       stock = COALESCE($10, stock),
       is_active = COALESCE($11, is_active),
       updated_at = now()
     WHERE id = $12 RETURNING *`,
    [name, cat?.rows[0]?.id, price != null ? Math.round(price * 100) : null, bg, icon, badge ?? null,
     description, details ? JSON.stringify(details) : null, colors ? JSON.stringify(colors) : null,
     stock, isActive, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.json(serializeProduct({ ...rows[0], category_slug: category }));
}));

// DELETE /api/products/:id  (soft delete)
router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE products SET is_active = FALSE, updated_at = now() WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
  res.status(204).end();
}));

export default router;
