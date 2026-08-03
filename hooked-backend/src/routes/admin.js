import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/admin/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
  const admin = rows[0];
  if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, admin.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ sub: admin.id, email: admin.email, type: 'admin' }, process.env.JWT_SECRET, { expiresIn: '12h' });

  res.cookie('hooked_admin_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 12 * 60 * 60 * 1000,
  });
  res.json({ token, email: admin.email });
}));

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  res.clearCookie('hooked_admin_token');
  res.status(204).end();
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ email: req.admin.email });
});

// GET /api/admin/dashboard  -> quick counts for an admin home screen
router.get('/dashboard', requireAdmin, asyncHandler(async (req, res) => {
  const [orders, pendingOrders, customOrders, products, revenue] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM orders'),
    pool.query(`SELECT COUNT(*) FROM orders WHERE status IN ('pending','paid','in_progress')`),
    pool.query(`SELECT COUNT(*) FROM custom_orders WHERE status = 'new'`),
    pool.query('SELECT COUNT(*) FROM products WHERE is_active = TRUE'),
    pool.query(`SELECT COALESCE(SUM(total_cents),0) AS total FROM orders WHERE status != 'cancelled'`),
  ]);

  res.json({
    totalOrders: Number(orders.rows[0].count),
    activeOrders: Number(pendingOrders.rows[0].count),
    newCustomRequests: Number(customOrders.rows[0].count),
    activeProducts: Number(products.rows[0].count),
    lifetimeRevenue: Number((revenue.rows[0].total / 100).toFixed(2)),
  });
}));

export default router;
