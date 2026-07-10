const express = require('express');
const router = express.Router();
const db = require('../database').getDb();
const { checkInboxForReply } = require('../imapChecker');

// Cek balasan manual untuk sebuah akun
router.get('/check/:accountId', async (req, res) => {
  try {
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.accountId);
    if (!account) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });

    const replies = await checkInboxForReply(account);
    const hasNew = replies.length > 0;
    res.json({ success: true, replies, hasNew });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Dapatkan riwayat email untuk akun tertentu (untuk tabel)
router.get('/history/:accountId?', (req, res) => {
  let rows;
  if (req.params.accountId) {
    rows = db.prepare('SELECT * FROM emails_sent WHERE account_id = ? ORDER BY sent_at DESC').all(req.params.accountId);
  } else {
    rows = db.prepare('SELECT * FROM emails_sent ORDER BY sent_at DESC').all();
  }
  res.json(rows);
});

module.exports = router;