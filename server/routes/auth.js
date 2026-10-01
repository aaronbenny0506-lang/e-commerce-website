import { Router } from 'express';
import bcrypt from 'bcryptjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { sign, requireAuth } from '../middleware/auth.js';

// MVP storage: a JSON file. Swap read/write for a database (Postgres, MongoDB) in production.
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../data/users.json');
const read = async () => JSON.parse(await fs.readFile(file, 'utf8').catch(() => '[]'));
const write = (u) => fs.writeFile(file, JSON.stringify(u, null, 2));
const pub = (u) => ({ id: u.id, name: u.name, email: u.email });
const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { name = '', email = '', password = '' } = req.body;
    const mail = email.trim().toLowerCase();
    if (!name.trim() || !/^\S+@\S+\.\S+$/.test(mail)) return res.status(400).json({ error: 'Enter your name and a valid email' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    const users = await read();
    if (users.some((u) => u.email === mail)) return res.status(409).json({ error: 'An account with this email already exists' });
    const user = { id: randomUUID(), name: name.trim(), email: mail, hash: await bcrypt.hash(password, 10) };
    await write([...users, user]);
    res.status(201).json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const mail = (req.body.email || '').trim().toLowerCase();
    const user = (await read()).find((u) => u.email === mail);
    if (!user || !(await bcrypt.compare(req.body.password || '', user.hash)))
      return res.status(401).json({ error: 'Email or password is incorrect' });
    res.json({ token: sign(user), user: pub(user) });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, async (req, res) => {
  const user = (await read()).find((u) => u.id === req.user.id);
  user ? res.json({ user: pub(user) }) : res.status(401).json({ error: 'Account not found' });
});

export default router;
