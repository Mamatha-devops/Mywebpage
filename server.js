
require('dotenv').config({ path: './details.env' });
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

const DB_FILE = path.join(__dirname, 'bookings.json');

function readBookings() {
  if (!fs.existsSync(DB_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch { return []; }
}

function saveBooking(booking) {
  const bookings = readBookings();
  booking.id = `BNB-${Date.now()}`;
  booking.status = 'new';
  bookings.push(booking);
  fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2));
  return booking;
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false }
});

async function sendNotificationEmail(booking) {
  try {
    await transporter.sendMail({
      from: `"Blush & Balloons" <${process.env.EMAIL_USER}>`,
      to: process.env.OWNER_EMAIL,
      subject: `✨ New Booking — ${booking.name} [${booking.id}]`,
      html: `
        <div style="font-family:Georgia,serif;max-width:600px;margin:auto;padding:24px;border:1px solid #E8A4A4;border-radius:12px;">
          <h2 style="color:#9B3A52;">New Booking Enquiry</h2>
          <p>Ref: <strong>${booking.id}</strong></p>
          <hr style="border:none;border-top:1px solid #F5D5D5;" />
          <table style="width:100%;font-size:0.92rem;">
            <tr><td style="color:#7A5A5A;padding:8px 0;">👤 Name</td><td><strong>${booking.name}</strong></td></tr>
            <tr><td style="color:#7A5A5A;padding:8px 0;">📞 Phone</td><td>${booking.phone}</td></tr>
            <tr><td style="color:#7A5A5A;padding:8px 0;">📧 Email</td><td>${booking.email || '—'}</td></tr>
            <tr><td style="color:#7A5A5A;padding:8px 0;">📅 Event Date</td><td>${booking.event_date}</td></tr>
            <tr><td style="color:#7A5A5A;padding:8px 0;">🎉 Event Type</td><td>${booking.event_type || '—'}</td></tr>
            <tr><td style="color:#7A5A5A;padding:8px 0;">💎 Service</td><td style="color:#9B3A52;"><strong>${booking.service}</strong></td></tr>
          </table>
          ${booking.message ? `<div style="background:#FAF5EE;padding:12px;border-radius:8px;margin-top:12px;"><p style="margin:0;font-style:italic;">${booking.message}</p></div>` : ''}
        </div>
      `,
    });

    if (booking.email) {
      await transporter.sendMail({
        from: `"Blush & Balloons 🌸" <${process.env.EMAIL_USER}>`,
        to: booking.email,
        subject: `Your enquiry received — Blush & Balloons`,
        html: `
          <div style="font-family:Georgia,serif;max-width:580px;margin:auto;padding:32px;background:#FAF5EE;border-radius:16px;">
            <h1 style="color:#9B3A52;">Blush & Balloons 🌸</h1>
            <p>Dear <strong>${booking.name}</strong>,</p>
            <p>Thank you! We received your enquiry and will contact you within 24 hours.</p>
            <div style="background:#fff;border-radius:10px;padding:16px;margin:20px 0;border:1px solid #F5D5D5;">
              <p><strong>Reference:</strong> ${booking.id}</p>
              <p><strong>Event Date:</strong> ${booking.event_date}</p>
              <p><strong>Service:</strong> ${booking.service}</p>
            </div>
            <p>With love,<br/><strong style="color:#9B3A52;">Blush & Balloons Team</strong> ✨</p>
          </div>
        `,
      });
    }
  } catch (err) {
    console.error('[EMAIL ERROR]', err.message);
  }
}

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests.' },
});

app.post('/api/booking', bookingLimiter, async (req, res) => {
  const { name, phone, email, event_date, service, event_type, message, submitted_at } = req.body;

  if (!name || !phone || !service || !event_date) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  const booking = {
    name: name.trim(),
    phone: phone.trim(),
    email: email?.trim() || '',
    event_date,
    service,
    event_type: event_type || '',
    message: message?.trim().slice(0, 1000) || '',
    submitted_at: submitted_at || new Date().toISOString(),
    ip: req.ip,
  };

  try {
    const saved = saveBooking(booking);
    sendNotificationEmail(saved);
    return res.status(201).json({
      success: true,
      message: 'Booking received!',
      id: saved.id,
    });
  } catch (err) {
    console.error('[SAVE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('/api/bookings', (req, res) => {
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({ success: false, message: 'Unauthorised.' });
  }
  const bookings = readBookings();
  res.json({ success: true, count: bookings.length, data: bookings });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌸 Blush & Balloons server running on http://blushandballons.roboshope.shop:${PORT}`);
  console.log(`   Bookings stored in: ${DB_FILE}`);
  console.log(`   Press Ctrl+C to stop\n`);
});
