import { Router } from 'express';
import { catalog } from '../lib/catalog.js';

const router = Router();

router.get('/categories', async (_req, res, next) => {
  try { res.json([...new Set((await catalog()).map((p) => p.category))].sort()); } catch (e) { next(e); }
});

router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toLowerCase();
    res.json((await catalog()).filter((p) =>
      (!req.query.category || p.category === req.query.category) &&
      (!q || `${p.title} ${p.brand} ${p.category}`.toLowerCase().includes(q))));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = (await catalog()).find((x) => x.id === Number(req.params.id));
    p ? res.json(p) : res.status(404).json({ error: 'Product not found' });
  } catch (e) { next(e); }
});

export default router;
