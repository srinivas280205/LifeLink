# Test with two devices

Start the normal app (no prepared accounts or role-switching): ./start-local.ps1 -Lan
Both devices must use the same trusted Wi-Fi. Open http://<computer IPv4>:4180/ on each. Find IPv4 with ipconfig. Keep the computer awake. Windows firewall or guest Wi-Fi isolation may block the second device. No firewall rules are changed by this launcher.

On HTTP LAN pages, phone GPS and PWA installation may be unavailable. Use the manual map pin or coordinates; HTTPS deployment enables the secure browser features, subject to permission.

1. Device A: sign up with a unique email and phone. Click Request blood.
2. Device B: sign up separately, choose O+ blood group, enable availability, and save a location manually near the test hospital.
3. Device A: request O+, target 1 donor, quantity 1, choose and confirm the hospital map pin, submit. Use synthetic details for the review.
4. Device B: open Donate blood. Within the worker's next check, an eligible nearby donor receives an invitation. Consent to contact sharing and choose I can help.
5. Device A: open My requests, select the willing donor. Alerts pause at the target.
6. Device B: withdraw. Device A should show searching again. Another eligible donor must exist to receive a new invitation: the same person is never invited twice for the same request.
7. Sign up a third member (or use another browser session), respond, select and record the simulated donation on completion. Check the timeline and saved history.

For radius expansion: put a donor about 7 km from the hospital and leave the nearby invitation unanswered. Normal response window is 5 minutes; stages are 5, 10, 20, 50 km. Urgent starts at 10 km, critical at 20 km. If there are no candidates in the current stage, expansion can be immediate. Locations must be refreshed within 24 hours. Daily invitation limit is 10 per donor; request cooldown is 5 minutes. These safeguards are intentional, not a maximum number of members.

All accounts are self-reported. Hospital staff remain responsible for eligibility and compatibility. The same login can request blood and offer help on other people's requests. Keep donor pages open during the demonstration.
