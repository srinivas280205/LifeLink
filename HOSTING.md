# Deploy this Phase-1 project

Use this new Desktop folder as the repository root. Do not deploy the older Downloads copy accidentally.

## Render backend
Root: backend. Build: npm ci. Start: npm start. Health check: /health.
Set NODE_ENV=production, COORDINATION_ENABLED=true, MONGO_URI to your Atlas replica-set database, JWT_SECRET and ADMIN_SECRET to independent random secrets, and FRONTEND_ORIGINS to the exact Vercel HTTPS origin (no trailing slash). Multiple frontend origins may be comma-separated. Keep all secrets on Render only. Do not use dev:local or demo on Render.

## Vercel frontend
Root: frontend. Framework: Vite. Build: npm run build. Output: dist.
Set VITE_API_URL to the Render HTTPS origin, without /api. Redeploy after changing it. vercel.json handles refreshes of nested routes. Browser API and Socket.IO connections both use this URL.

## MongoDB Atlas
Create a dedicated database user for this project and configure Atlas network access for the backend. Save its URI only in Render. Coordination needs replica-set transactions. The app refuses temporary database fallback in production. Preserve the same database across redeployments.

## Two-device acceptance check
Open the Vercel URL on both devices. Register two different accounts. Donor: choose a blood group, enable availability, save a recent location. Requester: choose a nearby hospital map pin, group, urgency, quantity and donor target. Keep Donate blood open on the donor device. Offer help, select the donor on requester, verify paused alerts, withdraw on donor and verify resumed search. Register a third member to test replacement. Record completion only after selecting the relevant donor. Reopen the page to confirm saved history.

Normal wait is 300 seconds, urgent 120, critical 45; worker checks every 5 seconds. Configure shorter waits only for an explicitly labelled test deployment. No OTP or hospital QR is required. People can use the same account as requester or donor. No fixed member-count cap is implemented; hosting capacity, rate limits and donor safeguards still apply.

Real-time updates require an open connected page. Closed-phone/background push is not a release-tested feature. A sleeping Render service cannot run the escalation worker while asleep. Free services sleep after inactivity; use an always-running service for uninterrupted coordination. Do not claim 24/7 operation from an untested free deployment.

References: https://render.com/docs/free and https://vercel.com/docs/frameworks/frontend/vite
