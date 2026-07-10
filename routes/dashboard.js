const express = require('express');
const router = express.Router();
const database = require('../database');

router.get('/stats', (req, res) => {
  const db = database.getDb();
  const totalSent = db.prepare('SELECT COUNT(*) as count FROM emails_sent').get().count;
  const replied = db.prepare('SELECT COUNT(*) as count FROM emails_sent WHERE reply_received = 1').get().count;
  const accounts = db.prepare('SELECT COUNT(*) as count FROM accounts').get().count;
  res.json({ totalSent, replied, accounts });
});

router.get('/export-csv', (req, res) => {
  const db = database.getDb();
  const rows = db.prepare('SELECT * FROM emails_sent').all();
  let csv = 'ID,Phone,Reason,Sent At,Status,Reply\n';
  rows.forEach(r => {
    csv += `${r.id},${r.phone},${r.reason},${r.sent_at},${r.status},${r.reply_received ? 'Yes' : 'No'}\n`;
  });
  res.header('Content-Type', 'text/csv');
  res.attachment('banding_history.csv');
  res.send(csv);
});

module.exports = router;
