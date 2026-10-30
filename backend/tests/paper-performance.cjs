// Reproducible local service benchmark for the paper. No production URI is read.
// Run: node backend/tests/paper-performance.cjs [output-directory]
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const mongoose = require('mongoose');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../models/User');
const Broadcast = require('../models/Broadcast');
const Outreach = require('../models/DonorOutreach');
const Commitment = require('../models/DonorCommitment');
const Log = require('../models/EscalationLog');
const Notification = require('../models/Notification');
const coordinator = require('../services/coordinator');
const { policyFromEnv } = require('../services/coordinationPolicy');

const out = path.resolve(process.argv[2] || path.join(__dirname, '../../docs/submission/evidence'));
const warmups = 5, trials = 30, donorCount = 100;
const operations = ['Create request', 'Evaluate and invite', 'Record willingness', 'Select donor', 'Withdraw and resume', 'Complete request', 'Load progress'];
const samples = [];
const models = [User, Broadcast, Outreach, Commitment, Log, Notification];
let database;
async function timed(trial, operation, fn) {
  const t = performance.now();
  const result = await fn();
  const ms = performance.now() - t;
  if (trial >= 0) samples.push({ trial: trial + 1, operation, milliseconds: ms });
  return result;
}
function percentile(sorted, p) { return sorted[Math.ceil(p * sorted.length) - 1]; }
async function main() {
  fs.mkdirSync(out, { recursive: true });
  database = await MongoMemoryReplSet.create({
    binary: { downloadDir: path.resolve(__dirname, '../node_modules/.cache/mongodb-memory-server') },
    replSet: { count: 1 },
  });
  await mongoose.connect(database.getUri(), { dbName: 'lifelink_paper_benchmark' });
  await coordinator.initialize();
  const dbVersion = (await mongoose.connection.db.admin().command({ buildInfo: 1 })).version;
  for (let trial = -warmups; trial < trials; trial++) {
    for (const model of models) await model.deleteMany({});
    const now = new Date();
    // Deterministic, synthetic points: 1.0 to 1.99 km north of the hospital.
    // All 100 donor records pass the initial location/group/availability filter.
    const users = await User.insertMany(Array.from({ length: donorCount + 1 }, (_, i) => ({
      fullName: i ? `Synthetic donor ${i}` : 'Synthetic requester',
      phone: `9000${String(i).padStart(6, '0')}`, password: 'benchmark-only-not-a-login',
      bloodGroup: 'O+', district: 'Controlled fixture', isAvailable: i > 0,
      location: { lat: (1 + (i - 1) / 100) / 111.195, lng: 0, source: 'device', updatedAt: now, accuracyMeters: 20 },
    })));
    const owner = users[0], donor = users[1], backup = users[2];
    const policy = policyFromEnv({});
    let request = await timed(trial, operations[0], () => coordinator.createRequest(owner._id, {
      bloodGroup: 'O+', hospital: 'Synthetic hospital', district: 'Controlled fixture',
      hospitalLocation: { lat: 0, lng: 0 }, candidateTarget: 1, urgency: 'normal',
    }, { policy, now }));
    request = await timed(trial, operations[1], () => coordinator.evaluate(request._id, now));
    assert.equal(await Outreach.countDocuments({ request: request._id }), 10);
    assert.equal(await Notification.countDocuments({ broadcastId: request._id }), 10);
    await timed(trial, operations[2], () => coordinator.act(request._id, donor._id, 'willing', {}, now));
    request = await timed(trial, operations[3], () => coordinator.act(request._id, owner._id, 'select', { donorId: String(donor._id) }, now));
    assert.equal(request.searchStatus, 'paused_target');
    request = await timed(trial, operations[4], () => coordinator.act(request._id, donor._id, 'withdraw', {}, now));
    assert.equal(request.searchStatus, 'searching');
    assert.equal(await Commitment.countDocuments({ request: request._id }), 0);
    // Prepare an already-invited replacement outside the measured completion call.
    await coordinator.act(request._id, backup._id, 'willing', {}, now);
    await coordinator.act(request._id, owner._id, 'select', { donorId: String(backup._id) }, now);
    request = await timed(trial, operations[5], () => coordinator.act(request._id, owner._id, 'complete', { donors: [String(backup._id)] }, now));
    assert.equal(request.status, 'fulfilled');
    assert.equal(await Commitment.countDocuments({ request: request._id }), 0);
    const detail = await timed(trial, operations[6], () => coordinator.detail(request._id, owner._id));
    assert.equal(detail.counts.completed, 1);
    assert.equal(detail.counts.alerted, 10);
    if (trial >= 0 && (trial + 1) % 10 === 0) console.log(`Completed ${trial + 1}/${trials} measured trials`);
  }
  const summary = operations.map(operation => {
    const values = samples.filter(s => s.operation === operation).map(s => s.milliseconds).sort((a,b) => a-b);
    return { operation, n: values.length, medianMs: (values[14] + values[15])/2,
      p95Ms: percentile(values, 0.95), minMs: values[0], maxMs: values.at(-1) };
  });
  const data = { date: new Date().toISOString(), kind: 'Local benchmark on synthetic data; not a policy simulation or field study',
    warmups, trials, donorCount, concurrency: 1, invitationBatch: 10,
    environment: { platform: os.platform(), release: os.release(), cpu: os.cpus()[0].model,
      logicalCpus: os.cpus().length, ramGiB: +(os.totalmem()/2**30).toFixed(1), node: process.version,
      mongoose: mongoose.version, mongoDB: dbVersion, topology: 'single-node temporary replica set on same host' },
    scope: 'Direct awaited service calls including MongoDB transactions. Excludes fixture setup, assertions, warm-up, HTTP transport, Socket.IO delivery, worker polling delay and human response time.',
    percentile: 'P95 nearest-rank observation ceil(0.95*n); median average of middle two observations',
    summary, samples };
  fs.writeFileSync(path.join(out, 'local-performance.json'), JSON.stringify(data, null, 2));
  fs.writeFileSync(path.join(out, 'local-performance-raw.csv'), 'trial,operation,milliseconds\n' + samples.map(s => `${s.trial},${s.operation},${s.milliseconds.toFixed(6)}`).join('\n') + '\n');
  fs.writeFileSync(path.join(out, 'local-performance-summary.csv'), 'operation,n,median_ms,p95_ms,min_ms,max_ms\n' + summary.map(s => `${s.operation},${s.n},${s.medianMs.toFixed(3)},${s.p95Ms.toFixed(3)},${s.minMs.toFixed(3)},${s.maxMs.toFixed(3)}`).join('\n') + '\n');
  console.log(JSON.stringify({ environment: data.environment, summary }, null, 2));
}
main().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => {
  await mongoose.disconnect();
  if (database) await database.stop();
});
