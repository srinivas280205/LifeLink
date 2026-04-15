import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import styles from './Profile.module.css';
import { COUNTRIES, INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';
import EligibilityChecker from '../components/EligibilityChecker';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '', bloodGroup: '', country: 'India', state: '', district: '', isAvailable: true,
  });
  const [saving, setSaving]       = useState(false);
  const [saved, setSaved]         = useState(false);
  const [error, setError]         = useState('');
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [locating, setLocating] = useState(false);
  const [myStats, setMyStats] = useState(null);

  // Password change state
  const [showEligibility, setShowEligibility] = useState(false);
  const [pwForm, setPwForm]     = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwError, setPwError]   = useState('');
  const [pwSaved, setPwSaved]   = useState(false);

  useEffect(() => {
    const hdrs = { Authorization: `Bearer ${token()}` };
    Promise.all([
      fetch(`${API}/api/users/me`, { headers: hdrs }),
      fetch(`${API}/api/users/mystats`, { headers: hdrs }),
    ])
      .then(([meRes, statsRes]) => Promise.all([meRes.json(), statsRes.json()]))
      .then(([data, stats]) => {
        setProfile(data);
        setMyStats(stats);
        setForm({
          fullName:    data.fullName    || '',
          bloodGroup:  data.bloodGroup  || '',
          country:     data.country     || 'India',
          state:       data.state       || '',
          district:    data.district    || '',
          isAvailable: data.isAvailable ?? true,
        });
      })
      .catch(() => navigate('/login'));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f, [name]: value,
      ...(name === 'country' ? { state: '', district: '' } : {}),
      ...(name === 'state'   ? { district: '' } : {}),
    }));
  };

  const districts = (form.country === 'India' && form.state)
    ? (DISTRICTS_BY_STATE[form.state] || []) : [];

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      // isAvailable is saved instantly by its own toggle — exclude from form save
      const { isAvailable: _unused, ...formData } = form;
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      // Sync localStorage
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({
        ...stored,
        fullName:   data.user.fullName,
        bloodGroup: data.user.bloodGroup,
        state:      data.user.state,
        district:   data.user.district,
        isAvailable: data.user.isAvailable,
      }));
      setProfile(p => ({ ...p, ...data.user }));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { setError('Failed to save. Check your connection.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwError('New passwords do not match'); return; }
    if (pwForm.next.length < 6) { setPwError('New password must be at least 6 characters'); return; }
    setPwSaving(true); setPwError(''); setPwSaved(false);
    try {
      const res = await fetch(`${API}/api/users/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (!res.ok) { setPwError(data.message); return; }
      setPwSaved(true);
      setPwForm({ current: '', next: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch { setPwError('Failed to change password.'); }
    finally { setPwSaving(false); }
  };

  const handleToggleAvail = async () => {
    if (togglingAvail) return;
    const next = !form.isAvailable;
    setTogglingAvail(true);
    setForm(f => ({ ...f, isAvailable: next }));
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (res.ok) {
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, isAvailable: next }));
      } else {
        // revert on failure
        setForm(f => ({ ...f, isAvailable: !next }));
      }
    } catch {
      setForm(f => ({ ...f, isAvailable: !next }));
    }
    setTogglingAvail(false);
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`${API}/api/users/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
            body: JSON.stringify({ location: { lat: pos.coords.latitude, lng: pos.coords.longitude } }),
          });
          if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
        } catch { setError('Location save failed'); }
        setLocating(false);
      },
      () => { setError('Location permission denied'); setLocating(false); }
    );
  };

  if (!profile) return (
    <AppShell connected={true}>
      <div className={styles.loading}><div className={styles.spinner} /></div>
    </AppShell>
  );

  return (
    <AppShell connected={true}>
    {showEligibility && <EligibilityChecker onClose={() => setShowEligibility(false)} />}
    <div className={styles.page}>
      <div className={styles.container}>

        {/* ── Avatar header ── */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {profile.bloodGroup
              ? <span className={styles.avatarBlood}>{profile.bloodGroup}</span>
              : <span className={styles.avatarIcon}>👤</span>}
          </div>
          <h1 className={styles.name}>{profile.fullName}</h1>
          <p className={styles.phoneSub}>📞 {profile.phone}</p>
          {(profile.district || profile.state) && (
            <p className={styles.phoneSub}>
              📍 {[profile.district, profile.state].filter(Boolean).join(', ')}
            </p>
          )}
          <div className={styles.badgeRow}>
            <span className={profile.isVerified ? styles.verifiedBadge : styles.unverifiedBadge}>
              {profile.isVerified ? '✅ Verified' : '⏳ Unverified'}
            </span>
          </div>
        </div>

        {/* ── Personal impact stats ── */}
        {myStats && (
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.responsesGiven}</span>
              <span className={styles.statLabel}>🩸 Times Donated</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.requestsPosted}</span>
              <span className={styles.statLabel}>📡 Requests Posted</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.fulfilled}</span>
              <span className={styles.statLabel}>✅ Needs Met</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.sos}</span>
              <span className={styles.statLabel}>🆘 SOS Sent</span>
            </div>
          </div>
        )}

        {/* ── Achievement badges ── */}
        {myStats && (
          <div className={styles.badgesSection}>
            <h3 className={styles.badgesTitle}>🏅 Achievements</h3>
            <div className={styles.badgesGrid}>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 1 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>🩸</span>
                <span className={styles.achieveLabel}>First Drop</span>
                <span className={styles.achieveSub}>Respond to 1 request</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 5 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>💪</span>
                <span className={styles.achieveLabel}>Active Donor</span>
                <span className={styles.achieveSub}>5 donations given</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 10 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>⭐</span>
                <span className={styles.achieveLabel}>Hero</span>
                <span className={styles.achieveSub}>10 donations given</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 20 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>🏆</span>
                <span className={styles.achieveLabel}>Legend</span>
                <span className={styles.achieveSub}>20 donations given</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.fulfilled >= 1 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>✅</span>
                <span className={styles.achieveLabel}>Life Saver</span>
                <span className={styles.achieveSub}>1 need fulfilled</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.sos >= 1 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>🆘</span>
                <span className={styles.achieveLabel}>SOS Veteran</span>
                <span className={styles.achieveSub}>Sent an SOS alert</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Availability toggle ── */}
        <div className={styles.availCard}>
          <div className={styles.availInfo}>
            <p className={styles.availTitle}>Available to Help</p>
            <p className={styles.availSub}>
              {form.isAvailable
                ? '✅ You are visible to others and can receive blood requests'
                : '🔴 You are hidden from the donor list'}
            </p>
            <p className={styles.availHint}>
              {togglingAvail ? '⏳ Saving…' : 'Saved instantly — no need to click Save Changes'}
            </p>
          </div>
          <button
            className={`${styles.toggle} ${form.isAvailable ? styles.toggleOn : styles.toggleOff}`}
            onClick={handleToggleAvail}
            disabled={togglingAvail}
            type="button"
          >
            <span className={styles.toggleKnob} />
          </button>
        </div>

        {/* ── Full editable profile form ── */}
        <form onSubmit={handleSave} className={styles.card}>
          <h2 className={styles.cardTitle}>My Profile</h2>

          {/* Phone — read only */}
          <div className={styles.readonlyGroup}>
            <div className={styles.roRow}>
              <span className={styles.roLabel}>Phone Number</span>
              <span className={styles.roValue}>📞 {profile.phone}</span>
              <span className={styles.roHint}>Cannot be changed</span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.field}>
            <label>Full Name</label>
            <input type="text" name="fullName" value={form.fullName}
              onChange={handleChange} required placeholder="Your full name" />
          </div>

          <div className={styles.field}>
            <label>Blood Group</label>
            <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
              <option value="">Not set</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            {!form.bloodGroup && (
              <span className={styles.bloodGroupWarn}>
                ⚠️ Set your blood group so others can find you for emergencies
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>Country</label>
            <select name="country" value={form.country} onChange={handleChange}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {form.country === 'India' && (
            <div className={styles.field}>
              <label>State / UT</label>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">Select state</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {districts.length > 0 && (
            <div className={styles.field}>
              <label>District</label>
              <select name="district" value={form.district} onChange={handleChange}>
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {saved && <p className={styles.success}>✅ Profile saved successfully</p>}

          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : '💾 Save Changes'}
          </button>

          <div className={styles.cardFooter}>
            <span>Member since {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <span>{profile.isVerified ? '✅ Phone verified' : '⏳ Phone not verified'}</span>
          </div>
        </form>

        {/* ── Shareable Donor Card ── */}
        {profile.bloodGroup && myStats && (
          <div className={styles.donorCardWrap}>
            <h3 className={styles.cardTitle}>🪪 My Donor Card</h3>
            <div className={styles.donorCard} id="donor-card">
              <div className={styles.dcTop}>
                <div className={styles.dcLogo}>
                  <span style={{ fontSize: '1.1rem' }}>❤️</span>
                  <span className={styles.dcBrand}>LifeLink</span>
                </div>
                <span className={styles.dcTag}>Blood Donor</span>
              </div>
              <div className={styles.dcBlood}>{profile.bloodGroup}</div>
              <div className={styles.dcName}>{profile.fullName}</div>
              {(profile.district || profile.state) && (
                <div className={styles.dcLocation}>
                  📍 {[profile.district, profile.state].filter(Boolean).join(', ')}
                </div>
              )}
              <div className={styles.dcStats}>
                <div className={styles.dcStat}>
                  <span className={styles.dcStatNum}>{myStats.responsesGiven}</span>
                  <span className={styles.dcStatLabel}>Donated</span>
                </div>
                <div className={styles.dcDivider} />
                <div className={styles.dcStat}>
                  <span className={styles.dcStatNum}>{myStats.fulfilled}</span>
                  <span className={styles.dcStatLabel}>Lives Saved</span>
                </div>
                <div className={styles.dcDivider} />
                <div className={styles.dcStat}>
                  <span className={styles.dcStatNum}>
                    {myStats.responsesGiven >= 20 ? '🏆' : myStats.responsesGiven >= 10 ? '⭐' : myStats.responsesGiven >= 5 ? '💪' : myStats.responsesGiven >= 1 ? '🩸' : '—'}
                  </span>
                  <span className={styles.dcStatLabel}>Badge</span>
                </div>
              </div>
              <div className={styles.dcFooter}>lifelink.app · Emergency Blood Network</div>
            </div>
            <button
              className={styles.shareCardBtn}
              onClick={() => {
                const text = `🩸 I'm a blood donor on LifeLink!\n\n` +
                  `Blood Group: ${profile.bloodGroup}\n` +
                  `Name: ${profile.fullName}\n` +
                  `Location: ${[profile.district, profile.state].filter(Boolean).join(', ') || 'India'}\n` +
                  `Donations: ${myStats.responsesGiven} | Lives Saved: ${myStats.fulfilled}\n\n` +
                  `Download LifeLink and save lives 🆘`;
                if (navigator.share) {
                  navigator.share({ title: 'My LifeLink Donor Card', text }).catch(() => {});
                } else {
                  navigator.clipboard?.writeText(text);
                  alert('Donor card text copied to clipboard!');
                }
              }}
            >
              📤 Share My Donor Card
            </button>
          </div>
        )}

        {/* ── Admin panel link (admins only) ── */}
        {profile.isAdmin && (
          <div className={styles.card} style={{ borderColor: '#1a237e44', background: 'linear-gradient(135deg, var(--card-bg), #1a237e08)' }}>
            <h2 className={styles.cardTitle}>🛡️ Admin Panel</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.9rem' }}>
              Manage users, view all broadcasts, monitor platform activity.
            </p>
            <button className={styles.saveBtn} style={{ background: 'linear-gradient(135deg, #1a237e, #283593)' }}
              onClick={() => navigate('/admin')}>
              Open Admin Dashboard →
            </button>
          </div>
        )}

        {/* ── Change Password ── */}
        <form onSubmit={handlePasswordChange} className={styles.card}>
          <h2 className={styles.cardTitle}>🔒 Change Password</h2>
          <div className={styles.field}>
            <label>Current Password</label>
            <input type="password" placeholder="Enter current password"
              value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label>New Password</label>
            <input type="password" placeholder="Minimum 6 characters"
              value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required minLength={6} />
          </div>
          <div className={styles.field}>
            <label>Confirm New Password</label>
            <input type="password" placeholder="Re-enter new password"
              value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          {pwError && <p className={styles.error}>{pwError}</p>}
          {pwSaved && <p className={styles.success}>✅ Password changed successfully</p>}
          <button type="submit" className={styles.saveBtn} disabled={pwSaving}>
            {pwSaving ? 'Changing…' : '🔒 Change Password'}
          </button>
        </form>

        {/* ── Eligibility check ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🩺 Can I Donate Today?</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.9rem', lineHeight: 1.5 }}>
            Answer 10 quick questions to check your blood donation eligibility right now.
          </p>
          <button className={styles.gpsBtn} onClick={() => setShowEligibility(true)} type="button"
            style={{ background: 'linear-gradient(135deg,#1a237e,#283593)' }}>
            🩺 Check My Eligibility
          </button>
        </div>

        {/* ── GPS location ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>📍 GPS Location</h2>
          <p className={styles.gpsNote}>
            Share your precise coordinates to appear on the donor map and receive SOS alerts nearby.
            {profile.location?.lat && (
              <span className={styles.gpsSet}>
                {' '}✅ Set ({profile.location.lat.toFixed(4)}, {profile.location.lng.toFixed(4)})
              </span>
            )}
          </p>
          <button className={styles.gpsBtn} onClick={handleGeolocate} disabled={locating} type="button">
            {locating ? '📡 Getting location…' : '📍 Share My Location'}
          </button>
        </div>

      </div>
    </div>
    </AppShell>
  );
}
