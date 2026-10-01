import { Router } from 'express';
import Stripe from 'stripe';
import { catalog } from '../lib/catalog.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

// Prices are looked up server-side; the client only sends product ids and quantities.
router.post('/', requireAuth, async (req, res, next) => {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return res.status(500).json({ error: 'Payments are not configured' });
    const items = Array.isArray(req.body.items) ? req.body.items : [];
    if (!items.length) return res.status(400).json({ error: 'Your cart is empty' });
    const products = await catalog();
    const line_items = items.map(({ id, qty }) => {
      const p = products.find((x) => x.id === Number(id));
      if (!p) throw Object.assign(new Error('An item in your cart is no longer available'), { status: 400 });
      return {
        quantity: Math.min(Math.max(parseInt(qty, 10) || 1, 1), 10),
        price_data: { currency: 'usd', unit_amount: Math.round(p.price * 100),
          product_data: { name: p.title, images: [p.thumbnail] } },
      };
    });
    const base = process.env.CLIENT_URL || 'http://localhost:3000';
    const session = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.create({
      mode: 'payment', line_items, customer_email: req.user.email,
      success_url: `${base}/?checkout=success`, cancel_url: `${base}/?checkout=cancelled`,
    });
    res.json({ url: session.url });
  } catch (e) { next(e); }
});

export default router;
