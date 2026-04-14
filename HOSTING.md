# LifeLink — Deployment, Hosting & Security Guide

## Architecture Overview

```
Browser (React PWA)
    │
    ├── Vite dev server (port 5173) — dev only
    │
    └── Production: static files served by Nginx / Vercel / Netlify
            │
            └── API calls (/api/*) proxied to →  Express + Socket.io (port 3456)
                                                        │
                                                        └── MongoDB Atlas (cloud DB)
```

---

## Environment Variables (backend/.env)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Backend port (default 3456) |
| `MONGO_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for signing JWTs — use 32+ random chars |
| `ADMIN_SECRET` | Yes | One-time secret to promote a user to admin |
| `VAPID_PUBLIC_KEY` | No | Web Push public key (auto-generated) |
| `VAPID_PRIVATE_KEY` | No | Web Push private key (keep secret) |
| `VAPID_MAILTO` | No | Contact email for Web Push |

**Generate a strong JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**Generate VAPID keys:**
```bash
cd backend
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(k)"
```

---

## Data Storage

### MongoDB Atlas (Primary)
- Free tier (M0): 512 MB — enough for ~50,000 users + broadcasts
- Paid M2: 2 GB, M5: 5 GB with auto-scaling
- Backups: enable Atlas continuous backup in production
- Connection: uses `MONGO_URI` from `.env`

### Fallback (Development)
- If Atlas is unreachable, `mongodb-memory-server` starts an in-memory DB
- Data is lost on restart — for dev/testing only

### LocalStorage (Frontend)
- `token` — JWT, expires per backend setting
- `user` — cached user object (updated on profile save)
- `ll-theme` — light/dark preference
- `onboarding_dismissed` — first-run wizard flag
- `pwa_install_dismissed` — install banner flag

---

## Hosting Options

### Option A — Render.com (Recommended, Free tier)

**Backend:**
1. Create a new Web Service
2. Root directory: `backend`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Add all env vars from `.env` in the Render dashboard
6. Set Health Check path: `/`

**Frontend:**
1. Create a new Static Site
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add redirect rule: `/* → /index.html` (200) for SPA routing

**CORS:** Update backend `cors()` to allow your Render frontend URL:
```js
app.use(cors({ origin: 'https://your-app.onrender.com' }));
```

---

### Option B — Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login

# Deploy backend
cd backend
railway init
railway up

# Set env vars
railway variables set JWT_SECRET=... MONGO_URI=... ADMIN_SECRET=...
```

Frontend: deploy `dist/` folder to Vercel or Netlify.

---

### Option C — VPS (Ubuntu + Nginx + PM2)

```bash
# 1. Clone repo on server
git clone https://github.com/your/lifelink.git
cd lifelink

# 2. Backend — run with PM2
cd backend
npm install
npm install -g pm2
pm2 start server.js --name lifelink-api
pm2 save && pm2 startup

# 3. Frontend — build and serve with Nginx
cd ../frontend
npm install && npm run build

# 4. Nginx config
sudo nano /etc/nginx/sites-available/lifelink
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /var/www/lifelink/frontend/dist;
    index index.html;
    location / { try_files $uri $uri/ /index.html; }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Socket.io proxy
    location /socket.io/ {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
    }
}
```

```bash
# Enable + SSL
sudo ln -s /etc/nginx/sites-available/lifelink /etc/nginx/sites-enabled/
sudo certbot --nginx -d yourdomain.com
sudo systemctl reload nginx
```

---

## Security Checklist

| Item | Status |
|---|---|
| JWT secret — strong random key | ✅ Required |
| Rate limiting on auth routes (20/15min) | ✅ Implemented |
| Rate limiting on general API (200/15min) | ✅ Implemented |
| Helmet HTTP security headers | ✅ Implemented |
| MongoDB NoSQL injection sanitization | ✅ Implemented |
| JSON payload size limit (50kb) | ✅ Implemented |
| Password hashing (bcryptjs) | ✅ Implemented |
| Mongoose validation on all models | ✅ Implemented |
| Admin routes protected (isAdmin check) | ✅ Implemented |
| VAPID push keys (never expose private key) | ✅ In .env only |
| HTTPS in production | Manual — use Nginx + Certbot |
| CORS restricted to frontend domain | Manual — update for prod |
| `.env` in `.gitignore` | ✅ Must verify |

---

## Making Your First Admin

1. Register a user account normally via the app
2. Call the promote endpoint (one-time setup):

```bash
curl -X POST https://your-backend-url/api/admin/promote \
  -H "Content-Type: application/json" \
  -d '{"phone": "YOUR_PHONE", "secret": "YOUR_ADMIN_SECRET"}'
```

3. Log out and log back in — the Admin tab appears in the nav

---

## API Keys Summary

| Service | Key Location | Notes |
|---|---|---|
| MongoDB Atlas | `MONGO_URI` in `.env` | Never commit to git |
| JWT signing | `JWT_SECRET` in `.env` | Rotate if compromised |
| Web Push (VAPID) | `VAPID_PUBLIC_KEY` + `VAPID_PRIVATE_KEY` | Public key safe to expose; private key never |
| Admin promote | `ADMIN_SECRET` in `.env` | Use once, keep secret |

---

## Frontend Vite Proxy (Development)

`frontend/vite.config.js` proxies `/api` and `/socket.io` to `http://localhost:3456`.
In production, Nginx handles the same proxying — no code changes needed.

---

## Database Indexes (Recommended for Production)

Run once in MongoDB Atlas shell or Compass:

```js
db.users.createIndex({ phone: 1 }, { unique: true })
db.users.createIndex({ state: 1, bloodGroup: 1, isAvailable: 1 })
db.broadcasts.createIndex({ status: 1, createdAt: -1 })
db.broadcasts.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.notifications.createIndex({ userId: 1, read: 1, createdAt: -1 })
db.pushsubscriptions.createIndex({ endpoint: 1 }, { unique: true })
```
