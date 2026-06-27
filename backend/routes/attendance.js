const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Student: view own attendance records
router.get('/', (req, res) => {
  const rows = all('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC', [req.user.id]);
  res.json(rows);
});

// Student: view own attendance stats
router.get('/stats', (req, res) => {
  const rows = all('SELECT subject, status, COUNT(*) as count FROM attendance WHERE user_id = ? GROUP BY subject, status', [req.user.id]);
  const stats = {};
  rows.forEach(row => {
    if (!stats[row.subject]) stats[row.subject] = { present: 0, absent: 0, late: 0, total: 0 };
    stats[row.subject][row.status] = (stats[row.subject][row.status] || 0) + Number(row.count);
    stats[row.subject].total += Number(row.count);
  });
  Object.keys(stats).forEach(s => {
    stats[s].percentage = Math.round((stats[s].present / stats[s].total) * 100) || 0;
  });
  res.json(stats);
});

// Admin: get all students list (for attendance marking)
router.get('/students', adminMiddleware, (req, res) => {
  const students = all("SELECT id, name, email, roll_number, department, year FROM users WHERE role = 'student' ORDER BY name", []);
  res.json(students);
});

// Admin: get attendance for a specific student
router.get('/student/:studentId', adminMiddleware, (req, res) => {
  const rows = all('SELECT * FROM attendance WHERE user_id = ? ORDER BY date DESC', [req.params.studentId]);
  res.json(rows);
});

// Admin: get attendance stats for a specific student
router.get('/student/:studentId/stats', adminMiddleware, (req, res) => {
  const rows = all('SELECT subject, status, COUNT(*) as count FROM attendance WHERE user_id = ? GROUP BY subject, status', [req.params.studentId]);
  const stats = {};
  rows.forEach(row => {
    if (!stats[row.subject]) stats[row.subject] = { present: 0, absent: 0, late: 0, total: 0 };
    stats[row.subject][row.status] = (stats[row.subject][row.status] || 0) + Number(row.count);
    stats[row.subject].total += Number(row.count);
  });
  Object.keys(stats).forEach(s => {
    stats[s].percentage = Math.round((stats[s].present / stats[s].total) * 100) || 0;
  });
  res.json(stats);
});

// Admin: mark attendance for any student
router.post('/', adminMiddleware, (req, res) => {
  const { user_id, subject, date, status } = req.body;
  if (!user_id || !subject || !date || !status) return res.status(400).json({ error: 'Required fields missing (user_id, subject, date, status)' });

  // Verify target user is a student
  const targetUser = get("SELECT id, role FROM users WHERE id = ?", [user_id]);
  if (!targetUser) return res.status(404).json({ error: 'Student not found' });
  if (targetUser.role !== 'student') return res.status(400).json({ error: 'Can only mark attendance for students' });

  const existing = get('SELECT * FROM attendance WHERE user_id = ? AND subject = ? AND date = ?', [user_id, subject, date]);
  if (existing) {
    run('UPDATE attendance SET status = ? WHERE id = ?', [status, existing.id]);
    return res.json(get('SELECT * FROM attendance WHERE id = ?', [existing.id]));
  }
  const id = uuidv4();
  run('INSERT INTO attendance (id, user_id, subject, date, status) VALUES (?,?,?,?,?)',
    [id, user_id, subject, date, status]);
  res.json(get('SELECT * FROM attendance WHERE id = ?', [id]));
});

// Admin: delete an attendance record for any student
router.delete('/:id', adminMiddleware, (req, res) => {
  const record = get('SELECT * FROM attendance WHERE id = ?', [req.params.id]);
  if (!record) return res.status(404).json({ error: 'Record not found' });
  run('DELETE FROM attendance WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
