# Phase 1 implementation progress

## Increment 1: foundation

- Added inactive coordination fields to Broadcast (version defaults to zero).
- Added donor location metadata; old locations remain unknown, not freshly verified.
- Added DonorOutreach, DonorCommitment and EscalationLog schemas.
- Socket connections require a valid login JWT and an existing, non-banned account.
- Reset tokens cannot authenticate sockets. Connections close at token expiry.
- Personal notifications and SOS alerts use private user rooms.
- General feed events use an authenticated feed room, with contact numbers and requester GPS removed from new-broadcast payloads.
- Frontend socket connections use the configured API URL and send the login token.
- Production refuses temporary database fallback on MongoDB connection failure.

## Verification

Run from the project folder:

    node --test backend/tests/foundation.test.js

Three tests cover authentication acceptance/rejection and feed redaction.
Backend JavaScript syntax checks passed. No live MongoDB, browser integration,
frontend build or deployment was tested in this increment.

## Increment 2: coordination backend preview

- Added authenticated participant APIs, a persistent worker and configurable
  hospital-centred search (5 / 10 / 20 / 50 km by default).
- Added response windows, bounded batches, late offers, selection, manual/target
  pauses, withdrawal recovery, cancellation, explicit donor completion and expiry.
- Transactions plus unique indexes prevent duplicate invitations and competing
  commitments. A shared user counter enforces the daily alert cap across requests.
- Added per-account posting cooldown/rate limit, location validation/freshness,
  selected-only contacts and private socket refresh events.
- Old broadcasts/jobs cannot process the new coordinated requests. The general
  donor directory no longer returns exact coordinates.
- Optional browser push keys no longer prevent local startup. Fixed push
  subscription ownership to use the login token's userId.
- New workflow stays disabled by default with COORDINATION_ENABLED=false until
  its frontend controls are built. MongoDB Atlas or another replica set is needed.

Backend API, algorithm, state diagrams and limitations:
[docs/COORDINATION_BACKEND.md](docs/COORDINATION_BACKEND.md).

## Increment 2 verification

    node --test backend/tests/foundation.test.js backend/tests/coordination.test.js

The tests use an isolated temporary MongoDB replica set, never MONGO_URI.
The restricted-shell attempt could not connect to localhost; rerunning with local
network access allowed completed the integration tests: 18 passed, 0 failed.
Backend JavaScript syntax checks also passed (32 source files).

## Increment 3: requester and donor screens

- Added a shared coordination panel to Dashboard and History, with My requests
  and Donor alerts, live updates, reconnect reload and a 30-second polling fallback.
- Added hospital map/coordinate selection and explicit hospital-pin confirmation.
- Added donor GPS/manual-location controls, location readiness, contact consent,
  offers/declines, selection, withdrawal, pause/resume/cancel and the timeline.
- Completion requires explicitly choosing selected donors who actually donated.
- Notifications open the relevant request; exhausted searches link to the bank tab.
- Profile GPS now sends source, measurement time and accuracy, including valid
  zero coordinates. Exact donor coordinates remain private in participant views.
- Corrected header/dashboard mobile overflow and lazy-loaded the new map controls.
- Kept the feature off in the environment example for controlled local testing.

## Increment 3 verification

- Production frontend build passed. It retains a large-chunk warning.
- Scoped ESLint check passed for all new coordination components.
- All 18 backend foundation/coordination tests passed, including the new location
  status endpoint and notification marker assertions.
- Headless Edge browser integration passed using a separate requester, donor and
  backup donor, the production frontend build and a temporary local MongoDB.
- Checked hospital confirmation, manual/device location, notification links,
  contact privacy, live selection, withdrawal/replacement, explicit completion,
  History, blood-bank fallback and a 390-pixel mobile viewport.
- Screenshots are in test-results/coordination; no deployed data was used.

Local usage and reproduction: [docs/COORDINATION_UI.md](docs/COORDINATION_UI.md).

## Not yet complete

This remains a prototype, not a deployment-ready release. Legacy REST privacy
review, account-removal cleanup, shared
request throttling, geographic indexing and comparative simulation remain pending.
New coordination controls currently use English. Production hosting and real-world
matching have not been tested. No clinical benefit is claimed.

## Local preview verification — 28 October 2026

Completed-only leaderboard, profile donation counts, donation badges and trust
counts now use completed outreach records. Profile and verification authentication
use the shared member guard. All 19 backend tests passed, and the production-build
browser integration passed desktop/mobile requester and donor workflows.
See [local preview and remaining release work](docs/LOCAL_PREVIEW.md).

## GitHub and deployment

This downloaded project folder has no .git directory. Editing it does not update
GitHub, Vercel or Render. Integrate the changes into a clone of the correct GitHub
repository on a feature branch, review/test, then merge to the deployment branch.
Automatic deployment depends on each hosting service's configured repository,
branch and auto-deploy settings; those settings have not been inspected.
Deploy the compatible frontend and backend together when the release is ready.
Production requires NODE_ENV=production and a valid persistent MONGO_URI.
