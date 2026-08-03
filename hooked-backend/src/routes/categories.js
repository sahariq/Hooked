import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/categories
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT slug, name, blurb, bg, icon FROM categories ORDER BY sort_order ASC`
  );
  res.json(rows);
}));

// POST /api/categories  (admin)
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { slug, name, blurb, bg, icon, sortOrder } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'slug and name are required' });
  const { rows } = await pool.query(
    `INSERT INTO categories (slug, name, blurb, bg, icon, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [slug, name, blurb || '', bg || '#F6D9E4', icon || 'star', sortOrder ?? 0]
  );
  res.status(201).json(rows[0]);
}));

// PUT /api/categories/:slug  (admin)
router.put('/:slug', requireAdmin, asyncHandler(async (req, res) => {
  const { name, blurb, bg, icon, sortOrder } = req.body;
  const { rows } = await pool.query(
    `UPDATE categories SET
       name = COALESCE($1, name), blurb = COALESCE($2, blurb),
       bg = COALESCE($3, bg), icon = COALESCE($4, icon), sort_order = COALESCE($5, sort_order)
     WHERE slug = $6 RETURNING *`,
    [name, blurb, bg, icon, sortOrder, req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Category not found' });
  res.json(rows[0]);
}));

export default router;

