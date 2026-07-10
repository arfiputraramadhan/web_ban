const express = require('express');
const router = express.Router();
const { encrypt } = require('../encryption');
const database = require('../database');

router.post('/', (req, res) => {
  const db = database.getDb();
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib.' });

  try {
    const encrypted = encrypt(password);
    db.prepare('INSERT INTO accounts (email, encrypted_password) VALUES (?, ?)').run(email, encrypted);
    res.json({ success: true, message: 'Akun Gmail ditambahkan.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', (req, res) => {
  const db = database.getDb();
  const accounts = db.prepare('SELECT id, email, is_default, created_at FROM accounts').all();
  res.json(accounts);
});

router.delete('/:id', (req, res) => {
  const db = database.getDb();
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/:id/default', (req, res) => {
  const db = database.getDb();
  db.prepare('UPDATE accounts SET is_default = 0').run();
  db.prepare('UPDATE accounts SET is_default = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
