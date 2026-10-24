import jwt from 'jsonwebtoken';

export const ADMIN_COOKIE = 'hooked_admin_token';

function readAdmin(req) {
  const header = req.headers.authorization;
  const token = header?.startsWith('Bearer ') ? header.slice(7) : req.cookies?.[ADMIN_COOKIE];
  if (!token) return null;
  try {
    // Pin the algorithm and REQUIRE type === 'admin': customer tokens are signed with the
    // same secret, so without this check any customer could call admin endpoints.
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    return payload.type === 'admin' ? payload : null;
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const payload = readAdmin(req);
  if (!payload) return res.status(401).json({ error: 'Admin authentication required' });
  req.admin = { id: payload.sub, email: payload.email };
  next();
}

/** Attaches req.admin when a valid admin token is present; never rejects. */
export function optionalAdmin(req, res, next) {
  const payload = readAdmin(req);
  if (payload) req.admin = { id: payload.sub, email: payload.email };
  next();
}