import crypto from 'node:crypto';

/** Throw from anywhere in a route; the central error handler returns `message` for status < 500. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export const money = (cents) => Number((Number(cents) / 100).toFixed(2));

// ---------- validation helpers ----------
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_RE = /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]+$/;

export const isUuid = (v) => typeof v === 'string' && UUID_RE.test(v);
export const isEmail = (v) => typeof v === 'string' && v.length <= 254 && EMAIL_RE.test(v);

/** Non-empty (after trim) string no longer than `max`. */
export const isStr = (v, max, min = 1) =>
  typeof v === 'string' && v.trim().length >= min && v.length <= max;

/** Returns an integer within [min, max], or null if invalid (0 is a valid result - compare with === null). */
export function toInt(v, { min = -Infinity, max = Infinity } = {}) {
  const n = typeof v === 'string' && v.trim() !== '' ? Number(v) : v;
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

/** Parses ?limit / ?offset query params safely. */
export function parsePaging(query, { defaultLimit = 100, maxLimit = 500 } = {}) {
  const limit = toInt(query.limit, { min: 1, max: maxLimit }) ?? defaultLimit;
  const offset = toInt(query.offset, { min: 0, max: 1_000_000 }) ?? 0;
  return { limit, offset };
}

// ---------- order numbers ----------
// 31-char alphabet without look-alikes (no 0/O, 1/I/L). 31^6 ≈ 887M combinations per day.
// Keep a UNIQUE index on orders.order_number as the final safety net.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateOrderNumber() {
  const d = new Date();
  const stamp = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `HK-${stamp}-${suffix}`;
}