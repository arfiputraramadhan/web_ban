function validateAppealText(text, reason) {
  if (text.length < 300) return { ok: false, msg: 'Teks minimal 300 karakter.' };
  if (/bajingan|anjing|kontol|tolol|goblok|bego|idiot/i.test(text)) return { ok: false, msg: 'Teks mengandung kata tidak pantas.' };

  const keywords = ['whatsapp', 'banding', 'saya', 'akun', 'pemblokiran', 'hormat'];
  const missing = keywords.filter(k => !text.toLowerCase().includes(k));
  if (missing.length) return { ok: false, msg: `Kurang kata kunci: ${missing.join(', ')}.` };

  const hasOpening = /kepada\s+tim\s+dukungan\s+whatsapp/i.test(text);
  const hasClosing = /hormat\s+saya/i.test(text);
  if (!hasOpening || !hasClosing) return { ok: false, msg: 'Harus ada pembuka dan penutup.' };

  if (reason === 'mod' && !/whatsapp\s+resmi/i.test(text)) {
    return { ok: false, msg: 'Harus menyatakan beralih ke WhatsApp resmi.' };
  }

  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length < 3) return { ok: false, msg: 'Minimal 3 paragraf.' };

  return { ok: true };
}

module.exports = { validateAppealText };
