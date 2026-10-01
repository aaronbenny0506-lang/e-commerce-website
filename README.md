# Parcel: E-Commerce MVP

Responsive store with sign-up/sign-in, live product catalog, product detail pages, a cart that survives reloads, and Stripe Checkout.

**Stack:** Node 18+, Express, vanilla ES modules (no build step), Stripe Checkout, JWT auth (bcrypt-hashed passwords), products from the public DummyJSON API.

## Run locally
```bash
npm install
cp .env.example .env     # then add your Stripe TEST secret key (sk_test_...)
npm run dev              # http://localhost:3000
```
Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Structure
```
server/
  index.js            app setup, routing, error handler
  routes/             auth.js, products.js, checkout.js
  middleware/auth.js  JWT sign/verify
  lib/catalog.js      cached catalog; trusted price source
  data/users.json     MVP user store (replace with a database)
public/
  index.html, css/styles.css
  js/api.js           fetch wrapper + session
  js/cart.js          localStorage cart store
  js/main.js          rendering, routing, events
```

## Design decisions
- **Prices are never trusted from the browser.** Checkout receives ids and quantities only and looks prices up server-side.
- **Persistent cart** lives in localStorage and is cleared only after a successful payment.
- **Scaling path:** swap `users.json` for Postgres/Mongo, add a Stripe webhook to record orders, move to a framework (Next.js/React) if the UI grows.

## Deploy (Render, free tier)
New Web Service from this repo. Build: `npm install`. Start: `npm start`. Env vars: `JWT_SECRET`, `STRIPE_SECRET_KEY`, `CLIENT_URL` (your Render URL).
Note: free-tier disks reset, so accounts in `users.json` are wiped on redeploy until a real database is added.
