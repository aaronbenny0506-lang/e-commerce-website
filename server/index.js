import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import auth from './routes/auth.js';
import products from './routes/products.js';
import checkout from './routes/checkout.js';

const app = express();
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../public');

app.use(express.json());
app.use('/api/auth', auth);
app.use('/api/products', products);
app.use('/api/checkout', checkout);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
app.use(express.static(publicDir));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

app.listen(process.env.PORT || 3000, () => console.log('Parcel running on port', process.env.PORT || 3000));
