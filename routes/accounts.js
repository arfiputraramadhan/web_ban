const express = require('express');
const router = express.Router();
const { encrypt, decrypt } = require('../encryption');
const db = require('../database').getDb();

// Tambah akun Gmail
router.post('/', (req, res) => {
  const { email, password } = req.body; // password = App Password Gmail
  if (!email || !password) return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });

  try {
    const encrypted = encrypt(password);
    db.prepare('INSERT INTO accounts (email, encrypted_password) VALUES (?, ?)').run(email, encrypted);
    res.json({ success: true, message: 'Akun Gmail berhasil ditambahkan.' });
  } catch (err) {
    if (err.message.includes('UNIQUE')) return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    res.status(500).json({ success: false, message: err.message });
  }
});

// Daftar semua akun (tanpa password)
router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT id, email, is_default, created_at FROM accounts').all();
  res.json(accounts);
});

// Hapus akun
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Set akun default
router.put('/:id/default', (req, res) => {
  db.prepare('UPDATE accounts SET is_default = 0').run();
  db.prepare('UPDATE accounts SET is_default = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;