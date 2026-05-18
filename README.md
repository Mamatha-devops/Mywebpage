# My-web-page-# 🌸 Blush & Balloons — Website

A complete business website for **Blush & Balloons** — Decoration · Mehendi · Makeup services.

---

## 📁 Project Structure

```
blush-and-balloons/
├── public/
│   └── index.html        ← The frontend website (put your photos here too)
├── server.js             ← Node.js + Express backend
├── package.json          ← Dependencies
├── .env.example          ← Environment variables template
├── .env                  ← Your secrets (create from .env.example — never commit!)
├── bookings.json         ← Auto-created: stores all booking enquiries
└── README.md
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Install [Node.js](https://nodejs.org/) (version 18 or higher)

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Open .env and fill in your Gmail and other details
nano .env   # or open in any text editor
```

### 4. Set Up Gmail App Password
1. Go to your Google Account → **Security** → **2-Step Verification** (enable if not already)
2. Then go to **Security** → **App Passwords**
3. Generate a new app password (select "Mail" and your device)
4. Paste the 16-character password as `EMAIL_PASS` in your `.env`

> ⚠️ This is NOT your Gmail login password — it's a separate app-specific password.

### 5. Move Frontend to Public Folder
```bash
mkdir public
mv index.html public/
```

### 6. Start the Server
```bash
# Production
npm start

# Development (auto-restarts on changes)
npm run dev
```

### 7. Visit Your Website
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📸 Adding Your Photos

Replace the placeholder gallery cards with real photos:

1. Add your images to the `public/` folder (e.g., `gallery1.jpg`, `bridal1.jpg`)
2. In `public/index.html`, find the `.gallery-grid` section
3. Replace the `.gallery-placeholder` divs with `<img>` tags:

```html
<div class="gallery-item">
  <img src="bridal-stage.jpg" alt="Bridal stage decoration" style="width:100%; height:100%; object-fit:cover;" />
  <div class="gallery-overlay"><span class="gallery-caption">Bridal Stage Setup</span></div>
</div>
```

---

## 📬 Booking Flow

1. **Visitor fills the form** on the website
2. **Backend saves** the enquiry to `bookings.json` with a unique ID (e.g., `BNB-1717000000000`)
3. **Two emails are sent automatically:**
   - You (the owner) get a detailed notification email
   - The client gets a beautiful confirmation email (if they provided their email)

---

## 🔐 Viewing All Bookings

Use any REST client (Postman, curl, etc.):

```bash
curl -H "x-admin-key: your-secret-admin-key" http://localhost:3000/api/bookings
```

Or simply open `bookings.json` directly — it's a readable JSON file.

---

## 🌐 Deploying Online (Free Options)

### Option A: Railway (Recommended — easiest)
1. Push your code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add your environment variables in the Railway dashboard
4. Done — Railway gives you a live URL!

### Option B: Render
1. Push to GitHub
2. Go to [render.com](https://render.com) → New Web Service
3. Set `npm start` as the start command
4. Add environment variables

### Option C: VPS (DigitalOcean / Hostinger / etc.)
```bash
# On your server:
git clone your-repo
cd blush-and-balloons
npm install
cp .env.example .env && nano .env
# Install PM2 for process management
npm install -g pm2
pm2 start server.js --name "blush-balloons"
pm2 startup && pm2 save
```

---

## 🛠 Upgrading to a Real Database (Optional)

The default setup uses a JSON file which works fine for small volumes. For higher traffic, replace it with:

- **MongoDB** — [mongoose](https://mongoosejs.com/) is easy to set up
- **MySQL/PostgreSQL** — use [Sequelize](https://sequelize.org/) or [Prisma](https://www.prisma.io/)
- **Firebase** — serverless, no server needed

---

## 📝 Customisation Checklist

- [ ] Replace placeholder phone number in `index.html` (search `+91 99999 99999`)
- [ ] Replace placeholder address/location
- [ ] Update social media links (Instagram, Facebook, WhatsApp)
- [ ] Add real gallery photos
- [ ] Update testimonials with real client reviews
- [ ] Set your real email in `.env`
- [ ] Change `ADMIN_KEY` to something secret

---

## 💡 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express |
| Email | Nodemailer (Gmail SMTP) |
| Storage | JSON file (upgrade to DB anytime) |
| Security | Helmet, CORS, Rate Limiting |

---

Made with 🌸 for **Blush & Balloons**
