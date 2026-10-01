import jwt from 'jsonwebtoken';

export const secret = () => process.env.JWT_SECRET || 'dev-only-secret';
export const sign = (user) => jwt.sign({ id: user.id, email: user.email }, secret(), { expiresIn: '7d' });

export function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try { req.user = jwt.verify(token, secret()); next(); }
  catch { res.status(401).json({ error: 'Please sign in to continue' }); }
}
