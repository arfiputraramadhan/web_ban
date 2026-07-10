const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
let db = null;

function initialize() {
  if (db) return db;

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      encrypted_password TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS emails_sent (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER,
      phone TEXT NOT NULL,
      reason TEXT NOT NULL,
      extra_text TEXT,
      full_text TEXT NOT NULL,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'sent',
      follow_up_count INTEGER DEFAULT 0,
      reply_received INTEGER DEFAULT 0,
      reply_content TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      reason TEXT,
      template_text TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert template default
  const insert = db.prepare('INSERT OR IGNORE INTO templates (name, reason, template_text, is_default) VALUES (?, ?, ?, 1)');

  insert.run('Template MOD (Gacor)', 'mod', `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya menulis untuk mengajukan permohonan tinjauan ulang atas pemblokiran permanen akun WhatsApp saya dengan nomor {phone}. Saya sepenuhnya menyadari bahwa tindakan saya menggunakan versi modifikasi WhatsApp (GBWhatsApp/WhatsApp Plus) merupakan pelanggaran serius terhadap Ketentuan Layanan WhatsApp.

Setelah memahami risiko, saya telah menghapus aplikasi tidak resmi dan menginstal WhatsApp resmi dari Play Store/App Store. Saya berjanji tidak akan mengulangi pelanggaran ini.

WhatsApp sangat vital untuk pekerjaan dan keluarga saya. Saya mohon diberikan kesempatan kedua.

Hormat saya,
{signature}`);

  insert.run('Template Spam (Gacor)', 'spam', `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya mengajukan banding atas pemblokiran akun {phone}. Saya tidak pernah sengaja mengirim spam. Kemungkinan akun saya diretas.

Saya sudah mengamankan akun dengan verifikasi dua langkah. Saya mohon peninjauan ulang karena akun ini sangat penting.

Hormat saya,
{signature}`);

  insert.run('Template Unknown (Gacor)', 'unknown', `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya mengajukan tinjauan ulang pemblokiran akun {phone}. Saya tidak tahu penyebabnya karena selalu menggunakan WhatsApp resmi.

Mohon diperiksa kembali, mungkin kesalahan sistem. Akun ini sangat penting bagi saya.

Hormat saya,
{signature}`);

  insert.run('Template Other (Gacor)', 'other', `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya mohon tinjauan ulang pemblokiran akun {phone}. Saya mohon maaf jika tanpa sengaja melanggar aturan.

Saya berkomitmen mematuhi semua ketentuan. Mohon akun saya dipulihkan.

Hormat saya,
{signature}`);

  console.log('✅ Database siap');
  return db;
}

function getDb() {
  if (!db) throw new Error('Database belum diinisialisasi');
  return db;
}

module.exports = { initialize, getDb };
