import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../utils.js';
import { requireAdmin, ADMIN_COOKIE } from '../middleware/auth.js';

const router = Router();
const isProd = process.env.NODE_ENV === 'production';

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12);

// Cross-site frontend (e.g. Vercel + Render) needs SameSite=None;Secure. Same-site deployments can set COOKIE_SAMESITE=lax|strict.
function cookieOptions() {
  const sameSite = process.env.COOKIE_SAMESITE || (isProd ? 'none' : 'lax');
  return { httpOnly: true, sameSite, secure: isProd || sameSite === 'none', path: '/' };
}

// POST /api/admin/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (password.length > 200) return res.status(401).json({ error: 'Invalid credentials' });

  const { rows } = await pool.query('SELECT * FROM admins WHERE lower(email) = $1', [email]);
  const admin = rows[0];
  const valid = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !valid) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: admin.id, email: admin.email, type: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '12h', algorithm: 'HS256' }
  );

  res.cookie(ADMIN_COOKIE, token, { ...cookieOptions(), maxAge: 12 * 60 * 60 * 1000 });
  // NOTE: token is also returned for the current frontend. Prefer cookie-only auth long-term (tokens in localStorage are XSS-stealable).
  res.json({ token, email: admin.email });
}));

// POST /api/admin/logout
router.post('/logout', (req, res) => {
  // options must match the ones used to set the cookie, otherwise browsers keep it
  res.clearCookie(ADMIN_COOKIE, cookieOptions());
  res.status(204).end();
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  res.json({ email: req.admin.email });
});

// GET /api/admin/dashboard
router.get('/dashboard', requireAdmin, asyncHandler(async (req, res) => {
  const [orders, pendingOrders, customOrders, products, revenue] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM orders'),
    pool.query(`SELECT COUNT(*) FROM orders WHERE status IN ('pending','paid','in_progress')`),
    pool.query(`SELECT COUNT(*) FROM custom_orders WHERE status = 'new'`),
    pool.query('SELECT COUNT(*) FROM products WHERE is_active = TRUE'),
    // Only count orders that were actually paid/fulfilled. The old query counted 'pending' (unpaid) orders as revenue.
    pool.query(`SELECT COALESCE(SUM(total_cents),0) AS total FROM orders WHERE status IN ('paid','in_progress','shipped','completed')`),
  ]);

  res.json({
    totalOrders: Number(orders.rows[0].count),
    activeOrders: Number(pendingOrders.rows[0].count),
    newCustomRequests: Number(customOrders.rows[0].count),
    activeProducts: Number(products.rows[0].count),
    lifetimeRevenue: Number((Number(revenue.rows[0].total) / 100).toFixed(2)),
  });
}));

export default router;