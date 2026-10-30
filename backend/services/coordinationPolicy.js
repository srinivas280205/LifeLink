const DEFAULTS = {
  radii: [5, 10, 20, 50],
  normal: { startStage: 0, waitSeconds: 300, batchSize: 10 },
  urgent: { startStage: 1, waitSeconds: 120, batchSize: 20 },
  critical: { startStage: 2, waitSeconds: 45, batchSize: 50 },
  dailyAlertLimit: 10,
  locationMaxAgeSeconds: 86400,
  maxAccuracyMeters: 1000,
  requestCooldownSeconds: 300,
};

function policyFromEnv(env = process.env) {
  const p = structuredClone(DEFAULTS);
  if (env.COORDINATION_RADII) p.radii = env.COORDINATION_RADII.split(',').map(Number);
  if (!p.radii.length || p.radii.some((r, i) => !Number.isFinite(r) || r <= 0 || r > 50 || (i && r <= p.radii[i - 1])) || p.radii.at(-1) !== 50) {
    throw new Error('COORDINATION_RADII must increase and end at 50 km');
  }
  for (const urgency of ['normal', 'urgent', 'critical']) {
    const prefix = `COORDINATION_${urgency.toUpperCase()}`;
    for (const [key, suffix] of [['waitSeconds', 'WAIT_SECONDS'], ['batchSize', 'BATCH_SIZE'], ['startStage', 'START_STAGE']]) {
      if (env[`${prefix}_${suffix}`] !== undefined) p[urgency][key] = Number(env[`${prefix}_${suffix}`]);
    }
    p[urgency].startStage = Math.min(p[urgency].startStage, p.radii.length - 1);
    if (!Number.isInteger(p[urgency].startStage) || p[urgency].startStage < 0 ||
        !Number.isInteger(p[urgency].batchSize) || p[urgency].batchSize < 1 || p[urgency].batchSize > 500 ||
        !Number.isFinite(p[urgency].waitSeconds) || p[urgency].waitSeconds < 1) throw new Error(`Invalid ${prefix} policy`);
  }
  for (const [key, name] of [['dailyAlertLimit', 'DAILY_ALERT_LIMIT'], ['locationMaxAgeSeconds', 'LOCATION_MAX_AGE_SECONDS'], ['maxAccuracyMeters', 'MAX_ACCURACY_METERS'], ['requestCooldownSeconds', 'REQUEST_COOLDOWN_SECONDS']]) {
    if (env[`COORDINATION_${name}`] !== undefined) p[key] = Number(env[`COORDINATION_${name}`]);
    if (!Number.isInteger(p[key]) || p[key] < 1) throw new Error(`Invalid COORDINATION_${name}`);
  }
  return p;
}

function validCoordinates(location) {
  return !!location && typeof location.lat === 'number' && Number.isFinite(location.lat) && Math.abs(location.lat) <= 90 &&
    typeof location.lng === 'number' && Number.isFinite(location.lng) && Math.abs(location.lng) <= 180;
}

function distanceKm(a, b) {
  const rad = n => n * Math.PI / 180;
  const h = Math.sin(rad(b.lat - a.lat) / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(rad(b.lng - a.lng) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, h))));
}

function freshLocation(location, now, policy) {
  if (!validCoordinates(location) || !['manual', 'device'].includes(location.source)) return false;
  const age = now - new Date(location.updatedAt);
  if (!location.updatedAt || !Number.isFinite(age) || age < 0 || age > policy.locationMaxAgeSeconds * 1000) return false;
  return location.source === 'manual' || (Number.isFinite(location.accuracyMeters) && location.accuracyMeters >= 0 && location.accuracyMeters <= policy.maxAccuracyMeters);
}

// Candidate matching only. The hospital must determine clinical eligibility.
const GROUPS = {
  'A+': ['A+', 'A-', 'O+', 'O-'], 'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'], 'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['A-', 'B-', 'AB-', 'O-'], 'O+': ['O+', 'O-'], 'O-': ['O-'],
};
function candidateGroups(group) { return GROUPS[group] || [group]; }

module.exports = { policyFromEnv, validCoordinates, distanceKm, freshLocation, candidateGroups };
