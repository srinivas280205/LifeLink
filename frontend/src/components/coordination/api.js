import API_BASE from '../../config/api.js';
import { translate } from '../../i18n/coordination';

export async function coordinationApi(path = '', options = {}) {
  const response = await fetch(`${API_BASE}/api/coordination${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}`, ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.message || 'Unable to load donor coordination. Please retry.');
    error.status = response.status;
    throw error;
  }
  return body;
}

export function deviceLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Location is unavailable. Choose a location on the map.'));
    navigator.geolocation.getCurrentPosition(position => resolve({
      lat: position.coords.latitude, lng: position.coords.longitude,
      accuracyMeters: position.coords.accuracy, measuredAt: position.timestamp, source: 'device',
    }), () => reject(new Error('Could not read your location. Allow location access or choose it manually.')),
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  });
}

export const labels = {
  searching: 'Searching for donors', paused_target: 'Enough donors selected — alerts paused',
  paused_manual: 'Search paused by you', exhausted: 'Automated search exhausted', stopped: 'Search ended',
  notified: 'Invited', willing: 'Willing to help', declined: 'Unavailable', no_response: 'No response yet',
  selected: 'Selected', withdrawn: 'Withdrawn', completed: 'Donation recorded',
  fulfilled: 'Completed', cancelled: 'Cancelled', expired: 'Expired', active: 'Active',
};
export const formatDate = value => value ? new Date(value).toLocaleString(localStorage.getItem('ll-lang') === 'ta' ? 'ta-IN' : 'en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
export function displayError(message) {
  if (localStorage.getItem('ll-lang') !== 'ta') return message;
  const localized = translate(message);
  return localized === message ? 'செயலை முடிக்க முடியவில்லை. பக்கத்தைப் புதுப்பித்து மீண்டும் முயலவும்.' : localized;
}
