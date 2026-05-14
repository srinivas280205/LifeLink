# 🩸 LifeLink — India's Emergency Blood Donor Network

**Real-time emergency blood request broadcasting across India**

[![Backend](https://img.shields.io/badge/Backend-Render-purple?style=flat-square&logo=render)](https://render.com)
[![Frontend](https://img.shields.io/badge/Frontend-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![MongoDB](https://img.shields.io/badge/Database-MongoDB%20Atlas-green?style=flat-square&logo=mongodb)](https://mongodb.com)
[![PWA](https://img.shields.io/badge/PWA-Ready-blue?style=flat-square)](https://web.dev/progressive-web-apps/)

---

## What is LifeLink?

LifeLink instantly connects people who need blood with available donors nearby. When someone posts an emergency blood request, all compatible donors in the area are notified in real-time via the app, push notifications, and WebSocket broadcasts — no delays, no middlemen.

---

## ✨ Features

### For Donors
- 🩸 **Real-Time Feed** — live stream of blood requests matching your blood group
- 📡 **Instant Notifications** — push alerts the moment someone near you needs your blood type
- 🗺️ **Donor Map** — see active requests and nearby donors on an interactive Leaflet map
- 🏆 **Leaderboard** — ranked by donation count with achievement badges
- 📋 **History** — track all responses and rate the donor experience
- 🩺 **Eligibility Checker** — 10-question assessment to check if you can donate today
- 📍 **GPS Location** — share precise coordinates for SOS proximity matching

### For Requesters
- 🚨 **Emergency Broadcast** — instantly notify all compatible donors in your district
- 🆘 **SOS Mode** — GPS-based alert to all donors within 50 km
- ⭐ **Rate Donors** — leave star rating + note after a fulfilled request
- 🩸 **Blood Drive Events** — create and join local donation camps

### Platform
- 🌙 **Dark / Light Theme**
- 🇮🇳 **Tamil / English** — full bilingual UI with semantically correct Tamil (not transliterations)
- 📲 **PWA** — installable, works offline
- 🔔 **Notification Preferences** — per-type control (blood requests, donor responded, announcements, admin messages)
- 🛡️ **Admin Panel** — user management, broadcast monitoring, announcements, direct messages, CSV export, 14-day trend charts
- 🔒 **Secure** — bcrypt, JWT + silent refresh, rate limiting, NoSQL injection protection

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, CSS Modules |
| Backend | Node.js + Express + Socket.io |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (7-day + silent refresh) + OTP via Fast2SMS |
| Maps | Leaflet.js + OpenStreetMap |
| Push | Web Push API (VAPID) |
| Hosting | Vercel (frontend) + Render (backend) |
| i18n | Custom context — English + Tamil (300+ keys each) |

---

## 📁 Project Structure

```
LifeLink/
├── backend/
│   ├── models/
│   │   ├── User.js           # profile, notifPrefs, GPS location
│   │   ├── Broadcast.js      # request + responses + rating subdoc
│   │   ├── Notification.js   # new_broadcast | donor_responded | announcement | admin_dm
│   │   ├── Event.js          # blood drive events
│   │   ├── OTP.js
│   │   └── PushSubscription.js
│   ├── routes/
│   │   ├── auth.js           # signup, login, OTP, forgot password, JWT refresh
│   │   ├── broadcast.js      # create, SOS, respond, rate, status, notifPrefs-aware
│   │   ├── users.js          # profile, donors, availability, notif-prefs
│   │   ├── admin.js          # full admin CRUD + announce + DM + push
│   │   ├── events.js         # blood drive CRUD + join/leave
│   │   ├── notifications.js
│   │   ├── push.js           # Web Push subscribe/send helper
│   │   ├── stats.js
│   │   └── leaderboard.js
│   ├── jobs/escalation.js    # auto-escalate critical requests
│   └── server.js
│
└── frontend/src/
    ├── pages/                # Landing, Login, Signup, Dashboard, MapView,
    │                         # DonorSearch, Leaderboard, Events, History,
    │                         # Profile, Notifications, Admin, ForgotPassword
    ├── components/           # AppShell, OnboardingModal, EligibilityChecker,
    │                         # OfflineBanner, ErrorBoundary, PWA install prompt
    ├── i18n/
    │   ├── en.js             # 300+ English strings
    │   └── ta.js             # 300+ Tamil translations
    ├── data/
    │   ├── locationData.js   # 36 states/UTs + districts + Tamil name maps
    │   └── bloodBanks.js
    ├── context/              # ThemeContext, LanguageContext
    └── hooks/
        └── usePushSubscription.js
```

---

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- MongoDB Atlas free account (M0 tier)

### Setup

```bash
git clone https://github.com/srinivas280205/LifeLink.git
cd LifeLink

cd backend && npm install
cd ../frontend && npm install
```

Edit `backend/.env` (copy from `.env.example`):

```env
PORT=3456
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lifelink
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
ADMIN_SECRET=your-admin-promote-secret
FAST2SMS_KEY=         # leave blank → OTP prints to console in dev mode
VAPID_PUBLIC_KEY=     # generate below
VAPID_PRIVATE_KEY=    # generate below
VAPID_MAILTO=you@email.com
```

Generate VAPID keys:
```bash
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k,null,2))"
```

### Run

```bash
# Terminal 1
cd backend && npm start        # → http://localhost:3456

# Terminal 2
cd frontend && npm run dev     # → http://localhost:5173
```

> **Dev OTP:** Without a Fast2SMS key, OTPs print to the backend console — no SMS needed for local testing.

---

## 🌐 Production Deployment

### Backend → Render.com

1. New Web Service → GitHub repo → Root: `backend`
2. Build: `npm install` | Start: `node server.js` | Health check: `/`
3. Add all env vars from `.env` in Render dashboard

### Frontend → Vercel

1. New Project → GitHub repo → Root: `frontend`
2. Build: `npm run build` | Output: `dist`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com`

### Promote First Admin

```bash
curl -X POST https://your-backend.onrender.com/api/admin/promote \
  -H "Content-Type: application/json" \
  -d '{"phone": "+91XXXXXXXXXX", "secret": "YOUR_ADMIN_SECRET"}'
```

---

## 🩸 Blood Group Compatibility

| Needs | Compatible Donors |
|---|---|
| A+ | A+, A−, O+, O− |
| A− | A−, O− |
| B+ | B+, B−, O+, O− |
| B− | B−, O− |
| AB+ | All (universal recipient) |
| AB− | A−, B−, AB−, O− |
| O+ | O+, O− |
| O− | O− (universal donor) |

---

## 🔒 Security

| Feature | Detail |
|---|---|
| Passwords | bcryptjs hash |
| JWT | 7-day expiry + client-side silent refresh within 24h window |
| OTP | 5-minute expiry, max 3 attempts |
| Rate limits | Auth: 20 req/15min · API: 200 req/15min |
| Headers | Helmet middleware |
| Injection | mongoSanitize on all inputs |
| Payload | 50 KB max JSON body |
| Banned users | Blocked at every login check |

---

## 📊 Admin Panel Capabilities

- Live platform stats (users, broadcasts, fulfillment rate, SOS count)
- 14-day trend charts (signups + broadcasts)
- User search, view, verify, ban/unban, promote to admin
- Export all users as CSV
- View and cancel/delete any broadcast
- Manage blood drive events
- Send platform-wide announcements (push + real-time + notification)
- Send direct messages to specific users

---

## 📞 OTP Providers (Free Testing)

| Provider | Free | Notes |
|---|---|---|
| **Dev mode** | Unlimited | OTP in console — no key needed |
| **Fast2SMS** | ₹50 credit (~150 OTPs) | Already integrated |
| **MSG91** | 500 OTPs on signup | India |
| **Twilio** | $15 trial | Global |

---

## 📱 PWA

- Install to home screen on Android & iOS
- Offline shell cached via service worker
- Real-time device push notifications (even when app closed)

---

## 🏅 Donor Achievements

| Badge | Unlock |
|---|---|
| 🩸 First Drop | Respond to 1 request |
| ✅ Life Saver | Have a request fulfilled |
| 🌟 Active Donor | 5 donations |
| 🦸 Hero | 10 donations |
| 🏆 Legend | 20 donations |
| 🆘 SOS Veteran | Send an SOS alert |

---

## 📄 License

MIT © 2026 LifeLink — Built to save lives.
