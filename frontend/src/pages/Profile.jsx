import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import styles from './Profile.module.css';
import { COUNTRIES, INDIA_STATES, DISTRICTS_BY_STATE, stateLabel, districtLabel } from '../data/locationData';
import EligibilityChecker from '../components/EligibilityChecker';
import { useLanguage } from '../context/LanguageContext';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');
const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'A1+', 'A1-', 'A2+', 'A2-',
  'A1B+', 'A1B-', 'A2B+', 'A2B-',
  'Bombay (hh)', 'Oh+', 'Oh-',
];

export default function Profile() {
  const navigate = useNavigate();
  const { lang, toggle: toggleLang, t } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({
    fullName: '', gender: '', bloodGroup: '', country: 'India', state: '', district: '', isAvailable: true,
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

  // Re-verify phone state
  const [reverifying, setReverifying] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [verifyOtp, setVerifyOtp] = useState(['', '', '', '', '', '']);
  const [verifyError, setVerifyError] = useState('');
  const [verifyLoading, setVerifyLoading] = useState(false);
  const otpRefs = useRef([]);

  // Delete account state
  const [deleting, setDeleting] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    bloodRequests: true, donorResponded: true, announcements: true, adminMessages: true,
  });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  // Trust / verification state
  const [trustStatus, setTrustStatus] = useState(null);
  const [emailInput, setEmailInput]   = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailMsg, setEmailMsg]       = useState('');
  const [docUploading, setDocUploading] = useState(false);
  const [docMsg, setDocMsg]           = useState('');
  const docInputRef = useRef(null);

  // Check URL params for email verification callback
  const [emailVerifyParam] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('emailVerified');
    }
    return null;
  });

  const fetchTrustStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/verify/status`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) setTrustStatus(await res.json());
    } catch { /* ignore */ }
  }, []);

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
        if (data.notifPrefs) setNotifPrefs(data.notifPrefs);
        if (data.email) setEmailInput(data.email);
        setForm({
          fullName:    data.fullName    || '',
          gender:      data.gender      || '',
          bloodGroup:  data.bloodGroup  || '',
          country:     data.country     || 'India',
          state:       data.state       || '',
          district:    data.district    || '',
          isAvailable: data.isAvailable ?? true,
        });
      })
      .catch(() => navigate('/login'));
    fetchTrustStatus();
  }, [navigate, fetchTrustStatus]);

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
      const { isAvailable: _unused, gender, ...rest } = form;
      const formData = { ...rest, gender }; // include gender explicitly
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
    } catch { setError(t('failedSave')); }
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
    } catch { setPwError(t('failedSave')); }
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

  const handleResendVerification = async () => {
    setReverifying(true);
    setVerifyError('');
    try {
      const res = await fetch(`${API}/api/users/resend-verification`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.message); setReverifying(false); return; }
      setShowOtpInput(true);
    } catch { setVerifyError('Failed to send OTP. Check your connection.'); }
    setReverifying(false);
  };

  const handleOtpKey = (i, e) => {
    const val = e.target.value.replace(/\D/, '');
    if (!val) {
      const next = [...verifyOtp]; next[i] = '';
      setVerifyOtp(next);
      if (i > 0) otpRefs.current[i - 1]?.focus();
      return;
    }
    const next = [...verifyOtp]; next[i] = val.slice(-1);
    setVerifyOtp(next);
    if (i < 5) otpRefs.current[i + 1]?.focus();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = verifyOtp.join('');
    if (code.length < 6) { setVerifyError('Please enter the 6-digit OTP'); return; }
    setVerifyLoading(true); setVerifyError('');
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: profile.phone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setVerifyError(data.message); setVerifyLoading(false); return; }
      setProfile(p => ({ ...p, isVerified: true }));
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      localStorage.setItem('user', JSON.stringify({ ...stored, isVerified: true }));
      setShowOtpInput(false);
      setVerifyOtp(['', '', '', '', '', '']);
    } catch { setVerifyError('Verification failed. Try again.'); }
    setVerifyLoading(false);
  };

  const handleNotifPrefs = async (key, value) => {
    const updated = { ...notifPrefs, [key]: value };
    setNotifPrefs(updated);
    setPrefsSaving(true);
    try {
      await fetch(`${API}/api/users/notif-prefs`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ [key]: value }),
      });
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch { /* revert */ setNotifPrefs(prev => ({ ...prev, [key]: !value })); }
    setPrefsSaving(false);
  };

  const handleSendVerifyEmail = async () => {
    if (!emailInput.trim()) return;
    setEmailSending(true); setEmailMsg('');
    try {
      const res = await fetch(`${API}/api/verify/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ email: emailInput }),
      });
      const data = await res.json();
      if (!res.ok) { setEmailMsg(`❌ ${data.message}`); return; }
      setEmailMsg(data.devMode ? t('emailDevMsg') : t('emailSentMsg'));
      fetchTrustStatus();
    } catch { setEmailMsg('❌ Failed to send. Check your connection.'); }
    setEmailSending(false);
  };

  const handleDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDocUploading(true); setDocMsg('');
    try {
      const formData = new FormData();
      formData.append('doc', file);
      const res = await fetch(`${API}/api/verify/upload-doc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) { setDocMsg(`❌ ${data.message}`); return; }
      setDocMsg(t('docUploaded'));
      fetchTrustStatus();
    } catch { setDocMsg('❌ Upload failed. Check your connection.'); }
    setDocUploading(false);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t('deleteConfirm'));
    if (!confirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/api/users/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/');
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to delete account.');
      }
    } catch { alert('Failed to delete account. Check your connection.'); }
    setDeleting(false);
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
              {profile.isVerified ? t('verified') : t('notVerified')}
            </span>
          </div>

          {/* Re-verify phone for unverified users */}
          {!profile.isVerified && (
            <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
              {!showOtpInput ? (
                <button
                  onClick={handleResendVerification}
                  disabled={reverifying}
                  style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8,
                    padding: '0.5rem 1.1rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                >
                  {reverifying ? t('sendingOtpVerify') : t('verifyMyPhone')}
                </button>
              ) : (
                <form onSubmit={handleVerifyOtp} style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', margin: 0 }}>{t('enterOtpFor')} {profile.phone}</p>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {verifyOtp.map((d, i) => (
                      <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={d}
                        onChange={e => handleOtpKey(i, e)}
                        onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) otpRefs.current[i - 1]?.focus(); }}
                        autoFocus={i === 0}
                        style={{ width: 36, height: 42, textAlign: 'center', fontSize: '1.2rem',
                          fontWeight: 700, border: '2px solid var(--border)', borderRadius: 8,
                          background: 'var(--input-bg, var(--card-bg))', color: 'var(--text)' }}
                      />
                    ))}
                  </div>
                  {verifyError && <p style={{ color: '#d32f2f', fontSize: '0.8rem', margin: 0 }}>{verifyError}</p>}
                  <button
                    type="submit"
                    disabled={verifyLoading || verifyOtp.join('').length < 6}
                    style={{ background: '#388e3c', color: '#fff', border: 'none', borderRadius: 8,
                      padding: '0.45rem 1.1rem', cursor: 'pointer', fontSize: '0.88rem', fontWeight: 600 }}
                  >
                    {verifyLoading ? t('verifying2') : t('verifyBtn2')}
                  </button>
                  <button type="button" onClick={() => { setShowOtpInput(false); setVerifyOtp(['','','','','','']); setVerifyError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    {t('cancel')}
                  </button>
                </form>
              )}
              {verifyError && !showOtpInput && <p style={{ color: '#d32f2f', fontSize: '0.8rem', marginTop: '0.4rem' }}>{verifyError}</p>}
            </div>
          )}
        </div>

        {/* ── Email verified callback notification ── */}
        {emailVerifyParam === 'success' && (
          <div style={{ background: '#e8f5e9', border: '1px solid #a5d6a7', borderRadius: 10,
            padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#2e7d32', fontWeight: 600, fontSize: '0.9rem' }}>
            {t('emailVerifiedSuccess')}
          </div>
        )}
        {emailVerifyParam === 'error' && (
          <div style={{ background: '#fce4ec', border: '1px solid #ef9a9a', borderRadius: 10,
            padding: '0.75rem 1rem', marginBottom: '0.75rem', color: '#b71c1c', fontWeight: 600, fontSize: '0.9rem' }}>
            {t('emailVerifiedError')}
          </div>
        )}

        {/* ── Trust Score Widget ── */}
        {trustStatus && (() => {
          const { trustScore, trustLevel } = trustStatus;
          const STEPS = [
            { score: 1, icon: '🔵', labelKey: 'trustStep1', done: trustStatus.isVerified },
            { score: 2, icon: '🔵', labelKey: 'trustStep2', done: trustStatus.emailVerified },
            { score: 3, icon: '🟡', labelKey: 'trustStep3', done: ['pending','approved'].includes(trustStatus.docStatus) },
            { score: 4, icon: '🟢', labelKey: 'trustStep4', done: trustStatus.docStatus === 'approved' },
            { score: 5, icon: '🏆', labelKey: 'trustStep5', done: (trustStatus.donationCount || 0) >= 10 },
          ];
          const LEVEL_LABELS = {
            new:          t('trustNew'),
            phone:        t('trustPhone'),
            email:        t('trustEmail'),
            doc_pending:  t('trustDocPending'),
            doc_approved: t('trustDocApproved'),
            trusted:      t('trustTrusted'),
          };
          const LEVEL_COLORS = {
            new: '#9e9e9e', phone: '#1976d2', email: '#1976d2',
            doc_pending: '#f57f17', doc_approved: '#388e3c', trusted: '#d32f2f',
          };
          return (
            <div style={{
              background: 'var(--card-bg)', border: '1px solid var(--border)',
              borderRadius: 14, padding: '1.2rem', marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
                  {t('trustScore')}
                </h3>
                <span style={{
                  background: LEVEL_COLORS[trustLevel] + '22',
                  color: LEVEL_COLORS[trustLevel],
                  border: `1px solid ${LEVEL_COLORS[trustLevel]}55`,
                  borderRadius: 20, padding: '0.2rem 0.65rem',
                  fontSize: '0.8rem', fontWeight: 700,
                }}>
                  {LEVEL_LABELS[trustLevel] || t('trustNew')}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, marginBottom: '1rem', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 4,
                  width: `${(trustScore / 5) * 100}%`,
                  background: `linear-gradient(90deg, #1976d2, ${LEVEL_COLORS[trustLevel]})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                {STEPS.map((step) => (
                  <div key={step.score} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
                    <span style={{ fontSize: '1rem', opacity: step.done ? 1 : 0.35 }}>
                      {step.done ? '✅' : '⬜'}
                    </span>
                    <span style={{ color: step.done ? 'var(--text)' : 'var(--muted)', fontWeight: step.done ? 600 : 400 }}>
                      {t(step.labelKey)}
                    </span>
                    {step.done && (
                      <span style={{ marginLeft: 'auto', color: '#388e3c', fontSize: '0.75rem', fontWeight: 700 }}>
                        {t('trustComplete')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <p style={{ margin: '0.75rem 0 0', fontSize: '0.78rem', color: 'var(--muted)', lineHeight: 1.5 }}>
                {t('trustScoreDesc')}
              </p>
            </div>
          );
        })()}

        {/* ── Personal impact stats ── */}
        {myStats && (
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.responsesGiven}</span>
              <span className={styles.statLabel}>{t('timesDonated')}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.requestsPosted}</span>
              <span className={styles.statLabel}>{t('requestsPosted')}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.fulfilled}</span>
              <span className={styles.statLabel}>{t('needsMetStat')}</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statNum}>{myStats.sos}</span>
              <span className={styles.statLabel}>{t('sosSent')}</span>
            </div>
          </div>
        )}

        {/* ── Achievement badges ── */}
        {myStats && (
          <div className={styles.badgesSection}>
            <h3 className={styles.badgesTitle}>{t('achievements')}</h3>
            <div className={styles.badgesGrid}>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 1 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>🩸</span>
                <span className={styles.achieveLabel}>{t('achieveFirstDrop')}</span>
                <span className={styles.achieveSub}>{t('achieveFirstSub')}</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 5 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>💪</span>
                <span className={styles.achieveLabel}>{t('achieveActiveDonor')}</span>
                <span className={styles.achieveSub}>{t('achieveActiveSub')}</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 10 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>⭐</span>
                <span className={styles.achieveLabel}>{t('achieveHero')}</span>
                <span className={styles.achieveSub}>{t('achieveHeroSub')}</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.responsesGiven >= 20 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>🏆</span>
                <span className={styles.achieveLabel}>{t('achieveLegend')}</span>
                <span className={styles.achieveSub}>{t('achieveLegendSub')}</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.fulfilled >= 1 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>✅</span>
                <span className={styles.achieveLabel}>{t('achieveLifeSaver')}</span>
                <span className={styles.achieveSub}>{t('achieveLifeSub')}</span>
              </div>
              <div className={`${styles.achieveBadge} ${myStats.sos >= 1 ? styles.earned : styles.locked}`}>
                <span className={styles.achieveIcon}>🆘</span>
                <span className={styles.achieveLabel}>{t('achieveSos')}</span>
                <span className={styles.achieveSub}>{t('achieveSosSub')}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Availability toggle ── */}
        <div className={styles.availCard}>
          <div className={styles.availInfo}>
            <p className={styles.availTitle}>{t('availableToHelp')}</p>
            <p className={styles.availSub}>
              {form.isAvailable ? t('availableOn') : t('availableOff')}
            </p>
            <p className={styles.availHint}>
              {togglingAvail ? t('savingToggle') : t('savedInstantly')}
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
          <h2 className={styles.cardTitle}>{t('myProfile')}</h2>

          {/* Phone — read only */}
          <div className={styles.readonlyGroup}>
            <div className={styles.roRow}>
              <span className={styles.roLabel}>{t('phoneNumber')}</span>
              <span className={styles.roValue}>📞 {profile.phone}</span>
              <span className={styles.roHint}>{t('phoneReadonly')}</span>
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.field}>
            <label>{t('fullName')}</label>
            <input type="text" name="fullName" value={form.fullName}
              onChange={handleChange} required placeholder={t('namePlaceholder')} />
          </div>

          <div className={styles.field}>
            <label>{t('gender')}</label>
            <select name="gender" value={form.gender} onChange={handleChange}>
              <option value="">{t('preferNotSay')}</option>
              <option value="Male">{t('male')}</option>
              <option value="Female">{t('female')}</option>
              <option value="Other">{t('other')}</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>{t('bloodGroup')}</label>
            <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
              <option value="">{t('notSet')}</option>
              {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
            </select>
            {!form.bloodGroup && (
              <span className={styles.bloodGroupWarn}>
                {t('bloodGroupWarn')}
              </span>
            )}
          </div>

          <div className={styles.field}>
            <label>{t('country')}</label>
            <select name="country" value={form.country} onChange={handleChange}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {form.country === 'India' && (
            <div className={styles.field}>
              <label>{t('state')}</label>
              <select name="state" value={form.state} onChange={handleChange}>
                <option value="">{t('selectState')}</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{stateLabel(s, lang)}</option>)}
              </select>
            </div>
          )}

          {districts.length > 0 && (
            <div className={styles.field}>
              <label>{t('district')}</label>
              <select name="district" value={form.district} onChange={handleChange}>
                <option value="">{t('selectDistrict')}</option>
                {districts.map(d => <option key={d} value={d}>{districtLabel(d, lang)}</option>)}
              </select>
            </div>
          )}

          {error && <p className={styles.error}>{error}</p>}
          {saved && <p className={styles.success}>{t('profileSaved')}</p>}

          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? t('saving') : t('saveChanges')}
          </button>

          <div className={styles.cardFooter}>
            <span>{t('memberSince')} {new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</span>
            <span>{profile.isVerified ? t('phoneVerified') : t('phoneNotVerified')}</span>
          </div>
        </form>

        {/* ── Shareable Donor Card ── */}
        {profile.bloodGroup && myStats && (
          <div className={styles.donorCardWrap}>
            <h3 className={styles.cardTitle}>{t('donorCard')}</h3>
            <div className={styles.donorCard} id="donor-card">
              <div className={styles.dcTop}>
                <div className={styles.dcLogo}>
                  <span style={{ fontSize: '1.1rem' }}>❤️</span>
                  <span className={styles.dcBrand}>LifeLink</span>
                </div>
                <span className={styles.dcTag}>{t('bloodDonor')}</span>
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
                  <span className={styles.dcStatLabel}>{t('donated')}</span>
                </div>
                <div className={styles.dcDivider} />
                <div className={styles.dcStat}>
                  <span className={styles.dcStatNum}>{myStats.fulfilled}</span>
                  <span className={styles.dcStatLabel}>{t('livesSaved')}</span>
                </div>
                <div className={styles.dcDivider} />
                <div className={styles.dcStat}>
                  <span className={styles.dcStatNum}>
                    {myStats.responsesGiven >= 20 ? '🏆' : myStats.responsesGiven >= 10 ? '⭐' : myStats.responsesGiven >= 5 ? '💪' : myStats.responsesGiven >= 1 ? '🩸' : '—'}
                  </span>
                  <span className={styles.dcStatLabel}>{t('badge')}</span>
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
              {t('shareCard')}
            </button>
          </div>
        )}

        {/* ── Admin panel link (admins only) ── */}
        {profile.isAdmin && (
          <div className={styles.card} style={{ borderColor: '#1a237e44', background: 'linear-gradient(135deg, var(--card-bg), #1a237e08)' }}>
            <h2 className={styles.cardTitle}>{t('adminPanel')}</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.9rem' }}>
              {t('adminPanelDesc')}
            </p>
            <button className={styles.saveBtn} style={{ background: 'linear-gradient(135deg, #1a237e, #283593)' }}
              onClick={() => navigate('/admin')}>
              {t('openAdminDash')}
            </button>
          </div>
        )}

        {/* ── Change Password ── */}
        <form onSubmit={handlePasswordChange} className={styles.card}>
          <h2 className={styles.cardTitle}>{t('changePassword')}</h2>
          <div className={styles.field}>
            <label>{t('currentPassword')}</label>
            <input type="password" placeholder={t('currentPasswordPh')}
              value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
          </div>
          <div className={styles.field}>
            <label>{t('newPasswordLabel')}</label>
            <input type="password" placeholder={t('minPassword')}
              value={pwForm.next} onChange={e => setPwForm(f => ({ ...f, next: e.target.value }))} required minLength={6} />
          </div>
          <div className={styles.field}>
            <label>{t('confirmNewPassword')}</label>
            <input type="password" placeholder={t('reenterPassword')}
              value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          {pwError && <p className={styles.error}>{pwError}</p>}
          {pwSaved && <p className={styles.success}>{t('passwordChanged')}</p>}
          <button type="submit" className={styles.saveBtn} disabled={pwSaving}>
            {pwSaving ? t('changingPw') : t('changePasswordBtn')}
          </button>
        </form>

        {/* ── Eligibility check ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{t('canIDonate')}</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.9rem', lineHeight: 1.5 }}>
            {t('canIDonateDesc')}
          </p>
          <button className={styles.gpsBtn} onClick={() => setShowEligibility(true)} type="button"
            style={{ background: 'linear-gradient(135deg,#1a237e,#283593)' }}>
            {t('checkEligibility')}
          </button>
        </div>

        {/* ── GPS location ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{t('gpsLocation')}</h2>
          <p className={styles.gpsNote}>
            {t('gpsNote')}
            {profile.location?.lat && (
              <span className={styles.gpsSet}>
                {' '}✅ Set ({profile.location.lat.toFixed(4)}, {profile.location.lng.toFixed(4)})
              </span>
            )}
          </p>
          <button className={styles.gpsBtn} onClick={handleGeolocate} disabled={locating} type="button">
            {locating ? t('gettingGps') : t('shareLocation')}
          </button>
        </div>

        {/* ── Notification Preferences ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>🔔 Notification Preferences</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
            Choose which notifications you want to receive. Changes are saved instantly.
          </p>
          {[
            { key: 'bloodRequests',  icon: '🩸', label: 'Blood Requests',   desc: 'Alert when a matching blood request is broadcast near you' },
            { key: 'donorResponded', icon: '✅', label: 'Donor Responses',  desc: 'Alert when a donor responds to your request' },
            { key: 'announcements',  icon: '📢', label: 'Announcements',    desc: 'Platform-wide announcements from LifeLink' },
            { key: 'adminMessages',  icon: '✉️', label: 'Admin Messages',   desc: 'Direct messages from the admin team' },
          ].map(({ key, icon, label, desc }) => (
            <div key={key} style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '0.75rem 0', borderBottom: '1px solid var(--border)',
            }}>
              <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>{label}</p>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--muted)' }}>{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => handleNotifPrefs(key, !notifPrefs[key])}
                disabled={prefsSaving}
                style={{
                  width: 46, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: notifPrefs[key] ? '#d32f2f' : 'var(--border)',
                  position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <span style={{
                  position: 'absolute', top: 3,
                  left: notifPrefs[key] ? 23 : 3,
                  width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }} />
              </button>
            </div>
          ))}
          {prefsSaved && (
            <p style={{ color: '#2e7d32', fontSize: '0.82rem', marginTop: '0.6rem', fontWeight: 600 }}>
              ✅ Preferences saved
            </p>
          )}
        </div>

        {/* ── Email Verification ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{t('verifyEmail')}</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.9rem', lineHeight: 1.5 }}>
            {t('verifyEmailDesc')}
          </p>
          {trustStatus?.emailVerified ? (
            <p style={{ color: '#388e3c', fontWeight: 700, fontSize: '0.9rem' }}>
              {t('emailAlreadyVerified')} {trustStatus.email && `(${trustStatus.email})`}
            </p>
          ) : (
            <>
              <div className={styles.field}>
                <label>{t('emailAddress')}</label>
                <input
                  type="email"
                  placeholder={t('emailPh')}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  style={{ marginBottom: 0 }}
                />
              </div>
              {emailMsg && (
                <p style={{
                  color: emailMsg.startsWith('✅') ? '#2e7d32' : emailMsg.startsWith('⚠️') ? '#f57f17' : '#d32f2f',
                  fontSize: '0.84rem', marginTop: '0.5rem', fontWeight: 600,
                }}>{emailMsg}</p>
              )}
              <button
                type="button"
                disabled={emailSending || !emailInput.trim()}
                onClick={handleSendVerifyEmail}
                className={styles.gpsBtn}
                style={{ marginTop: '0.75rem' }}
              >
                {emailSending ? t('sendingVerifyLink') : t('sendVerifyLink')}
              </button>
              <p style={{ fontSize: '0.76rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                {t('emailUnverified')} — {t('trustStep2')}
              </p>
            </>
          )}
        </div>

        {/* ── Blood Group Document Upload ── */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>{t('uploadDoc')}</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.9rem', lineHeight: 1.5 }}>
            {t('uploadDocDesc')}
          </p>

          {trustStatus?.docStatus === 'approved' ? (
            <p style={{ color: '#388e3c', fontWeight: 700, fontSize: '0.9rem' }}>
              {t('docApproved')}
            </p>
          ) : trustStatus?.docStatus === 'pending' ? (
            <p style={{ color: '#f57f17', fontWeight: 700, fontSize: '0.9rem' }}>
              {t('docPending')} — {t('uploadDocDesc').split('.')[1]?.trim() || 'Admin will review within 24 hours.'}
            </p>
          ) : trustStatus?.docStatus === 'rejected' ? (
            <>
              <p style={{ color: '#d32f2f', fontWeight: 700, fontSize: '0.9rem' }}>
                {t('docRejected')}
              </p>
              {trustStatus.docRejectedReason && (
                <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                  {t('docRejectedReason')} {trustStatus.docRejectedReason}
                </p>
              )}
              <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                {t('docDisclaimer')}
              </p>
              <input type="file" ref={docInputRef} accept="image/*,.pdf"
                onChange={handleDocUpload} style={{ display: 'none' }} />
              <button type="button" disabled={docUploading} onClick={() => docInputRef.current?.click()}
                className={styles.gpsBtn} style={{ background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' }}>
                {docUploading ? t('uploadingDoc') : t('docReupload')}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: '0.78rem', color: '#e65100', marginBottom: '0.6rem',
                background: '#fff3e0', padding: '0.5rem 0.75rem', borderRadius: 8, lineHeight: 1.5 }}>
                {t('docDisclaimer')}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                {t('docAccepts')}
              </p>
              {docMsg && (
                <p style={{
                  color: docMsg.startsWith('✅') ? '#2e7d32' : '#d32f2f',
                  fontSize: '0.84rem', marginBottom: '0.5rem', fontWeight: 600,
                }}>{docMsg}</p>
              )}
              <input type="file" ref={docInputRef} accept="image/*,.pdf"
                onChange={handleDocUpload} style={{ display: 'none' }} />
              <button type="button" disabled={docUploading} onClick={() => docInputRef.current?.click()}
                className={styles.gpsBtn}>
                {docUploading ? t('uploadingDoc') : t('uploadDocBtn')}
              </button>
            </>
          )}
        </div>

        {/* ── Delete Account ── */}
        <div className={styles.card} style={{ borderColor: '#d32f2f55', background: 'linear-gradient(135deg, var(--card-bg), #d32f2f08)' }}>
          <h2 className={styles.cardTitle} style={{ color: '#d32f2f' }}>{t('deleteAccount')}</h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--muted)', marginBottom: '0.9rem', lineHeight: 1.6 }}>
            {t('deleteAccountDesc')}
          </p>
          <button
            type="button"
            disabled={deleting}
            onClick={handleDeleteAccount}
            style={{ background: '#d32f2f', color: '#fff', border: 'none', borderRadius: 8,
              padding: '0.6rem 1.4rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 700,
              opacity: deleting ? 0.7 : 1 }}
          >
            {deleting ? t('deleting') : t('deleteBtn')}
          </button>
        </div>

      </div>
    </div>
    </AppShell>
  );
}
