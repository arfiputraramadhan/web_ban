// Validasi ketat teks banding agar profesional dan "gacor"
function validateAppealText(text, reason) {
  if (text.length < 300) return { ok: false, msg: 'Teks minimal 300 karakter untuk kesan serius.' };
  if (/bajingan|anjing|kontol|tolol|goblok|bego|idiot/i.test(text)) return { ok: false, msg: 'Teks mengandung kata tidak pantas.' };

  const requiredKeywords = ['whatsapp', 'banding', 'saya', 'akun', 'pemblokiran', 'hormat'];
  const missing = requiredKeywords.filter(k => !text.toLowerCase().includes(k));
  if (missing.length) return { ok: false, msg: `Teks kurang kata kunci penting: ${missing.join(', ')}.` };

  const hasOpening = /kepada\s+tim\s+dukungan\s+whatsapp/i.test(text);
  const hasClosing = /hormat\s+saya/i.test(text);
  if (!hasOpening || !hasClosing) return { ok: false, msg: 'Harus ada salam pembuka (Kepada Tim Dukungan WhatsApp) dan penutup (Hormat saya).' };

  if (reason === 'mod' && !/whatsapp\s+resmi/i.test(text)) {
    return { ok: false, msg: 'Anda harus menyatakan beralih ke WhatsApp resmi.' };
  }

  // Cek struktur paragraf minimal 3 paragraf
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) return { ok: false, msg: 'Teks harus memiliki minimal 3 paragraf terpisah.' };

  return { ok: true };
}

module.exports = { validateAppealText };