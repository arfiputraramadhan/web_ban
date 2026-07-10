const nodemailer = require('nodemailer');
const { decrypt } = require('./encryption');
const database = require('./database');

function createTransporter(account) {
  const pass = decrypt(account.encrypted_password);
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: account.email, pass: pass }
  });
}

async function sendAppealEmail(accountId, phone, reason, extraText, templateText = null) {
  const db = database.getDb();
  const account = db.prepare('SELECT * FROM accounts WHERE id = ?').get(accountId);
  if (!account) throw new Error('Akun Gmail tidak ditemukan');

  const { generateText } = require('./textGenerator');
  const { validateAppealText } = require('./validator');

  const fullText = generateText(phone, reason, extraText, templateText);
  const validation = validateAppealText(fullText, reason);
  if (!validation.ok) throw new Error('Validasi gagal: ' + validation.msg);

  const transporter = createTransporter(account);
  await transporter.sendMail({
    from: account.email,
    to: 'support@whatsapp.com',
    subject: `Permohonan Tinjauan Pemblokiran - ${phone}`,
    text: fullText
  });

  db.prepare(`
    INSERT INTO emails_sent (account_id, phone, reason, extra_text, full_text)
    VALUES (?, ?, ?, ?, ?)
  `).run(accountId, phone, reason, extraText, fullText);

  return { success: true };
}

async function sendFollowUps() {
  const db = database.getDb();
  const accounts = db.prepare('SELECT * FROM accounts').all();

  for (const account of accounts) {
    const emails = db.prepare(`
      SELECT * FROM emails_sent
      WHERE account_id = ? AND reply_received = 0 AND follow_up_count < 2
      AND julianday('now') - julianday(sent_at) >= 3
    `).all(account.id);

    for (const email of emails) {
      const followUpText = `Kepada Tim Dukungan WhatsApp,

Merujuk email saya sebelumnya (${new Date(email.sent_at).toLocaleDateString()}) terkait pemblokiran akun ${email.phone}, saya ingin menanyakan perkembangan peninjauan. Saya sangat memerlukan akun tersebut.

Hormat saya,
Pengguna ${email.phone}`;

      try {
        const transporter = createTransporter(account);
        await transporter.sendMail({
          from: account.email,
          to: 'support@whatsapp.com',
          subject: `Follow-Up: Tinjauan Pemblokiran - ${email.phone}`,
          text: followUpText
        });
        db.prepare('UPDATE emails_sent SET follow_up_count = follow_up_count + 1 WHERE id = ?').run(email.id);
      } catch (err) {
        console.error('Gagal follow-up:', err.message);
      }
    }
  }
}

module.exports = { sendAppealEmail, sendFollowUps, createTransporter };
