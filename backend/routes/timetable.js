const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../db/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Everyone can view the shared timetable
router.get('/', authMiddleware, (req, res) => {
  const rows = all('SELECT * FROM timetable ORDER BY day, start_time', []);
  res.json(rows);
});

// Admin only: add a class
router.post('/', adminMiddleware, (req, res) => {
  const { subject, teacher, room, day, start_time, end_time, color } = req.body;
  if (!subject || !day || !start_time || !end_time)
    return res.status(400).json({ error: 'Required fields missing' });
  const id = uuidv4();
  run('INSERT INTO timetable (id, user_id, subject, teacher, room, day, start_time, end_time, color) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, req.user.id, subject, teacher || '', room || '', day, start_time, end_time, color || '#4F46E5']);
  res.json(get('SELECT * FROM timetable WHERE id = ?', [id]));
});

// Admin only: update a class
router.put('/:id', adminMiddleware, (req, res) => {
  const { subject, teacher, room, day, start_time, end_time, color } = req.body;
  const entry = get('SELECT * FROM timetable WHERE id = ?', [req.params.id]);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  run('UPDATE timetable SET subject=?, teacher=?, room=?, day=?, start_time=?, end_time=?, color=? WHERE id=?',
    [subject, teacher, room, day, start_time, end_time, color, req.params.id]);
  res.json(get('SELECT * FROM timetable WHERE id = ?', [req.params.id]));
});

// Admin only: delete a class
router.delete('/:id', adminMiddleware, (req, res) => {
  const entry = get('SELECT * FROM timetable WHERE id = ?', [req.params.id]);
  if (!entry) return res.status(404).json({ error: 'Not found' });
  run('DELETE FROM timetable WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
