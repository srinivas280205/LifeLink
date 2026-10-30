const { validCoordinates } = require('./coordinationPolicy');

function normalizeLocation(input, now = new Date()) {
  const invalid = message => { const error = new Error(message); error.status = 400; throw error; };
  if (!validCoordinates(input)) invalid('Latitude and longitude must be valid numbers');
  const source = input.source || 'unknown';
  if (!['device', 'manual', 'unknown'].includes(source)) invalid('Invalid location source');
  let updatedAt = null;
  let accuracyMeters = null;
  if (source === 'device') {
    if (typeof input.accuracyMeters !== 'number' || !Number.isFinite(input.accuracyMeters) || input.accuracyMeters < 0) invalid('Device accuracy is required');
    const measured = new Date(input.measuredAt);
    if (!input.measuredAt || !Number.isFinite(+measured) || +measured > +now + 30000) invalid('A valid device measurement time is required');
    updatedAt = new Date(Math.min(+measured, +now));
    accuracyMeters = input.accuracyMeters;
  } else if (source === 'manual') updatedAt = now;
  // Old clients sending coordinates only must not turn them into fresh GPS fixes.
  return { lat: input.lat, lng: input.lng, source, updatedAt, accuracyMeters };
}

module.exports = { normalizeLocation };
