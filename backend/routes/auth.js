const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';

// POST /api/auth/register { username, password }
router.post('/register', async (req,res) => {
  const db = req.db;
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'username and password required' });
  await db.read();
  const exists = db.data.users.find(u => u.username === username);
  if(exists) return res.status(409).json({ error: 'user exists' });
  const hash = await bcrypt.hash(password, 10);
  const user = { id: Date.now().toString(), username, password: hash, created_at: new Date().toISOString() };
  db.data.users.push(user);
  await db.write();
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// POST /api/auth/login { username, password }
router.post('/login', async (req,res) => {
  const db = req.db;
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({ error: 'username and password required' });
  await db.read();
  const user = db.data.users.find(u => u.username === username);
  if(!user) return res.status(401).json({ error: 'invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if(!ok) return res.status(401).json({ error: 'invalid credentials' });
  const token = jwt.sign({ sub: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username } });
});

module.exports = router;