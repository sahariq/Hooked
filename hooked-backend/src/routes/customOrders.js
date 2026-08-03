import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';
import { sendCustomOrderAckEmail } from '../services/email.js';

const router = Router();

// POST /api/custom-orders  { name, email, category, message }
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, category, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'name, email, and message are required' });
  }

  const { rows } = await pool.query(
    `INSERT INTO custom_orders (name, email, category, message) VALUES ($1,$2,$3,$4) RETURNING *`,
    [name, email, category || null, message]
  );
  sendCustomOrderAckEmail(rows[0]).catch((err) => console.error('Failed to send custom order ack email', err));
  res.status(201).json(rows[0]);
}));

// ===== ADMIN =====

// GET /api/custom-orders
router.get('/', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query;
  const params = [];
  let sql = 'SELECT * FROM custom_orders';
  if (status) {
    params.push(status);
    sql += ' WHERE status = $1';
  }
  sql += ' ORDER BY created_at DESC';
  const { rows } = await pool.query(sql, params);
  res.json(rows);
}));

// PATCH /api/custom-orders/:id/status  { status }
router.patch('/:id/status', requireAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ['new', 'quoted', 'approved', 'in_progress', 'shipped', 'closed'];
  if (!allowed.includes(status)) return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });

  const { rows } = await pool.query(
    `UPDATE custom_orders SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Custom order not found' });
  res.json(rows[0]);
}));

export default router;
