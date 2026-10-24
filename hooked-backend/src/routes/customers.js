import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { withTransaction } from '../db/tx.js';
import { asyncHandler, money, isEmail, isStr, HttpError } from '../utils.js';
import { requireCustomer } from '../middleware/customerAuth.js';

const router = Router();

const BCRYPT_ROUNDS = 12;
// Compared against when the email is unknown so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);
const PHONE_RE = /^[0-9+()\-\s]{6,30}$/;

function signCustomerToken(customer) {
  return jwt.sign(
    { sub: customer.id, email: customer.email, type: 'customer' },
    process.env.JWT_SECRET,
    { expiresIn: '7d', algorithm: 'HS256' } // was 30d with no way to revoke
  );
}

function serializeCustomer(row) {
  return { id: row.id, email: row.email, fullName: row.full_name, phone: row.phone };
}

const optionalString = (v, max, field) => {
  if (v === undefined || v === null || v === '') return null;
  if (typeof v !== 'string' || v.length > max) throw new HttpError(400, `${field} must be a string up to ${max} characters`);
  return v.trim();
};

function parsePhone(v) {
  const phone = optionalString(v, 30, 'phone');
  if (phone && !PHONE_RE.test(phone)) throw new HttpError(400, 'phone number is not valid');
  return phone;
}

// POST /api/customers/signup  { email, password, fullName, phone }
router.post('/signup', asyncHandler(async (req, res) => {
  const { password, fullName } = req.body || {};
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';

  if (!isEmail(email) || typeof password !== 'string' || !isStr(fullName, 100)) {
    return res.status(400).json({ error: 'A valid email, password, and fullName are required' });
  }
  // bcrypt only uses the first 72 bytes; reject longer passwords instead of silently truncating
  if (password.length < 8 || Buffer.byteLength(password) > 72) {
    return res.status(400).json({ error: 'Password must be 8-72 characters' });
  }
  const phone = parsePhone(req.body.phone);

  const existing = await pool.query('SELECT id FROM customers WHERE email = $1', [email]);
  if (existing.rows[0]) return res.status(409).json({ error: 'An account with this email already exists' });

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  // a simultaneous duplicate signup hits the UNIQUE constraint -> 23505 -> 409 from the error handler
  const { rows } = await pool.query(
    `INSERT INTO customers (email, password_hash, full_name, phone) VALUES ($1,$2,$3,$4) RETURNING *`,
    [email, hash, fullName.trim(), phone]
  );
  res.status(201).json({ token: signCustomerToken(rows[0]), customer: serializeCustomer(rows[0]) });
}));

// POST /api/customers/login  { email, password }
router.post('/login', asyncHandler(async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (Buffer.byteLength(password) > 72) return res.status(401).json({ error: 'Invalid email or password' });

  const { rows } = await pool.query('SELECT * FROM customers WHERE email = $1', [email]);
  const customer = rows[0];
  const valid = await bcrypt.compare(password, customer?.password_hash ?? DUMMY_HASH);
  if (!customer || !valid) return res.status(401).json({ error: 'Invalid email or password' });

  res.json({ token: signCustomerToken(customer), customer: serializeCustomer(customer) });
}));

// GET /api/customers/me
router.get('/me', requireCustomer, asyncHandler(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.customer.sub]);
  if (!rows[0]) return res.status(404).json({ error: 'Account not found' });
  res.json(serializeCustomer(rows[0]));
}));

// PUT /api/customers/me  { fullName, phone }
router.put('/me', requireCustomer, asyncHandler(async (req, res) => {
  const { fullName } = req.body || {};
  if (fullName !== undefined && !isStr(fullName, 100)) {
    return res.status(400).json({ error: 'fullName must be 1-100 characters' });
  }
  const phone = req.body?.phone === undefined ? null : parsePhone(req.body.phone);

  const { rows } = await pool.query(
    `UPDATE customers SET full_name = COALESCE($1, full_name), phone = COALESCE($2, phone), updated_at = now()
     WHERE id = $3 RETURNING *`,
    [fullName?.trim() ?? null, phone, req.customer.sub]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Account not found' }); // used to crash with a TypeError
  res.json(serializeCustomer(rows[0]));
}));

// ===== ADDRESSES =====

async function parseAddress(b, { partial }) {
  const need = (v, max, field) => {
    if (v === undefined && partial) return null;
    if (!isStr(v, max)) throw new HttpError(400, `${field} is required (max ${max} chars)`);
    return v.trim();
  };
  const out = {
    label: optionalString(b.label, 50, 'label'),
    fullName: need(b.fullName, 100, 'fullName'),
    phone: parsePhone(b.phone),
    line1: need(b.line1, 200, 'line1'),
    line2: optionalString(b.line2, 200, 'line2'),
    city: need(b.city, 100, 'city'),
    state: optionalString(b.state, 100, 'state'),
    postalCode: optionalString(b.postalCode, 20, 'postalCode'),
    countryCode: need(b.countryCode, 3, 'countryCode')?.toUpperCase() ?? null,
    isDefault: typeof b.isDefault === 'boolean' ? b.isDefault : null,
  };
  if (out.countryCode) {
    const c = await pool.query('SELECT 1 FROM countries WHERE code = $1', [out.countryCode]);
    if (!c.rows[0]) throw new HttpError(400, 'Unsupported countryCode');
  }
  return out;
}

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
  const a = await parseAddress(req.body || {}, { partial: false });
  const count = await pool.query('SELECT COUNT(*) FROM addresses WHERE customer_id = $1', [req.customer.sub]);
  if (Number(count.rows[0].count) >= 20) return res.status(400).json({ error: 'Address limit reached' });

  const row = await withTransaction(async (client) => {
    if (a.isDefault) await client.query('UPDATE addresses SET is_default = FALSE WHERE customer_id = $1', [req.customer.sub]);
    const { rows } = await client.query(
      `INSERT INTO addresses (customer_id, label, full_name, phone, line1, line2, city, state, postal_code, country_code, is_default)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [req.customer.sub, a.label || 'Home', a.fullName, a.phone, a.line1, a.line2, a.city, a.state, a.postalCode, a.countryCode, !!a.isDefault]
    );
    return rows[0];
  });
  res.status(201).json(row);
}));

// PUT /api/customers/me/addresses/:id
router.put('/me/addresses/:id', requireCustomer, asyncHandler(async (req, res) => {
  const a = await parseAddress(req.body || {}, { partial: true });

  // transaction: the old code cleared the current default BEFORE checking the address existed,
  // so a bad id left the customer with no default address at all
  const row = await withTransaction(async (client) => {
    if (a.isDefault) {
      await client.query('UPDATE addresses SET is_default = FALSE WHERE customer_id = $1 AND id <> $2', [req.customer.sub, req.params.id]);
    }
    const { rows } = await client.query(
      // line2/state/postal_code used to be overwritten with NULL on every partial update; now they keep their value unless sent
      `UPDATE addresses SET
         label = COALESCE($1, label), full_name = COALESCE($2, full_name), phone = COALESCE($3, phone),
         line1 = COALESCE($4, line1), line2 = COALESCE($5, line2), city = COALESCE($6, city), state = COALESCE($7, state),
         postal_code = COALESCE($8, postal_code), country_code = COALESCE($9, country_code), is_default = COALESCE($10, is_default)
       WHERE id = $11 AND customer_id = $12 RETURNING *`,
      [a.label, a.fullName, a.phone, a.line1, a.line2, a.city, a.state, a.postalCode, a.countryCode, a.isDefault, req.params.id, req.customer.sub]
    );
    if (!rows[0]) throw new HttpError(404, 'Address not found');
    return rows[0];
  });
  res.json(row);
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
    `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 200`,
    [req.customer.sub]
  );
  res.json(rows.map((r) => ({
    id: r.id,
    orderNumber: r.order_number,
    total: money(r.total_cents),
    displayTotal: r.display_total != null ? Number(r.display_total) : null,
    displayCurrency: r.display_currency,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    createdAt: r.created_at,
  })));
}));

export default router;