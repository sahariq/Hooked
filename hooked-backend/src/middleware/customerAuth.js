import jwt from 'jsonwebtoken';

function readCustomer(req) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return payload.type === 'customer' ? payload : null;
  } catch {
    return null;
  }
}

export function requireCustomer(req, res, next) {
  const payload = readCustomer(req);
  if (!payload) return res.status(401).json({ error: 'Authentication required' });
  req.customer = payload; // { sub, email, type }
  next();
}

/** Guest checkout allowed: attaches req.customer if a valid token is sent, otherwise continues as guest. */
export function optionalCustomer(req, res, next) {
  const payload = readCustomer(req);
  if (payload) req.customer = payload;
  next();
}