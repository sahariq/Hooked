import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { asyncHandler, money } from '../utils.js';
import { requireCustomer } from '../middleware/customerAuth.js';

const router = Router();

function signCustomerToken(customer) {
  return jwt.sign(
    { sub: customer.id, email: customer.email, type: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function serializeCustomer(row) {
  return { id: row.id, email: row.email, fullName: row.full_name, phone: row.phone };
}

// POST /api/customers/signup  { email, password, fullName, phone }
router.post('/signup', asyncHandler(async (req, res) => {
  const { email, password, fullName, phone } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'email, password, and fullName are required' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  const existing = await pool.query('SELECT id FROM customers WHERE email = $1', [email.toLowerCase()]);
  if (existing.rows[0]) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO customers (email, password_hash, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING *`,
    [email.toLowerCase(), hash, fullName, phone || null]
  );
  const token = signCustomerToken(rows[0]);
  res.status(201).json({ token, customer: serializeCustomer(rows[0]) });
}));

// POST /api/customers/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const { rows } = await pool.query('SELECT * FROM customers WHERE email = $1', [email.toLowerCase()]);
  const customer = rows[0];
  if (!customer) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, customer.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signCustomerToken(customer);
  res.json({ token, customer: serializeCustomer(customer) });
}));

// GET /api/customers/me
router.get('/me', requireCustomer, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.customer.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'Account not found' });
  res.json(serializeCustomer(rows[0]));
}));

// PUT /api/customers/me  { fullName, phone }
router.put('/me', requireCustomer, asyncHandler(async (req, res) => {
  const { fullName, phone } = req.body;
  const { rows } = await pool.query(
    `UPDATE customers SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = now()
     WHERE id = $3 RETURNING *`,
    [fullName, phone, req.customer.sub]
  );
  res.json(serializeCustomer(rows[0]));
}));

// ===== ADDRESSES =====

// GET /api/customers/me/addresses
router.get('/me/addresses', requireCustomer, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at DESC`,
    [req.customer.sub]
  );
  res.json(rows);
}));

// POST /api/customers/me/addresses
router.post('/me/addresses', requireCustomer, asyncHandler(async (req, res) => {
  const { label, fullName, phone, line1, line2, city, state, postalCode, countryCode, isDefault } = req.body;
  if (!fullName || !line1 || !city || !countryCode) {
    return res.status(400).json({ error: 'fullName, line1, city, and countryCode are required' });
  }

  if (isDefault) {
    await pool.query('UPDATE addresses SET is_default = FALSE WHERE customer_id = $1', [req.customer.sub]);
  }

  const { rows } = await pool.query(
    `INSERT INTO addresses (customer_id, label, full_name, phone, line1, line2, city, state, postal_code, country_code, is_default)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [req.customer.sub, label || 'Home', fullName, phone || null, line1, line2 || null, city, state || null, postalCode || null, countryCode, !!isDefault]
  );
  res.status(201).json(rows[0]);
}));

// PUT /api/customers/me/addresses/:id
router.put('/me/addresses/:id', requireCustomer, asyncHandler(async (req, res) => {
  const { label, fullName, phone, line1, line2, city, state, postalCode, countryCode, isDefault } = req.body;

  if (isDefault) {
    await pool.query('UPDATE addresses SET is_default = FALSE WHERE customer_id = $1', [req.customer.sub]);
  }

  const { rows } = await pool.query(
    `UPDATE addresses SET
       label = COALESCE($1, label), full_name = COALESCE($2, full_name), phone = COALESCE($3, phone),
       line1 = COALESCE($4, line1), line2 = $5, city = COALESCE($6, city), state = $7,
       postal_code = $8, country_code = COALESCE($9, country_code), is_default = COALESCE($10, is_default)
     WHERE id = $11 AND customer_id = $12 RETURNING *`,
    [label, fullName, phone, line1, line2, city, state, postalCode, countryCode, isDefault, req.params.id, req.customer.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Address not found' });
  res.json(rows[0]);
}));

// DELETE /api/customers/me/addresses/:id
router.delete('/me/addresses/:id', requireCustomer, asyncHandler(async (req, res) => {
  await pool.query('DELETE FROM addresses WHERE id = $1 AND customer_id = $2', [req.params.id, req.customer.sub]);
  res.status(204).end();
}));

// ===== ORDER HISTORY =====

// GET /api/customers/me/orders
router.get('/me/orders', requireCustomer, asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
    [req.customer.sub]
  );
  res.json(rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    total: money(r.total_cents),
    displayTotal: r.display_total,
    displayCurrency: r.display_currency,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  })));
}));

export default router;
