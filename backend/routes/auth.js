const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { get, run } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'campus_secret_2024';

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, department, year, roll_number, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });
    
    const existing = get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    
    const hashed = await bcrypt.hash(password, 10);
    const id = uuidv4();
    run(
      'INSERT INTO users (id, name, email, password, role, department, year, roll_number, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, name, email, hashed, role || 'student', department || '', year || '', roll_number || '', phone || '']
    );
    
    const token = jwt.sign({ id, email, role: role || 'student', name }, JWT_SECRET, { expiresIn: '7d' });
    const user = get('SELECT id, name, email, role, department, year, roll_number, phone, avatar, bio FROM users WHERE id = ?', [id]);
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get profile
router.get('/me', authMiddleware, (req, res) => {
  const user = get('SELECT id, name, email, role, department, year, roll_number, phone, avatar, bio, created_at FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, department, year, roll_number, bio, avatar } = req.body;
    run(
      'UPDATE users SET name=?, phone=?, department=?, year=?, roll_number=?, bio=?, avatar=? WHERE id=?',
      [name, phone, department, year, roll_number, bio, avatar, req.user.id]
    );
    const user = get('SELECT id, name, email, role, department, year, roll_number, phone, avatar, bio FROM users WHERE id = ?', [req.user.id]);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Change password
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password incorrect' });
    
    const hashed = await bcrypt.hash(newPassword, 10);
    run('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: get all users
router.get('/users', authMiddleware, (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const users = require('../db/database').all('SELECT id, name, email, role, department, year, roll_number, created_at FROM users', []);
  res.json(users);
});

module.exports = router;
