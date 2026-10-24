import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, money, isUuid, isStr, toInt, parsePaging, HttpError } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COLOR_RE = /^#[0-9a-fA-F]{3,8}$/;

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

const SORTS = {
  'price-asc': 'p.price_cents ASC',
  'price-desc': 'p.price_cents DESC',
  rating: 'p.rating DESC',
};

// GET /api/products?category=keychains&sort=price-asc&search=fox&limit=8&offset=0
router.get('/', asyncHandler(async (req, res) => {
  const { category, sort, search } = req.query;
  const clauses = ['p.is_active = TRUE'];
  const params = [];

  // query params can be arrays/objects (?category[]=a); only accept plain strings
  if (typeof category === 'string' && category) {
    params.push(category);
    clauses.push(`c.slug = $${params.length}`);
  }
  if (typeof search === 'string' && search.trim()) {
    // escape LIKE wildcards so "%" or "_" are searched literally
    params.push(`%${search.trim().slice(0, 100).replace(/[\\%_]/g, '\\$&')}%`);
    clauses.push(`p.name ILIKE $${params.length}`);
  }

  const orderBy = `${SORTS[sort] || 'p.created_at DESC'}, p.id`;
  const { limit, offset } = parsePaging(req.query, { defaultLimit: 200, maxLimit: 200 });
  params.push(limit, offset);

  const sql = `${BASE_SELECT} WHERE ${clauses.join(' AND ')} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`;
  const { rows } = await pool.query(sql, params);
  res.json(rows.map(serializeProduct));
}));

async function findActiveProduct(idOrSlug) {
  const sql = `${BASE_SELECT} WHERE p.is_active = TRUE AND ${isUuid(idOrSlug) ? 'p.id = $1' : 'p.slug = $1'}`;
  const { rows } = await pool.query(sql, [idOrSlug]);
  return rows[0];
}

// GET /api/products/:idOrSlug
router.get('/:idOrSlug', asyncHandler(async (req, res) => {
  const product = await findActiveProduct(req.params.idOrSlug);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(serializeProduct(product));
}));

// GET /api/products/:idOrSlug/related
router.get('/:idOrSlug/related', asyncHandler(async (req, res) => {
  const product = await findActiveProduct(req.params.idOrSlug);
  if (!product || !product.category_slug) return res.json([]);
  const { rows } = await pool.query(
    `${BASE_SELECT} WHERE c.slug = $1 AND p.id != $2 AND p.is_active = TRUE ORDER BY p.created_at DESC LIMIT 4`,
    [product.category_slug, product.id]
  );
  res.json(rows.map(serializeProduct));
}));

// ===== ADMIN =====

function parseFields(b, { partial }) {
  const out = {};
  const has = (k) => b[k] !== undefined;

  if (!partial) {
    if (typeof b.slug !== 'string' || b.slug.length > 80 || !SLUG_RE.test(b.slug)) {
      throw new HttpError(400, 'slug is required (lowercase letters, numbers and hyphens, max 80 chars)');
    }
    out.slug = b.slug;
  }
  if (!partial || has('name')) {
    if (!isStr(b.name, 150)) throw new HttpError(400, 'name is required (max 150 chars)');
    out.name = b.name.trim();
  }
  if (!partial || has('price')) {
    const p = typeof b.price === 'string' ? Number(b.price) : b.price;
    if (typeof p !== 'number' || !Number.isFinite(p) || p <= 0 || p > 10_000_000) {
      throw new HttpError(400, 'price must be a positive number');
    }
    out.priceCents = Math.round(p * 100);
  }
  if (has('stock')) {
    const s = toInt(b.stock, { min: 0, max: 1_000_000 });
    if (s === null) throw new HttpError(400, 'stock must be a whole number >= 0');
    out.stock = s;
  }
  if (has('bg')) {
    if (typeof b.bg !== 'string' || !COLOR_RE.test(b.bg)) throw new HttpError(400, 'bg must be a hex colour like #F6D9E4');
    out.bg = b.bg;
  }
  if (has('icon')) {
    if (!isStr(b.icon, 30)) throw new HttpError(400, 'icon must be a string up to 30 chars');
    out.icon = b.icon.trim();
  }
  if (has('badge')) {
    if (b.badge === null || b.badge === '') out.badge = null;
    else if (isStr(b.badge, 30)) out.badge = b.badge.trim();
    else throw new HttpError(400, 'badge must be a string up to 30 chars or null');
  }
  if (has('description')) {
    if (typeof b.description !== 'string' || b.description.length > 5000) throw new HttpError(400, 'description must be a string up to 5000 chars');
    out.description = b.description;
  }
  for (const key of ['details', 'colors']) {
    if (has(key)) {
      if (!Array.isArray(b[key]) || b[key].length > 50 || JSON.stringify(b[key]).length > 5000) {
        throw new HttpError(400, `${key} must be an array (max 50 items)`);
      }
      out[key] = JSON.stringify(b[key]);
    }
  }
  if (has('isActive')) {
    if (typeof b.isActive !== 'boolean') throw new HttpError(400, 'isActive must be true or false');
    out.isActive = b.isActive;
  }
  return out;
}

// Returns undefined when no category was sent, the id when found, throws when the slug doesn't exist
async function resolveCategory(slug) {
  if (slug === undefined) return undefined;
  if (typeof slug !== 'string') throw new HttpError(400, 'category must be a category slug');
  const { rows } = await pool.query('SELECT id FROM categories WHERE slug = $1', [slug]);
  if (!rows[0]) throw new HttpError(400, `Unknown category "${slug}"`); // used to be silently ignored
  return rows[0].id;
}

async function loadProduct(id) {
  const { rows } = await pool.query(`${BASE_SELECT} WHERE p.id = $1`, [id]);
  return rows[0];
}

// POST /api/products
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const b = req.body || {};
  const f = parseFields(b, { partial: false });
  const categoryId = await resolveCategory(b.category);

  const { rows } = await pool.query(
    `INSERT INTO products (slug, name, category_id, price_cents, bg, icon, badge, description, details, colors, stock)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
    [f.slug, f.name, categoryId ?? null, f.priceCents, f.bg ?? '#F6D9E4', f.icon ?? 'star',
     f.badge ?? null, f.description ?? '', f.details ?? '[]', f.colors ?? '[]', f.stock ?? 999]
  ); // duplicate slug -> 409 via the central error handler
  res.status(201).json(serializeProduct(await loadProduct(rows[0].id)));
}));

// PUT /api/products/:id
router.put('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const b = req.body || {};
  const f = parseFields(b, { partial: true });
  const categoryId = await resolveCategory(b.category);

  // badge used to be written unconditionally ("badge = $6"), so editing e.g. the price wiped the badge.
  // Now it's only touched when the request actually contains a "badge" key.
  const { rows } = await pool.query(
    `UPDATE products SET
       name = COALESCE($1, name),
       category_id = COALESCE($2, category_id),
       price_cents = COALESCE($3, price_cents),
       bg = COALESCE($4, bg),
       icon = COALESCE($5, icon),
       badge = CASE WHEN $13::boolean THEN $6::text ELSE badge END,
       description = COALESCE($7, description),
       details = COALESCE($8, details),
       colors = COALESCE($9, colors),
       stock = COALESCE($10, stock),
       is_active = COALESCE($11, is_active),
       updated_at = now()
     WHERE id = $12 RETURNING id`,
    [f.name ?? null, categoryId ?? null, f.priceCents ?? null, f.bg ?? null, f.icon ?? null, f.badge ?? null,
     f.description ?? null, f.details ?? null, f.colors ?? null, f.stock ?? null, f.isActive ?? null,
     req.params.id, b.badge !== undefined]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Product not found' });
  // re-read so `category` in the response is always correct (it used to be null when category wasn't sent)
  res.json(serializeProduct(await loadProduct(rows[0].id)));
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