# Trying the Phase 1 screens locally

The existing Dashboard and History now contain **Donor coordination**. Existing
broadcast tools remain available. This is a local prototype, not a deployed release.

## Setup

1. Use a development MongoDB Atlas database or another replica set. Set the
   backend's `MONGO_URI`, `JWT_SECRET`, `ADMIN_SECRET`, and
   `COORDINATION_ENABLED=true`. Do not use a live production database for testing.
2. Start the backend: from `backend`, run `npm start`.
3. Start the frontend: from `frontend`, run `npm run dev`.
4. Open the local Vite URL. Sign in as a requester in one browser profile and
   as a donor in another. If `VITE_API_URL` is unset, Vite proxies to port 3456.

The new panel displays an unavailable message when the backend feature is disabled.
The shipped environment example remains disabled while release checks continue.
SMS OTP and browser push are not required for this workflow. Leave the VAPID key
values empty unless valid browser-push keys are configured; example placeholders
are not usable keys. The coordinator saves
in-app alerts and sends private socket updates; it cannot guarantee delivery.

## Requester

1. Choose **New blood request** on Dashboard or History.
2. Enter blood group, hospital, district, urgency, donors needed and blood units.
3. Pin the hospital on the map, or enter its coordinates. The phone-location
   shortcut is only for someone physically at the hospital. Confirm the pin.
4. Choose **Find donors**. Select the request to see radius, invitations, willing
   donors and the search timeline.
5. Select willing donors. Their contact numbers appear after selection.
6. To finish, tick only donors who actually donated and choose **Complete request**.
   This records those donations and releases remaining commitments.

Pause/resume and cancellation controls are on the progress card. A selected
donor's withdrawal restarts an automatic search but preserves a manual pause.
At the maximum search radius, **Open blood-bank directory** opens the bank tab.

## Donor

1. Set a blood group and mark yourself available in your profile/header.
2. Expand **My donor location** and share current location, or choose a location
   manually when GPS is unavailable. Manual locations are labelled self-reported.
3. Open **Donor alerts**, or click an invitation notification to open that request.
4. Agree to share your phone number if selected, then choose **I can help**.
   Choose **Unavailable** if you cannot help.
5. Once selected, contact details appear. Use **Withdraw** if you can no longer help.

Location is captured on demand, not continuously in the background. Missing,
stale or imprecise device locations need an update. A willingness response is
never counted as a completed donation.

## Verification

Build and lint the new components from `frontend`:

```powershell
npm ci
npm run build
npx eslint src/components/coordination
```

Backend tests from the repository root:

```powershell
node --test backend/tests/foundation.test.js backend/tests/coordination.test.js
```

Browser integration uses the built frontend, an isolated temporary MongoDB
replica set, local test accounts and a local HTTP/Socket.io server. It never
loads `.env` or connects to `MONGO_URI`. Browser GPS is simulated. The MongoDB
binary may need downloading on the first run; local loopback access is required.

Install Playwright in your development tooling, or set `PLAYWRIGHT_MODULE` to an
existing Playwright module directory. Set `BROWSER_EXECUTABLE` if using an installed
Edge/Chrome executable instead of Playwright's Chromium. Then run from the root:

```powershell
node backend/tests/coordination.browser.cjs
```

The check covers hospital confirmation, manual and device location, notification
links, live responses and selection, contact privacy, withdrawal and replacement,
explicit donation completion, History, bank fallback and 390-pixel mobile layout.
Screenshots are written to `test-results/coordination/` (ignored by Git). Tests
clean up their browser, server and temporary database afterward.

The production build currently reports a large JavaScript chunk warning. New map
code is lazy-loaded. The new panel passes its scoped ESLint check; this is not a
claim that all pre-existing frontend lint issues have been resolved.

## Remaining before release

Completed-only leaderboard/badges, legacy privacy review, account-removal cleanup,
shared request limits and the policy-comparison simulation remain pending. The
new controls currently use English; Tamil localization remains pending. No live
hosting or real-world donor response was tested. See `COORDINATION_BACKEND.md`
for algorithm details and limitations.
