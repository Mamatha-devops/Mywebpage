/**
 * Blush & Balloons — Backend Server
 * Node.js + Express
 *
 * Features:
 *  - POST /api/booking  → saves enquiry + sends email notification
 *  - GET  /api/bookings → (admin) list all bookings
 *  - Serves the frontend (index.html) as a static site
 *
 * Setup:
 *  1. npm install
 *  2. Copy .env.example → .env and fill in your values
 *  3. node server.js   (or: npm start)
 */

require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const nodemailer = require('nodemailer');
const fs         = require('fs');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

// ── FILE-BASED DATABASE (JSON) ──────────────────────────────────────────────
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

// ── EMAIL TRANSPORT ──────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendNotificationEmail(booking) {
  await transporter.sendMail({
    from: `"Blush & Balloons Website" <${process.env.EMAIL_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `✨ New Booking Enquiry — ${booking.name}`,
    html: `
      <h2>New Booking!</h2>
      <p>Name: ${booking.name}</p>
      <p>Phone: ${booking.phone}</p>
      <p>Email: ${booking.email}</p>
      <p>Event Date: ${booking.event_date}</p>
      <p>Service: ${booking.service}</p>
      <p>Event Type: ${booking.event_type}</p>
      <p>Message: ${booking.message}</p>
    `
  });
}

  // 2. Confirmation email to client
  if (booking.email) {
    await transporter.sendMail({
      from: `"Blush & Balloons 🌸" <${process.env.EMAIL_USER}>`,
      to: booking.email,
      subject: `Your enquiry has been received — Blush & Balloons`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 580px; margin: auto; padding: 32px; background:#FAF5EE; border-radius:16px;">
          <h1 style="font-family:Georgia,serif; color:#9B3A52; font-size:2rem; margin-bottom:4px;">Blush <span style="color:#C9A84C; font-style:italic;">&</span> Balloons</h1>
          <p style="color:#7A5A5A; font-size:0.85rem;">Decoration · Mehendi · Makeup</p>
          <hr style="border:none; border-top:1px solid #E8A4A4; margin:20px 0;" />
          <p style="font-size:1rem;">Dear <strong>${booking.name}</strong>,</p>
          <p style="line-height:1.8; color:#4A2E2E;">Thank you for reaching out! 🌸 We've received your enquiry and are thrilled to be considered for your special day.</p>
          <div style="background:#fff; border-radius:10px; padding:16px 20px; margin:20px 0; border:1px solid #F5D5D5;">
            <p style="margin:0 0 8px; font-weight:bold; color:#9B3A52;">Your Booking Details</p>
            <p style="margin:4px 0; font-size:0.9rem;"><strong>Reference:</strong> ${booking.id}</p>
            <p style="margin:4px 0; font-size:0.9rem;"><strong>Event Date:</strong> ${booking.event_date}</p>
            <p style="margin:4px 0; font-size:0.9rem;"><strong>Service:</strong> ${booking.service}</p>
          </div>
          <p style="line-height:1.8; color:#4A2E2E;">Our team will contact you within <strong>24 hours</strong> to discuss your requirements and schedule a free consultation.</p>
          <p style="line-height:1.8; color:#7A5A5A;">If you have any urgent queries, feel free to call us directly.</p>
          <p style="margin-top:24px; color:#4A2E2E;">With love,<br/><strong style="color:#9B3A52;">The Blush & Balloons Team</strong> ✨</p>
        </div>
      `,
    });
  }
}

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

// ── ROUTES ────────────────────────────────────────────────────────────────────

app.post('/api/booking', bookingLimiter, async (req, res) => {
  const { name, phone, email, event_date, service, event_type, message, submitted_at } = req.body;

  if (!name || !phone || !service || !event_date) {
    return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
  }

  if (name.length > 120 || phone.length > 20) {
    return res.status(400).json({ success: false, message: 'Invalid input length.' });
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
    sendNotificationEmail(saved).catch(err => {
      console.error('[EMAIL ERROR]', err.message);
    });
    return res.status(201).json({
      success: true,
      message: 'Booking received! We will contact you within 24 hours.',
      id: saved.id,
    });
  } catch (err) {
    console.error('[SAVE ERROR]', err);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
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

// ── START ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🌸 Blush & Balloons server running on http://blushandballons.roboshope.shop:${PORT}`);
  console.log(`   Bookings stored in: ${DB_FILE}`);
  console.log(`   Press Ctrl+C to stop\n`);
});