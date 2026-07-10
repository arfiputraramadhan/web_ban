const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data.db');
let db;

function initialize() {
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  // Tabel akun Gmail (kredensial terenkripsi)
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      encrypted_password TEXT NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabel riwayat pengiriman email banding
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
      last_reply_check DATETIME,
      reply_received INTEGER DEFAULT 0,
      reply_content TEXT,
      FOREIGN KEY (account_id) REFERENCES accounts(id)
    )
  `);

  // Tabel template kustom
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

  // Insert default templates jika belum ada
  const defaultTemplates = [
    { name: 'Template MOD (Standar)', reason: 'mod', template_text: getDefaultModTemplate() },
    { name: 'Template Spam (Profesional)', reason: 'spam', template_text: getDefaultSpamTemplate() },
    { name: 'Template Tidak Diketahui', reason: 'unknown', template_text: getDefaultUnknownTemplate() },
    { name: 'Template Lainnya', reason: 'other', template_text: getDefaultOtherTemplate() }
  ];

  const insert = db.prepare('INSERT OR IGNORE INTO templates (name, reason, template_text, is_default) VALUES (?, ?, ?, 1)');
  for (const t of defaultTemplates) {
    insert.run(t.name, t.reason, t.template_text);
  }
}

// Fungsi bantu template default
function getDefaultModTemplate() {
  return `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya menulis untuk mengajukan permohonan tinjauan ulang atas pemblokiran permanen akun WhatsApp saya dengan nomor {phone}. Saya sepenuhnya menyadari bahwa tindakan saya menggunakan versi modifikasi WhatsApp (seperti GBWhatsApp/WhatsApp Plus) merupakan pelanggaran serius terhadap Ketentuan Layanan WhatsApp.

Setelah memahami risiko dan konsekuensinya, saya telah menghapus aplikasi tidak resmi tersebut dan menginstal WhatsApp resmi dari Google Play Store / Apple App Store. Saya berjanji untuk tidak mengulangi pelanggaran ini dan hanya akan menggunakan aplikasi resmi di masa mendatang.

Saya sangat bergantung pada WhatsApp untuk komunikasi pekerjaan dan keluarga. Kehilangan akses ke nomor ini sangat berdampak pada produktivitas dan hubungan personal saya. Saya mohon dengan sangat agar diberikan kesempatan kedua untuk dapat kembali menggunakan layanan WhatsApp resmi.

Saya bersedia mematuhi semua Ketentuan Layanan WhatsApp dan akan menjaga akun saya dengan baik. Atas perhatian dan kebijaksanaan Tim Dukungan WhatsApp, saya ucapkan terima kasih yang sebesar‑besarnya.

Hormat saya,
{signature}`;
}

function getDefaultSpamTemplate() {
  return `Kepada Tim Dukungan WhatsApp yang terhormat,

Dengan rendah hati saya mengajukan banding atas pemblokiran permanen akun WhatsApp saya {phone}. Saya memahami bahwa pengiriman pesan massal atau spam melanggar aturan WhatsApp, tetapi saya ingin menjelaskan bahwa hal tersebut terjadi tanpa kesengajaan.

Kemungkinan akun saya diretas atau digunakan oleh pihak lain tanpa izin. Saya telah mengamankan akun dengan verifikasi dua langkah dan mengganti kata sandi terkait. Saya tidak pernah berniat melakukan spam atau mengganggu pengguna lain.

Saya memohon pengertian Tim Dukungan untuk meninjau kembali pemblokiran ini. Saya berjanji akan lebih berhati‑hati dan mematuhi aturan WhatsApp sepenuhnya. Kehilangan nomor ini sangat merugikan komunikasi bisnis dan keluarga saya.

Atas perhatian dan pertimbangan Bapak/Ibu, saya sampaikan terima kasih mendalam.

Hormat saya,
{signature}`;
}

function getDefaultUnknownTemplate() {
  return `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya mengajukan permohonan tinjauan ulang terkait pemblokiran permanen akun WhatsApp saya {phone}. Sampai saat ini, saya tidak mengetahui secara pasti penyebab pemblokiran karena saya selalu menggunakan WhatsApp resmi dari toko aplikasi resmi.

Saya tidak pernah mengirim spam, menggunakan aplikasi modifikasi, atau melanggar ketentuan lainnya. Mungkin terjadi kesalahan sistem atau akun saya diretas tanpa sepengetahuan saya. Saya sangat menghargai layanan WhatsApp dan tidak ingin kehilangan akses.

Saya mohon Tim Dukungan dapat memeriksa kembali status akun saya. Saya siap memberikan informasi tambahan jika diperlukan. Semoga akun saya dapat dipulihkan karena sangat penting untuk komunikasi sehari‑hari.

Atas bantuan dan perhatiannya, saya ucapkan terima kasih.

Hormat saya,
{signature}`;
}

function getDefaultOtherTemplate() {
  return `Kepada Tim Dukungan WhatsApp yang terhormat,

Saya ingin memohon peninjauan ulang atas pemblokiran permanen akun WhatsApp saya {phone}. Saya akui mungkin tanpa sengaja melanggar aturan, dan untuk itu saya mohon maaf sebesar‑besarnya.

Saya berkomitmen untuk mematuhi seluruh Ketentuan Layanan WhatsApp ke depannya. Akun ini sangat vital untuk keperluan komunikasi pribadi dan profesional saya. Saya sangat berharap dapat diberikan kesempatan untuk memulihkan akun.

Sekali lagi saya mohon maaf atas ketidaknyamanan yang mungkin ditimbulkan. Saya siap mengikuti arahan Tim Dukungan sepenuhnya.

Hormat saya,
{signature}`;
}

function getDb() {
  if (!db) throw new Error('Database belum diinisialisasi');
  return db;
}

module.exports = { initialize, getDb };