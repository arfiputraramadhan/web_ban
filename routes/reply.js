const express = require('express');
const router = express.Router();
const database = require('../database');
const { checkInboxForReply } = require('../imapChecker');

router.get('/check/:accountId', async (req, res) => {
  try {
    const db = database.getDb();
    const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.accountId);
    if (!account) return res.status(404).json({ success: false, message: 'Akun tidak ditemukan.' });

    const replies = await checkInboxForReply(account);
    res.json({ success: true, replies, hasNew: replies.length > 0 });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/history/:accountId?', (req, res) => {
  const db = database.getDb();
  let rows;
  if (req.params.accountId) {
    rows = db.prepare('SELECT * FROM emails_sent WHERE account_id = ? ORDER BY sent_at DESC').all(req.params.accountId);
  } else {
    rows = db.prepare('SELECT * FROM emails_sent ORDER BY sent_at DESC').all();
  }
  res.json(rows);
});

module.exports = router;
