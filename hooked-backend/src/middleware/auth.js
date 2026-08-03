import jwt from 'jsonwebtoken';

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : req.cookies?.hooked_admin_token;

  if (!token) {
    return res.status(401).json({ error: 'Missing admin token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== 'admin') return res.status(401).json({ error: 'Invalid admin token' });
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
