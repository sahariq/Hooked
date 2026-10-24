import rateLimit from 'express-rate-limit'; // npm i express-rate-limit@^7

const base = {
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
};

// Everything under /api (Safepay webhooks are exempt so retries are never dropped)
export const globalLimiter = rateLimit({
  ...base,
  windowMs: 60 * 1000,
  limit: 300,
  skip: (req) => req.path.startsWith('/orders/webhooks/'),
});

// Login endpoints: 10 failed attempts / 15 min / IP (successful logins don't count)
export const authLimiter = rateLimit({
  ...base,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
});

// Public write endpoints (signup, checkout, custom-order form): 30 / hour / IP
export const writeLimiter = rateLimit({
  ...base,
  windowMs: 60 * 60 * 1000,
  limit: 30,
});
