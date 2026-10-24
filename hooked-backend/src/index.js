// MUST be the first import: ES imports are hoisted, so dotenv.config() further down would run
// AFTER the routers/pool were already loaded and any process.env read at import time would be undefined.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet'; // npm i helmet
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { pool } from './db/pool.js';
import { globalLimiter, authLimiter, writeLimiter } from './middleware/rateLimit.js';

import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import cartRouter from './routes/cart.js';
import ordersRouter from './routes/orders.js';
import customOrdersRouter from './routes/customOrders.js';
import adminRouter from './routes/admin.js';
import customersRouter from './routes/customers.js';
import currencyRouter from './routes/currency.js';

const isProd = process.env.NODE_ENV === 'production';

// ---------- fail fast on bad configuration ----------
(function checkEnv() {
  const problems = [];
  if (!process.env.DATABASE_URL) problems.push('DATABASE_URL is not set');
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    problems.push('JWT_SECRET must be set and at least 32 characters (try: openssl rand -hex 48)');
  }
  if (isProd && !process.env.CORS_ORIGIN) problems.push('CORS_ORIGIN must be set in production');
  if (problems.length) {
    console.error('Invalid configuration:\n - ' + problems.join('\n - '));
    process.exit(1);
  }
  if (isProd && !process.env.SAFEPAY_API_KEY) {
    console.warn('WARNING: SAFEPAY_API_KEY not set - card payments are disabled, only COD orders will work.');
  }
})();

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// Behind Render/Railway/Nginx etc. Required for correct client IPs (rate limiting) and secure cookies.
app.set('trust proxy', Number(process.env.TRUST_PROXY ?? (isProd ? 1 : 0)));

app.use(helmet());
app.use(cors({ origin: allowedOrigins, credentials: true }));

// CSRF defence for cookie auth: browsers always send Origin on cross-site writes.
// Server-to-server calls (Safepay webhook) send no Origin and pass through.
app.use((req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin && !allowedOrigins.includes(origin)) return res.status(403).json({ error: 'Origin not allowed' });
  next();
});

app.use(express.json({
  limit: '100kb',
  // keep the exact bytes: webhook signatures must be verified against the raw body, not JSON.stringify(req.body)
  verify: (req, res, buf) => { req.rawBody = buf; },
}));
app.use(cookieParser());

// Log the path only - query strings can contain emails/tokens
morgan.token('path', (req) => (req.originalUrl || req.url).split('?')[0]);
app.use(morgan(isProd ? ':remote-addr :method :path :status :res[content-length] - :response-time ms' : 'dev'));

// ---------- health ----------
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, service: 'hooked-backend' });
  } catch {
    res.status(503).json({ ok: false, service: 'hooked-backend' });
  }
});

// ---------- rate limits ----------
app.use('/api', globalLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/customers/login', authLimiter);
app.post('/api/customers/signup', writeLimiter);
app.post('/api/custom-orders', writeLimiter);
app.post('/api/orders', writeLimiter);

// ---------- routes ----------
app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/custom-orders', customOrdersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/customers', customersRouter);
app.use('/api/currency', currencyRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

// ---------- central error handler ----------
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  let status = err.status || err.statusCode || 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') { status = 400; message = 'Invalid JSON body'; }
  else if (err.type === 'entity.too.large') { status = 413; message = 'Request body too large'; }
  // Postgres errors -> sensible client errors instead of leaking SQL details as 500s
  else if (err.code === '22P02' || err.code === '22003' || err.code === '22001') { status = 400; message = 'Invalid input'; }
  else if (err.code === '23505') { status = 409; message = 'A record with these details already exists'; }
  else if (err.code === '23503') { status = 400; message = 'Referenced record does not exist'; }
  else if (err.code === '23514' || err.code === '23502') { status = 400; message = 'Invalid input'; }

  if (status >= 500) {
    console.error(err);
    message = 'Internal server error'; // never expose internals
  }
  res.status(status).json({ error: message });
});

// ---------- start + graceful shutdown ----------
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
  console.log(`Hooked backend listening on port ${PORT} (${isProd ? 'production' : 'development'})`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));