const express = require('express');
const router = express.Router();
const { sendAppealEmail } = require('../mailer');
const db = require('../database').getDb();

router.post('/', async (req, res) => {
  try {
    const { account_id, phone, reason, extra, template_id } = req.body;
    if (!account_id || !phone || !reason) return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    if (!/^\+\d{7,15}$/.test(phone)) return res.status(400).json({ success: false, message: 'Format nomor salah.' });
    const allowedReasons = ['mod', 'spam', 'unknown', 'other'];
    if (!allowedReasons.includes(reason)) return res.status(400).json({ success: false, message: 'Alasan tidak valid.' });

    // Ambil template jika disediakan
    let templateText = null;
    if (template_id) {
      const template = db.prepare('SELECT template_text FROM templates WHERE id = ?').get(template_id);
      if (template) templateText = template.template_text;
    }

    await sendAppealEmail(account_id, phone, reason, extra || '', templateText);
    res.json({ success: true, message: '✅ Email banding berhasil dikirim! Silakan pantau balasan.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message || 'Gagal mengirim email.' });
  }
});

module.exports = router;
