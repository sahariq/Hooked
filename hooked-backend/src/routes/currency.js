import { Router } from 'express';
import { pool } from '../db/pool.js';
import { asyncHandler, money } from '../utils.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const serializeCountry = (r) => ({
  code: r.code,
  name: r.name,
  defaultCurrency: r.default_currency,
  codAvailable: r.cod_available,
  shippingFlat: money(r.shipping_flat_cents), // in PKR
});

const serializeRate = (r) => ({
  code: r.code,
  name: r.name,
  symbol: r.symbol,
  rateToPkr: Number(r.rate_to_pkr),
});

// GET /api/currency/countries  -> used to populate the "where are you shopping from?" popup
router.get('/countries', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT code, name, default_currency, cod_available, shipping_flat_cents
     FROM countries ORDER BY sort_order ASC`
  );
  res.set('Cache-Control', 'public, max-age=60');
  res.json(rows.map(serializeCountry));
}));

// GET /api/currency/rates  -> fixed rate table (PKR base)
router.get('/rates', asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    `SELECT code, name, symbol, rate_to_pkr FROM currency_rates ORDER BY code ASC`
  );
  res.set('Cache-Control', 'public, max-age=60');
  res.json(rows.map(serializeRate));
}));

// ===== ADMIN =====

// PUT /api/currency/rates/:code
router.put('/rates/:code', requireAdmin, asyncHandler(async (req, res) => {
  // Old check `!rateToPkr || rateToPkr <= 0` let strings like "abc" through and crashed in Postgres
  const rate = typeof req.body?.rateToPkr === 'string' ? Number(req.body.rateToPkr) : req.body?.rateToPkr;
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || rate > 1_000_000) {
    return res.status(400).json({ error: 'rateToPkr must be a positive number' });
  }

  const { rows } = await pool.query(
    `UPDATE currency_rates SET rate_to_pkr = $1, updated_at = now() WHERE code = $2 RETURNING *`,
    [rate, req.params.code.toUpperCase()]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Currency not found' });
  res.json(serializeRate(rows[0]));
}));

// PUT /api/currency/countries/:code  -> update shipping cost / COD availability
router.put('/countries/:code', requireAdmin, asyncHandler(async (req, res) => {
  const { shippingFlat, codAvailable } = req.body || {};

  if (shippingFlat !== undefined && shippingFlat !== null) {
    if (typeof shippingFlat !== 'number' || !Number.isFinite(shippingFlat) || shippingFlat < 0 || shippingFlat > 1_000_000) {
      return res.status(400).json({ error: 'shippingFlat must be a number between 0 and 1,000,000' });
    }
  }
  if (codAvailable !== undefined && codAvailable !== null && typeof codAvailable !== 'boolean') {
    return res.status(400).json({ error: 'codAvailable must be true or false' });
  }

  const { rows } = await pool.query(
    `UPDATE countries SET
       shipping_flat_cents = COALESCE($1, shipping_flat_cents),
       cod_available = COALESCE($2, cod_available)
     WHERE code = $3 RETURNING *`,
    [shippingFlat != null ? Math.round(shippingFlat * 100) : null, codAvailable ?? null, req.params.code.toUpperCase()]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Country not found' });
  res.json(serializeCountry(rows[0]));
}));

export default router;