# Essential interface

The main navigation now has three choices: Need blood, I can donate, and My requests.
Profile details and language/theme controls are secondary. The duplicate legacy feed,
donor directory, leaderboard and events are no longer linked from these screens.
Their stored records and backend routes were not deleted.

The coordinated request workflow retains hospital-centred expansion, urgency,
response windows, willingness, selection, pause/resume, withdrawal recovery,
explicit donation completion, timeline, private contacts and blood-bank fallback.
Donor availability and location setup are on the donation screen. Profile editing
contains name, phone (read-only), blood group, district and availability.

Core interface strings use the Tamil phrase catalogue in `frontend/src/i18n/coordination.js`.
The saved language survives reload; dates use the matching locale. Names, hospital
names, addresses and other user-supplied data retain their entered spelling.
Donor terminology uses “இரத்தம் வழங்குபவர்”; donor card uses “இரத்த தான அட்டை”.

Validation on 28 October 2026: production build passed; browser checks passed for
three-item navigation, both language-switch directions, persistence, Tamil request
form/progress/profile and 390 px layout. Full coordination browser regression also
passed selection, withdrawal/replacement, completion, privacy and blood-bank fallback.

C: exhausted its space during work. Temporary document work was preserved under
`D:/LifeLink-preview-temp/document-work-backup`. Final documents remain in this
project's submission folder. The generated frontend `dist` is a local junction to
`D:/LifeLink-preview-temp/frontend-dist`; this is not a deployment dependency.
Normal Vercel builds regenerate dist. Free disk space before installing dependencies.
