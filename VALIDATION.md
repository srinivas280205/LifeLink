# Validation status

Fresh Desktop copy tested on 7 November 2026.

- Frontend production build: passed.
- Backend automated checks: 19 passed, 0 failed. Includes immediate radius expansion, matching filters, response states, pause/resume, withdrawal, exclusive commitments, alert limits, privacy, expiry, persistence and route authorization.
- Browser: homepage Request Blood sends logged-out users to login; signup returns to the request form. Hospital coordinates and confirmation, blood group and request creation verified.
- Browser: live donor response visible to requester; selection pauses new invitations; selected donor sees requester contact; Withdraw restarts searching.
- API: background worker invites a replacement donor, willingness accepted, selection pauses, completion records only selected actual donors. Demo outcome: 2 invited, 1 withdrawn, 1 completed.
- Restart: local account login and saved fulfilled request verified after stopping and restarting backend.
- Tests use synthetic people and a Demo Hospital. No clinical outcome was tested.

Demo accounts (local only): requester@example.test, donor@example.test, replacement@example.test. Password: LifeLinkDemo!2026. Do not use these accounts or password in production.

Not verified for release: deployment, real phones and GPS accuracy, external map uptime, real donor availability, load testing, all Tamil wording, closed-app push notifications. Email password recovery is not implemented. This is a local final-year prototype, not a verified medical or hospital service.

## External demonstration verification — 9 November 2026

- Frontend production build passed after adding the demo guide and simulation banner.
- Automated end-to-end check against the running demo API and actual worker passed: staged expansion from 5 km, two distinct invitations, willingness, selection, target pause, withdrawal recovery, replacement selection and completion.
- Saved outcome: fulfilled, one recorded donation, ten timeline entries. These are synthetic test outcomes, not clinical results.
- Browser participant switch opened the requester's saved completed request and showed the withdrawn donor and recorded replacement donation.

## Normal multi-member acceptance — 9 November 2026

- Backend suite: 21 passed, zero failed. Includes independent authenticated API limits for members sharing Wi-Fi and production origin restrictions.
- Frontend build passed.
- Normal mode (demo disabled): three new synthetic members registered through the LAN frontend proxy. Two authenticated WebSocket clients connected. Actual worker invitations, willingness, selected-target pause, withdrawal/resume, replacement and completion passed. Fifteen private update events observed; one simulated donation recorded. Test donors made unavailable afterwards.
- LAN URL responded from the host at http://192.168.1.141:4180/. Physical phone connectivity still needs user verification; no firewall settings were changed.
- Deployment configuration prepared; Vercel/Render/Atlas public deployment has not been performed or verified.

## Authentication routing check — 10 November 2026

- Login and Signup render their forms even when a saved session exists; no automatic public-route redirect.
- Protected pages check the saved token against the backend. Invalid sessions return to Login; connection failure shows Retry instead of opening coordination.
- Browser verified new synthetic account registration, valid login, logout, and both auth forms with an existing session. Invalid credentials were rejected.
- Backend suite: 21 passed. Frontend production build passed. These are local checks; public Render/Atlas connectivity remains a separate deployment check.

## Account and deployment regression checks — 11 November 2026

- 22 isolated backend tests passed; frontend production build passed.
- New signup/login regression verifies email case, phone country-code/spacing variants, password validation, profile access and duplicate-phone rejection.
- Signup, Profile and Request Blood now share the existing full supported blood-group list.
- Home retains the session and displays a signed-in indicator with a Continue link.
- Missing FRONTEND_ORIGINS no longer crashes this deployment: production defaults to the exact existing LifeLink Vercel origin and still rejects other origins. Explicit configuration overrides that default.
- Coordination is enabled by default; COORDINATION_ENABLED=false still disables it.
- Public runtime verification remains pending until the new backend deployment is running; the previous public backend returned 404 for /health and /api/demo.
