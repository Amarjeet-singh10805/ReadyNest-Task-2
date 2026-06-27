const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { get, all, run } = require('../db/database');
const { authMiddleware } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();
router.use(authMiddleware);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const rows = all('SELECT * FROM assignments WHERE user_id = ? ORDER BY due_date ASC', [req.user.id]);
  res.json(rows);
});

router.post('/', upload.single('attachment'), (req, res) => {
  const { title, subject, description, due_date, priority } = req.body;
  if (!title || !subject || !due_date) return res.status(400).json({ error: 'Required fields missing' });
  const id = uuidv4();
  const attachment = req.file ? `/uploads/${req.file.filename}` : null;
  run('INSERT INTO assignments (id, user_id, title, subject, description, due_date, priority, attachment) VALUES (?,?,?,?,?,?,?,?)',
    [id, req.user.id, title, subject, description || '', due_date, priority || 'medium', attachment]);
  res.json(get('SELECT * FROM assignments WHERE id = ?', [id]));
});

router.put('/:id', upload.single('attachment'), (req, res) => {
  const { title, subject, description, due_date, priority, status } = req.body;
  const existing = get('SELECT * FROM assignments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const attachment = req.file ? `/uploads/${req.file.filename}` : existing.attachment;
  run('UPDATE assignments SET title=?, subject=?, description=?, due_date=?, priority=?, status=?, attachment=? WHERE id=?',
    [title, subject, description, due_date, priority, status || existing.status, attachment, req.params.id]);
  res.json(get('SELECT * FROM assignments WHERE id = ?', [req.params.id]));
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  const existing = get('SELECT * FROM assignments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  run('UPDATE assignments SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json(get('SELECT * FROM assignments WHERE id = ?', [req.params.id]));
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM assignments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
