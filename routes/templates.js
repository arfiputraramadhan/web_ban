const express = require('express');
const router = express.Router();
const database = require('../database');

router.get('/', (req, res) => {
  const db = database.getDb();
  const templates = db.prepare('SELECT * FROM templates ORDER BY id').all();
  res.json(templates);
});

router.post('/', (req, res) => {
  const db = database.getDb();
  const { name, reason, template_text } = req.body;
  if (!name || !template_text) return res.status(400).json({ success: false, message: 'Nama dan teks wajib.' });
  db.prepare('INSERT INTO templates (name, reason, template_text) VALUES (?, ?, ?)').run(name, reason || 'other', template_text);
  res.json({ success: true, message: 'Template disimpan.' });
});

router.delete('/:id', (req, res) => {
  const db = database.getDb();
  const t = db.prepare('SELECT is_default FROM templates WHERE id = ?').get(req.params.id);
  if (t && t.is_default) return res.status(403).json({ success: false, message: 'Template default tidak bisa dihapus.' });
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
