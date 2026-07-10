const Imap = require('imap');
const { simpleParser } = require('mailparser');
const { decrypt } = require('./encryption');
const database = require('./database');

function checkInboxForReply(account) {
  return new Promise((resolve, reject) => {
    const pass = decrypt(account.encrypted_password);
    const imap = new Imap({
      user: account.email,
      password: pass,
      host: 'imap.gmail.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err) => {
        if (err) { imap.end(); return reject(err); }

        const since = new Date();
        since.setDate(since.getDate() - 7);
        imap.search([['FROM', 'support@whatsapp.com'], ['SINCE', since.toISOString()]], (err, results) => {
          if (err || !results || results.length === 0) {
            imap.end();
            return resolve([]);
          }

          const replies = [];
          const fetch = imap.fetch(results, { bodies: '' });
          let count = results.length;

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) return;
                replies.push({
                  from: parsed.from?.text,
                  subject: parsed.subject,
                  date: parsed.date,
                  text: parsed.text?.substring(0, 500) + '...'
                });
                count--;
                if (count === 0) { imap.end(); resolve(replies); }
              });
            });
          });

          fetch.once('error', (err) => { imap.end(); reject(err); });
        });
      });
    });

    imap.once('error', (err) => reject(err));
    imap.connect();
  });
}

async function checkForReplies() {
  const db = database.getDb();
  const accounts = db.prepare('SELECT * FROM accounts').all();

  for (const acc of accounts) {
    try {
      const replies = await checkInboxForReply(acc);
      if (replies.length > 0) {
        const latestReply = replies[replies.length - 1];
        const pendingEmails = db.prepare('SELECT id FROM emails_sent WHERE account_id = ? AND reply_received = 0').all(acc.id);
        for (const em of pendingEmails) {
          db.prepare('UPDATE emails_sent SET reply_received = 1, reply_content = ? WHERE id = ?').run(latestReply.text, em.id);
        }
      }
    } catch (err) {
      console.error('Gagal cek IMAP:', err.message);
    }
  }
}

module.exports = { checkInboxForReply, checkForReplies };
