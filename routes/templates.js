const express = require('express');
const router = express.Router();
const db = require('../database').getDb();

// Dapatkan semua template
router.get('/', (req, res) => {
  const templates = db.prepare('SELECT * FROM templates ORDER BY id').all();
  res.json(templates);
});

// Tambah template baru
router.post('/', (req, res) => {
  const { name, reason, template_text } = req.body;
  if (!name || !template_text) return res.status(400).json({ success: false, message: 'Nama dan teks template wajib.' });
  db.prepare('INSERT INTO templates (name, reason, template_text) VALUES (?, ?, ?)').run(name, reason || 'other', template_text);
  res.json({ success: true, message: 'Template disimpan.' });
});

// Hapus template (kecuali default)
router.delete('/:id', (req, res) => {
  const t = db.prepare('SELECT is_default FROM templates WHERE id = ?').get(req.params.id);
  if (t && t.is_default) return res.status(403).json({ success: false, message: 'Template default tidak dapat dihapus.' });
  db.prepare('DELETE FROM templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;