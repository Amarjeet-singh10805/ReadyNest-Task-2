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
  const rows = all(`
    SELECT n.*, u.name as admin_name FROM notices n
    JOIN users u ON n.admin_id = u.id
    ORDER BY n.created_at DESC
  `, []);
  res.json(rows);
});

router.post('/', upload.single('attachment'), (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const { title, content, category } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
  const id = uuidv4();
  const attachment = req.file ? `/uploads/${req.file.filename}` : null;
  run('INSERT INTO notices (id, admin_id, title, content, category, attachment) VALUES (?,?,?,?,?,?)',
    [id, req.user.id, title, content, category || 'general', attachment]);
  const notice = get('SELECT n.*, u.name as admin_name FROM notices n JOIN users u ON n.admin_id = u.id WHERE n.id = ?', [id]);
  res.json(notice);
});

router.delete('/:id', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  run('DELETE FROM notices WHERE id = ?', [req.params.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
