# LifeLink final-year project

Response-Aware Donor Coordination with Staged Radius Expansion for Emergency Blood Requests.

## Run locally

Node.js 22+ is required. Dependencies are installed in this folder. From PowerShell run `./start-local.ps1`, then open http://127.0.0.1:4180/. The API uses port 3460.

Alternatively run `npm run dev:local` in backend and `npm run dev -- --host 127.0.0.1 --port 4180` in frontend in two terminals.

The local launcher stores data in backend/.local-db and uses a MongoDB replica set. Preserve that folder to keep local accounts and requests. backend/.env holds local secrets and must never be committed. For deployment, configure a real MongoDB replica-set URI, JWT_SECRET, ADMIN_SECRET and COORDINATION_ENABLED=true; run npm start with NODE_ENV=production. No production database was copied.

## User workflow

Home → sign up/log in → Request blood or Donate blood. Requesters confirm the hospital map pin, blood group, urgency, units and donor target. Donors set their profile, availability and recent location, then respond to invitations. Requesters select willing donors. Alerts pause at the selected-donor target and resume on withdrawal unless manually paused. Record actual donors on completion. Cancellation and expiry stop the search.

Units and donor target are separate. The hospital decides eligibility and compatibility. Map distance is geographic distance, not travel time. Location is updated with consent; this is not background GPS tracking. Accounts and requests are self-reported. SMS OTP, hospital QR and ML ranking are outside scope. Email password recovery is not configured.

## Validation

Backend: `npm test`. Frontend: `npm run build`. Tests use an isolated database, not local user records. UI testing status is recorded in VALIDATION.md.

The references folder contains the supplied base paper, IEEE paper and report. Their simulation numbers are simulation-only and are not production performance measurements. The implementation uses rule-based follow-up, not the base paper's ML ranking.

## External review demonstration

Run `./start-local.ps1 -Demo` when the local servers are stopped. Open http://127.0.0.1:4180/demo. If servers are already running in normal mode, stop them before choosing Demo mode; the launcher does not replace running servers.

Demo mode uses a separate database named lifelink_exam_demo and fictional accounts. It runs the actual API, MongoDB persistence, background worker and Socket.IO updates. Normal response windows are shortened to 15 seconds (urgent 10, critical 5); radii remain 5, 10, 20 and 50 km. This is a demonstration setting, not a measured emergency response guarantee.

1. Click Start new demo request.
2. Wait without responding to show the radius expanding.
3. Use Switch participant / Demo guide to open the next donor (about 7 km). Agree to contact sharing and choose I can help.
4. Switch to Requester and select that donor. New alerts pause.
5. Switch back to the selected donor and withdraw. Show search resuming.
6. Offer help as another invited donor; select that donor as requester, record the simulated donation and complete the request. Expand the timeline.

Participant buttons sign in to fictional accounts through the normal login endpoint. One role is active per browser; use another browser/private window for simultaneous roles. Cancel unfinished requests before repeating. Normal alert, commitment and login limits still apply. Demo mode is unavailable in production. Do not use seeded passwords for real accounts.

## Normal two-device use

Use `./start-local.ps1 -Lan` (without -Demo). Register separate accounts from each device on the same Wi-Fi and use the normal homepage. See MANUAL_TEST.md for the steps and HOSTING.md for Vercel/Render/Atlas configuration. There is no fixed member-count cap; this is not a claim of unlimited capacity. In normal mode the prepared-account demo is disabled.

Latest validation: 21 backend tests passed, frontend build passed, and a three-new-member flow passed through the LAN URL with authenticated private live updates. Public deployment and physical phone testing remain separate checks.
