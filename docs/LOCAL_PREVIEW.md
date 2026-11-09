# Local Phase 1 preview

Run `node backend/scripts/preview.cjs` from the project folder after building the frontend.
Open http://127.0.0.1:4173/demo and choose requester, donor or backup donor.
Use different browser profiles for simultaneous roles; tabs in one profile share login storage.

This server binds only to localhost, creates synthetic accounts, and uses a separate
temporary MongoDB replica set. It never reads `.env` or the production database.
Its role-switching routes must never be mounted in the production server.
Data resets when the process stops. Document verification and SMS are not part of this demo.

The current session uses `D:/LifeLink-preview-temp` for TEMP/TMP because C: ran out
of disk space. This is temporary preview storage, not the production database.

## Verified on 28 October 2026

- Frontend build passed with `--minify=false`, Node heap 256 MB and one Rayon thread.
- 19 backend tests passed, including completed-only rankings and reset-token rejection.
- Browser integration passed requester/donor actions, contact privacy, withdrawal
  recovery, explicit completion, History, fallback directory and 390 px mobile layout.
- Screenshots are in `test-results/coordination`.

## Remaining release work

The local preview is not a completed production release. Legacy-route privacy and
shared throttling, account-removal coordination cleanup, the full three-policy
evaluation, and hosting checks remain. The existing paper uses a separately labelled
two-policy simulation, not measurements of the base paper's implementation.
The local dependency install also lacks `multer`, needed by the full verification
route; restore dependencies with `npm ci` after freeing disk space before running
the full production server. No GitHub push, Vercel deploy or Render deploy was performed.
