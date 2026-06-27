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
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

router.get('/', (req, res) => {
  const rows = all('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC', [req.user.id]);
  res.json(rows.map(n => ({ ...n, tags: n.tags ? JSON.parse(n.tags) : [], attachments: n.attachments ? JSON.parse(n.attachments) : [] })));
});

router.post('/', upload.array('attachments', 5), (req, res) => {
  const { title, content, category, color, tags } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const id = uuidv4();
  const attachments = req.files ? req.files.map(f => ({ name: f.originalname, url: `/uploads/${f.filename}`, size: f.size })) : [];
  run('INSERT INTO notes (id, user_id, title, content, category, color, tags, attachments) VALUES (?,?,?,?,?,?,?,?)',
    [id, req.user.id, title, content || '', category || 'general', color || '#FEF3C7',
     JSON.stringify(tags ? (Array.isArray(tags) ? tags : [tags]) : []),
     JSON.stringify(attachments)]);
  const note = get('SELECT * FROM notes WHERE id = ?', [id]);
  res.json({ ...note, tags: JSON.parse(note.tags || '[]'), attachments: JSON.parse(note.attachments || '[]') });
});

router.put('/:id', upload.array('attachments', 5), (req, res) => {
  const existing = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { title, content, category, color, tags } = req.body;
  const existingAttachments = existing.attachments ? JSON.parse(existing.attachments) : [];
  const newAttachments = req.files ? req.files.map(f => ({ name: f.originalname, url: `/uploads/${f.filename}`, size: f.size })) : [];
  const allAttachments = [...existingAttachments, ...newAttachments];
  run('UPDATE notes SET title=?, content=?, category=?, color=?, tags=?, attachments=?, updated_at=datetime(\'now\') WHERE id=?',
    [title, content, category, color, JSON.stringify(tags ? (Array.isArray(tags) ? tags : [tags]) : []), JSON.stringify(allAttachments), req.params.id]);
  const note = get('SELECT * FROM notes WHERE id = ?', [req.params.id]);
  res.json({ ...note, tags: JSON.parse(note.tags || '[]'), attachments: JSON.parse(note.attachments || '[]') });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM notes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
});

module.exports = router;
