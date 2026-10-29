// Browser integration against an isolated database and the production frontend build.
// Set PLAYWRIGHT_MODULE to a local Playwright installation if not in node_modules.
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs/promises');
const express = require('express');
const http = require('node:http');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { Server } = require('socket.io');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const User = require('../models/User');
const Outreach = require('../models/DonorOutreach');
const Broadcast = require('../models/Broadcast');
const coordinator = require('../services/coordinator');

async function main() {
  process.env.JWT_SECRET = 'isolated-browser-test-secret';
  process.env.COORDINATION_NORMAL_WAIT_SECONDS = '10';
  process.env.COORDINATION_REQUEST_COOLDOWN_SECONDS = '1';
  const artifacts = path.resolve(__dirname, '../../test-results/coordination');
  await fs.mkdir(artifacts, { recursive: true });
  let database, browser, server, io, stopWorker;
  const errors = [];
  try {
    database = await MongoMemoryReplSet.create({ binary: { downloadDir: path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server') }, replSet: { count: 1 } });
    await mongoose.connect(database.getUri(), { dbName: 'lifelink_browser_test' });
    await coordinator.initialize();
    const users = await User.create([
      { fullName: 'Demo Requester', phone: '9000000011', password: 'demo-only', bloodGroup: 'O+', district: 'Chennai', isAvailable: false },
      { fullName: 'Demo Donor', phone: '9000000012', password: 'demo-only', bloodGroup: 'O+', district: 'Chennai' },
      { fullName: 'Demo Backup', phone: '9000000013', password: 'demo-only', bloodGroup: 'O+', district: 'Chennai', location: { lat: 13.08, lng: 80.27, source: 'manual', updatedAt: new Date() } },
    ]);
    const app = express(); server = http.createServer(app); io = new Server(server);
    app.set('io', io); app.use(express.json());
    io.use(require('../services/socketAuth').socketAuth({ secret: process.env.JWT_SECRET, findUser: id => User.findById(id).select('_id isBanned') }));
    io.on('connection', socket => { socket.join(`user:${socket.data.userId}`); socket.join('authenticated-feed'); });
    app.use('/api/coordination', require('../routes/coordination'));
    app.use('/api/users', require('../routes/users'));
    app.use('/api/broadcasts', require('../routes/broadcast'));
    app.use('/api/notifications', require('../routes/notifications'));
    app.get('/api/push/vapid-public-key', (req, res) => res.json({ key: null }));
    const dist = path.resolve(__dirname, '../../frontend/dist');
    app.use(express.static(dist));
    app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    stopWorker = require('../jobs/coordination').startCoordinationJob(io);
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    async function signedIn(user, viewport = { width: 1280, height: 900 }) {
      const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
      const token = jwt.sign({ userId: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });
      await context.addInitScript(({ token, user }) => {
        localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('onboarding_dismissed', '1'); localStorage.setItem('ll-lang', 'en');
      }, { token, user: { _id: String(user._id), id: String(user._id), fullName: user.fullName, bloodGroup: 'O+', isAvailable: user.isAvailable } });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/dashboard${user.isAvailable ? '?view=donor' : ''}`);
      await page.getByRole('region', { name: 'Donor coordination', exact: true }).waitFor();
      return page;
    }
    const owner = await signedIn(users[0]); const donor = await signedIn(users[1], { width: 390, height: 844 });
    const panel = page => page.getByRole('region', { name: 'Donor coordination', exact: true });
    async function screenshot(page, locator, filename) {
      const viewport = page.viewportSize();
      // A tall capture avoids the sticky app header covering the middle of a
      // multi-viewport element screenshot. Restore the tested viewport afterward.
      await page.setViewportSize({ ...viewport, height: 2200 });
      await page.evaluate(() => window.scrollTo(0, 0));
      await locator.screenshot({ path: path.join(artifacts, filename) });
      await page.setViewportSize(viewport);
    }
    // Manual location is the GPS-off path; real API persists its source and freshness.
    await panel(donor).locator('summary').filter({ hasText: 'My donor location' }).click();
    await panel(donor).getByRole('button', { name: 'Choose location manually' }).click();
    await panel(donor).getByText('Enter coordinates instead', { exact: true }).click();
    await donor.getByLabel('my location latitude', { exact: true }).fill('13.08');
    await donor.getByLabel('my location longitude', { exact: true }).fill('80.27');
    await panel(donor).getByRole('button', { name: 'Use coordinates' }).click();
    await panel(donor).getByRole('button', { name: 'Confirm and save my location' }).click();
    await panel(donor).getByText(/ready for matching/).waitFor();
    assert.equal((await User.findById(users[1]._id)).location.source, 'manual');

    await panel(owner).getByRole('button', { name: 'New blood request' }).click();
    const form = panel(owner).locator('form');
    await form.getByLabel('Blood group', { exact: true }).selectOption('O+');
    await form.getByLabel('Hospital name', { exact: true }).fill('Demo General Hospital');
    await form.getByLabel('District', { exact: true }).fill('Chennai');
    assert.equal(await form.getByRole('button', { name: 'Find donors', exact: true }).isEnabled(), false);
    await form.getByText('Enter coordinates instead', { exact: true }).click();
    await form.getByLabel('hospital latitude', { exact: true }).fill('13.08');
    await form.getByLabel('hospital longitude', { exact: true }).fill('80.27');
    await form.getByRole('button', { name: 'Use coordinates', exact: true }).click();
    await form.getByRole('checkbox').check();
    await screenshot(owner, form, 'request-form.png');
    const created = owner.waitForResponse(response => response.url() === `${base}/api/coordination` && response.request().method() === 'POST');
    await form.getByRole('button', { name: 'Find donors', exact: true }).click();
    const response = await created; assert.equal(response.status(), 201);
    const request = await response.json();
    await owner.waitForFunction(() => document.querySelector('[aria-label="Request progress"]')?.textContent.includes('Invitations saved'));
    await panel(owner).getByText('Demo Donor', { exact: true }).waitFor({ timeout: 20000 });
    // Use the actual persisted notification link to open the donor's invitation.
    await donor.goto(`${base}/notifications`);
    await donor.getByText('O+ donor request at Demo General Hospital', { exact: true }).waitFor({ timeout: 20000 });
    await donor.getByText('O+ donor request at Demo General Hospital', { exact: true }).click();
    await panel(donor).getByRole('button', { name: 'I can help', exact: true }).waitFor();
    assert.equal(await panel(donor).getByRole('button', { name: 'I can help', exact: true }).isEnabled(), false);
    assert.equal(await panel(donor).locator('a[href^="tel:"]').count(), 0);
    await panel(donor).getByRole('checkbox').check();
    await panel(donor).getByRole('button', { name: 'I can help', exact: true }).click();
    await panel(owner).getByRole('button', { name: 'Select', exact: true }).waitFor();
    assert.equal(await panel(owner).locator('a[href^="tel:"]').count(), 0);
    await panel(owner).getByRole('button', { name: 'Select', exact: true }).click();
    await panel(donor).getByRole('link', { name: /Call requester/ }).waitFor();
    await panel(owner).getByText('Enough donors selected — alerts paused', { exact: true }).last().waitFor();
    assert.equal(await panel(owner).getByRole('button', { name: 'Complete request', exact: true }).isEnabled(), false);
    await screenshot(owner, panel(owner), 'request-progress.png');
    await screenshot(donor, panel(donor), 'donor-selected-mobile.png');
    const overflow = await donor.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
      elements: [...document.querySelectorAll('body *')].filter(el => el.getBoundingClientRect().right > innerWidth + 1).slice(0, 12).map(el => ({ tag: el.tagName, className: el.className, right: el.getBoundingClientRect().right })) }));
    assert.ok(overflow.scrollWidth <= overflow.width, `Mobile overflow: ${JSON.stringify(overflow)}`);
    await panel(donor).getByRole('button', { name: 'Withdraw', exact: true }).click();
    await panel(donor).getByText('Your response: Withdrawn', { exact: true }).waitFor();
    assert.equal(await panel(donor).locator('a[href^="tel:"]').count(), 0);
    assert.equal((await Broadcast.findById(request._id)).searchStatus, 'searching');
    const backup = await signedIn(users[2]);
    await backup.goto(`${base}/dashboard?coordination=${request._id}`);
    await panel(backup).getByRole('checkbox').check();
    await panel(backup).getByRole('button', { name: 'I can help', exact: true }).click();
    await panel(owner).getByRole('button', { name: 'Select', exact: true }).click();
    await panel(owner).getByLabel('Demo Backup actually donated', { exact: true }).check();
    await panel(owner).getByRole('button', { name: 'Complete request', exact: true }).click();
    await owner.waitForFunction(() => document.querySelector('[aria-label="Request progress"]')?.textContent.includes('Donation recorded'));
    assert.equal(await Outreach.countDocuments({ state: 'completed' }), 1);
    assert.equal(await Outreach.countDocuments({ donor: users[1]._id, state: 'completed' }), 0);
    await owner.goto(`${base}/history?coordination=${request._id}`);
    await panel(owner).getByText('Donation recorded', { exact: true }).waitFor();
    assert.equal(await panel(owner).getByText('Recorded donations', { exact: true }).locator('..').innerText(), '1\nRecorded donations');
    await panel(owner).getByText(/Search timeline/).click();
    await screenshot(owner, panel(owner), 'completed-history.png');
    // A device fix is simulated by the browser; no real user's GPS is requested.
    await donor.context().grantPermissions(['geolocation']);
    await donor.context().setGeolocation({ latitude: 13.081, longitude: 80.271, accuracy: 25 });
    await donor.goto(`${base}/dashboard?view=donor`);
    await panel(donor).locator('summary').filter({ hasText: 'My donor location' }).click();
    const savedFix = donor.waitForResponse(r => r.url().endsWith('/api/coordination/location') && r.request().method() === 'PATCH');
    await panel(donor).getByRole('button', { name: 'Share current location', exact: true }).click();
    assert.equal((await savedFix).status(), 200);
    assert.equal((await User.findById(users[1]._id)).location.source, 'device');
    // No eligible donors: the exhausted search links straight to the bank tab.
    const empty = await coordinator.createRequest(users[0]._id, { bloodGroup: 'A-', hospital: 'Demo Empty Search', district: 'Chennai', hospitalLocation: { lat: 13.08, lng: 80.27 }, urgency: 'normal' });
    await owner.goto(`${base}/history?coordination=${empty._id}`);
    await panel(owner).getByRole('link', { name: 'Open blood-bank directory' }).waitFor({ timeout: 20000 });
    await panel(owner).getByRole('button', { name: 'Cancel request', exact: true }).click();
    await panel(owner).getByRole('button', { name: 'Keep request', exact: true }).click();
    assert.equal((await Broadcast.findById(empty._id)).status, 'active');
    await panel(owner).getByRole('link', { name: 'Open blood-bank directory' }).click();
    assert.ok(owner.url().endsWith('/search?tab=banks'));
    await owner.getByRole('heading', { name: 'Blood banks', exact: true }).waitFor();
    assert.deepEqual(errors, []);
    console.log('PASS: hospital confirmation, manual/device location, notification deep link, private contacts, live offers/selection, withdrawal recovery, explicit completion, history, bank fallback and mobile layout.');
    console.log(`Screenshots: ${artifacts}`);
  } catch (error) {
    if (browser) {
      let index = 0;
      for (const context of browser.contexts()) for (const page of context.pages()) {
        await page.screenshot({ path: path.join(artifacts, `failure-${index}.png`), fullPage: true }).catch(() => {});
        await fs.writeFile(path.join(artifacts, `failure-${index}.html`), await page.content()).catch(() => {});
        index++;
      }
    }
    throw error;
  } finally {
    stopWorker?.(); if (browser) await browser.close();
    if (io) await new Promise(resolve => io.close(resolve));
    else if (server) await new Promise(resolve => server.close(resolve));
    await mongoose.disconnect(); if (database) await database.stop();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
