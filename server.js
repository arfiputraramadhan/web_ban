require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

const database = require('./database');
const sendRoute = require('./routes/send');
const replyRoute = require('./routes/reply');
const accountsRoute = require('./routes/accounts');
const dashboardRoute = require('./routes/dashboard');
const templatesRoute = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 3030;

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting untuk API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak permintaan.' }
});
app.use('/api/', apiLimiter);

// Route API
app.use('/api/send', sendRoute);
app.use('/api/reply', replyRoute);
app.use('/api/accounts', accountsRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/templates', templatesRoute);

// Fallback ke index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Inisialisasi database
database.initialize();

// Cron job: cek balasan otomatis setiap 30 menit
cron.schedule('*/30 * * * *', async () => {
  console.log('Menjalankan pengecekan balasan otomatis...');
  try {
    const { checkForReplies } = require('./imapChecker');
    await checkForReplies(); // fungsi yang membaca akun Gmail tersimpan dan update status balasan
  } catch (err) {
    console.error('Error cron job:', err);
  }
});

// Cron job: follow‑up otomatis untuk email >3 hari tanpa balasan
cron.schedule('0 0 * * *', async () => {
  console.log('Menjalankan follow‑up otomatis...');
  try {
    const { sendFollowUps } = require('./mailer');
    await sendFollowUps();
  } catch (err) {
    console.error('Error follow‑up:', err);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});