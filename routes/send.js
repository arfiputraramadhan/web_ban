const express = require('express');
const router = express.Router();
const { sendAppealEmail } = require('../mailer');
const database = require('../database');

router.post('/', async (req, res) => {
  try {
    const db = database.getDb();
    const { account_id, phone, reason, extra, template_id } = req.body;

    if (!account_id || !phone || !reason) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }
    if (!/^\+\d{7,15}$/.test(phone)) {
      return res.status(400).json({ success: false, message: 'Format nomor salah.' });
    }
    if (!['mod', 'spam', 'unknown', 'other'].includes(reason)) {
      return res.status(400).json({ success: false, message: 'Alasan tidak valid.' });
    }

    let templateText = null;
    if (template_id) {
      const template = db.prepare('SELECT template_text FROM templates WHERE id = ?').get(template_id);
      if (template) templateText = template.template_text;
    }

    await sendAppealEmail(account_id, phone, reason, extra || '', templateText);
    res.json({ success: true, message: '✅ Email banding berhasil dikirim!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
