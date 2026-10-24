import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, isEmail, isStr, parsePaging } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendCustomOrderAckEmail } from '../services/email.js';

const router = Router();

const STATUSES = ['new', 'quoted', 'approved', 'in_progress', 'shipped', 'closed'];

// POST /api/custom-orders  { name, email, category, message }
// Public endpoint: rate limited in index.js, validated + length-capped here.
router.post('/', asyncHandler(async (req, res) => {
  const b = req.body || {};

  // Honeypot: real users never see/fill a hidden "website" field, bots do. Pretend success, store nothing.
  if (typeof b.website === 'string' && b.website.trim() !== '') return res.status(201).json({ ok: true });

  const email = typeof b.email === 'string' ? b.email.trim().toLowerCase() : '';
  if (!isStr(b.name, 100) || !isEmail(email) || !isStr(b.message, 5000)) {
    return res.status(400).json({ error: 'A name (max 100 chars), valid email, and message (max 5000 chars) are required' });
  }
  if (b.category != null && !isStr(b.category, 50, 0)) {
    return res.status(400).json({ error: 'category must be a string up to 50 characters' });
  }

  const { rows } = await pool.query(
    `INSERT INTO custom_orders (name, email, category, message) VALUES ($1,$2,$3,$4) RETURNING *`,
    [b.name.trim(), email, b.category?.trim() || null, b.message.trim()]
  );
  sendCustomOrderAckEmail(rows[0]).catch((err) => console.error('Failed to send custom order ack email', err));

  // Don't echo the whole DB row (internal status, etc.) back to an anonymous caller
  res.status(201).json({ ok: true, id: rows[0].id });
}));

// ===== ADMIN =====

// GET /api/custom-orders?status=new&limit=100&offset=0
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query;
  if (status !== undefined && !STATUSES.includes(status)) {
    return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });
  }
  const { limit, offset } = parsePaging(req.query);

  const params = [];
  let sql = 'SELECT * FROM custom_orders';
  if (status) {
    params.push(status);
    sql += ` WHERE status = $${params.length}`;
  }
  params.push(limit, offset);
  sql += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

  const { rows } = await pool.query(sql, params);
  res.json(rows);
}));

// PATCH /api/custom-orders/:id/status  { status }
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: `status must be one of: ${STATUSES.join(', ')}` });

  const { rows } = await pool.query(
    `UPDATE custom_orders SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Custom order not found' });
  res.json(rows[0]);
}));

export default router;