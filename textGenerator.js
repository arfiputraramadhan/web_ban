// Generator teks banding yang "gacor" dan profesional
// Menggunakan template dari database atau bawaan

function generateText(phone, reason, extraText = '', templateText = null) {
  // Jika template disediakan (dari database), gunakan itu dengan replace placeholder
  let raw = templateText || getDefaultTemplate(reason);
  const signature = `Pengguna WhatsApp ${phone}`;
  raw = raw.replace(/{phone}/g, phone);
  raw = raw.replace(/{extra}/g, extraText || '');
  raw = raw.replace(/{signature}/g, signature);

  // Jika template tidak memiliki placeholder extra, tambahkan di akhir jika ada
  if (extraText && !raw.includes(extraText) && !templateText) {
    raw += `\n\nCatatan tambahan: ${extraText}`;
  }

  return raw.trim();
}

function getDefaultTemplate(reason) {
  const db = require('./database').getDb();
  const row = db.prepare('SELECT template_text FROM templates WHERE reason = ? AND is_default = 1 LIMIT 1').get(reason);
  return row ? row.template_text : '';
}

// Validasi template: pastikan placeholder terisi
function validateTemplateRendered(text, reason) {
  return text.length > 200 && !text.includes('{phone}') && !text.includes('{signature}');
}

module.exports = { generateText, validateTemplateRendered };