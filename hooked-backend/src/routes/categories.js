import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, isStr, toInt, HttpError } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

function parseFields(b, { partial }) {
  const out = {};
  const has = (k) => b[k] !== undefined;

  if (!partial) {
    if (typeof b.slug !== 'string' || b.slug.length > 60 || !SLUG_RE.test(b.slug)) {
      throw new HttpError(400, 'slug is required (lowercase letters, numbers and hyphens, max 60 chars)');
    }
    out.slug = b.slug;
  }
  if (!partial || has('name')) {
    if (!isStr(b.name, 100)) throw new HttpError(400, 'name is required (max 100 chars)');
    out.name = b.name.trim();
  }
  if (has('blurb')) {
    if (typeof b.blurb !== 'string' || b.blurb.length > 500) throw new HttpError(400, 'blurb must be a string up to 500 chars');
    out.blurb = b.blurb;
  }
  if (has('bg')) {
    if (typeof b.bg !== 'string' || !COLOR_RE.test(b.bg)) throw new HttpError(400, 'bg must be a hex colour like #F6D9E4');
    out.bg = b.bg;
  }
  if (has('icon')) {
    if (!isStr(b.icon, 30)) throw new HttpError(400, 'icon must be a string up to 30 chars');
    out.icon = b.icon.trim();
  }
  if (has('sortOrder')) {
    const n = toInt(b.sortOrder, { min: -10000, max: 10000 });
    if (n === null) throw new HttpError(400, 'sortOrder must be a whole number');
    out.sortOrder = n;
  }
  return out;
}

// GET /api/categories
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT slug, name, blurb, bg, icon FROM categories ORDER BY sort_order ASC, name ASC`
  );
  res.set('Cache-Control', 'public, max-age=60');
  res.json(rows);
}));

// POST /api/categories  (admin)
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const f = parseFields(req.body || {}, { partial: false });
  const { rows } = await pool.query(
    `INSERT INTO categories (slug, name, blurb, bg, icon, sort_order) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [f.slug, f.name, f.blurb ?? '', f.bg ?? '#F6D9E4', f.icon ?? 'star', f.sortOrder ?? 0]
  ); // duplicate slug -> 23505 -> 409 via the central error handler
  res.status(201).json(rows[0]);
}));

// PUT /api/categories/:slug  (admin)
router.put('/:slug', requireAdmin, asyncHandler(async (req, res) => {
  const f = parseFields(req.body || {}, { partial: true });
  const { rows } = await pool.query(
    `UPDATE categories SET
       name = COALESCE($1, name), blurb = COALESCE($2, blurb),
       bg = COALESCE($3, bg), icon = COALESCE($4, icon), sort_order = COALESCE($5, sort_order)
     WHERE slug = $6 RETURNING *`,
    [f.name ?? null, f.blurb ?? null, f.bg ?? null, f.icon ?? null, f.sortOrder ?? null, req.params.slug]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Category not found' });
  res.json(rows[0]);
}));

export default router;