import jwt from 'jsonwebtoken';

export function requireCustomer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.hooked_customer_token;

  if (!token) return res.status(401).json({ error: 'Not signed in' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'customer') return res.status(401).json({ error: 'Invalid token' });
    req.customer = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// like requireCustomer, but doesn't fail if there's no token — just attaches req.customer if present.
// used for guest-checkout-friendly routes (e.g. creating an order either as guest or logged-in customer)
export function optionalCustomer(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.hooked_customer_token;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type === 'customer') req.customer = payload;
  } catch {
    // ignore invalid token on optional routes
  }
  next();
}
