require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cron = require('node-cron');

// Inisialisasi database DULUAN
const database = require('./database');
database.initialize();

// Import routes SETELAH database siap
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

// Rate limiting API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak permintaan.' }
});
app.use('/api/', apiLimiter);

// Routes API
app.use('/api/send', sendRoute);
app.use('/api/reply', replyRoute);
app.use('/api/accounts', accountsRoute);
app.use('/api/dashboard', dashboardRoute);
app.use('/api/templates', templatesRoute);

// Fallback SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cron: cek balasan setiap 30 menit
cron.schedule('*/30 * * * *', async () => {
  console.log('⏰ Cek balasan otomatis...');
  try {
    const { checkForReplies } = require('./imapChecker');
    await checkForReplies();
  } catch (err) {
    console.error('Error cron:', err);
  }
});

// Cron: follow-up setiap hari jam 00:00
cron.schedule('0 0 * * *', async () => {
  console.log('⏰ Follow-up otomatis...');
  try {
    const { sendFollowUps } = require('./mailer');
    await sendFollowUps();
  } catch (err) {
    console.error('Error follow-up:', err);
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server: http://localhost:${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
});
