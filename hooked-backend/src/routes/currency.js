import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/currency/countries  -> used to populate the "where are you shopping from?" popup
router.get('/countries', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT code, name, default_currency, cod_available, shipping_flat_cents
     FROM countries ORDER BY sort_order ASC`
  );
  res.json(rows.map((r) => ({
    code: r.code,
    name: r.name,
    defaultCurrency: r.default_currency,
    codAvailable: r.cod_available,
    shippingFlat: Number((r.shipping_flat_cents / 100).toFixed(2)), // in PKR
  })));
}));

// GET /api/currency/rates  -> fixed rate table (PKR base)
router.get('/rates', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT code, name, symbol, rate_to_pkr FROM currency_rates ORDER BY code ASC`
  );
  res.json(rows.map((r) => ({
    code: r.code,
    name: r.name,
    symbol: r.symbol,
    rateToPkr: Number(r.rate_to_pkr),
  })));
}));

// ===== ADMIN =====

// PUT /api/currency/rates/:code  -> update a single fixed rate
router.put('/rates/:code', requireAdmin, asyncHandler(async (req, res) => {
  const { rateToPkr } = req.body;
  if (!rateToPkr || rateToPkr <= 0) return res.status(400).json({ error: 'rateToPkr must be a positive number' });

  const { rows } = await pool.query(
    `UPDATE currency_rates SET rate_to_pkr = $1, updated_at = now() WHERE code = $2 RETURNING *`,
    [rateToPkr, req.params.code]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Currency not found' });
  res.json(rows[0]);
}));

// PUT /api/currency/countries/:code  -> update shipping cost / COD availability
router.put('/countries/:code', requireAdmin, asyncHandler(async (req, res) => {
  const { shippingFlat, codAvailable } = req.body;
  const { rows } = await pool.query(
    `UPDATE countries SET
       shipping_flat_cents = COALESCE($1, shipping_flat_cents),
       cod_available = COALESCE($2, cod_available)
     WHERE code = $3 RETURNING *`,
    [shippingFlat != null ? Math.round(shippingFlat * 100) : null, codAvailable, req.params.code]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Country not found' });
  res.json(rows[0]);
}));

export default router;
