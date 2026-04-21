import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { COUNTRIES, INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PhoneInput, { toApiPhone } from '../components/PhoneInput';

import API_BASE from '../config/api.js';
const API = API_BASE;
const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'A1+', 'A1-', 'A2+', 'A2-',
  'A1B+', 'A1B-', 'A2B+', 'A2B-',
  'Bombay (hh)', 'Oh+', 'Oh-',
];

// ── Step 1: Registration form ─────────────────────────────────────────────────
function SignupForm({ onSuccess }) {
  const [phone, setPhone] = useState({ countryCode: '+91', number: '' });
  const [form, setForm] = useState({
    fullName: '', password: '',
    gender: '',
    bloodGroup: '',
    country: 'India', state: '', district: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({
      ...p, [name]: value,
      ...(name === 'country' ? { state: '', district: '' } : {}),
      ...(name === 'state'   ? { district: '' } : {}),
    }));
    setError('');
  };

  const districts = (form.country === 'India' && form.state)
    ? (DISTRICTS_BY_STATE[form.state] || []) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    const apiPhone = toApiPhone(phone); // e.g. "+919344763919"
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: apiPhone }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Signup failed'); return; }
      onSuccess({
        token: data.token,
        user: data.user,
        phone: apiPhone,
        name: form.fullName,
        devMode: data.devMode,
      });
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <>
      <h2 className={styles.title}>Create account</h2>
      <p className={styles.subtitle}>Join India's Emergency Blood Network</p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="fullName">Full Name</label>
          <input id="fullName" name="fullName" type="text" placeholder="Your full name"
            value={form.fullName} onChange={handleChange} required autoComplete="name" />
        </div>

        <div className={styles.field}>
          <label htmlFor="gender">Gender <span className={styles.optionalTag}>(optional)</span></label>
          <select id="gender" name="gender" value={form.gender} onChange={handleChange}>
            <option value="">Prefer not to say</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Phone with country code picker */}
        <div className={styles.field}>
          <label>Phone Number</label>
          <PhoneInput value={phone} onChange={setPhone} required />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Minimum 6 characters"
            value={form.password} onChange={handleChange} required minLength={6} autoComplete="new-password" />
        </div>

        <div className={styles.field}>
          <label htmlFor="bloodGroup">
            Your Blood Group <span className={styles.optionalTag}>(optional — set in profile later)</span>
          </label>
          <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={handleChange}>
            <option value="">I don't know / Skip</option>
            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="country">Country</label>
          <select id="country" name="country" value={form.country} onChange={handleChange}>
            {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {form.country === 'India' && (
          <div className={styles.field}>
            <label htmlFor="state">State / UT</label>
            <select id="state" name="state" value={form.state} onChange={handleChange}>
              <option value="">Select state</option>
              {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        )}

        {districts.length > 0 && (
          <div className={styles.field}>
            <label htmlFor="district">District</label>
            <select id="district" name="district" value={form.district} onChange={handleChange}>
              <option value="">Select district</option>
              {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.btn} disabled={loading}>
          {loading ? 'Creating account…' : 'Create account →'}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to="/login">Sign In</Link>
      </p>
    </>
  );
}

// ── Step 2: OTP verification ──────────────────────────────────────────────────
function OtpStep({ phone, name, token, user, devMode, onVerified }) {
  const [otp, setOtp]           = useState(['', '', '', '', '', '']);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [countdown, setCountdown] = useState(30); // resend cooldown seconds
  const inputs = useRef([]);

  // Countdown timer for resend button
  const startCountdown = () => {
    setCountdown(30);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleKey = (i, e) => {
    const val = e.target.value.replace(/\D/, '');
    if (!val) {
      const next = [...otp]; next[i] = '';
      setOtp(next);
      if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    const next = [...otp]; next[i] = val.slice(-1);
    setOtp(next);
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/api/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      onVerified({ token, user: { ...user, isVerified: true } });
    } catch { setError('Verification failed. Try again.'); }
    finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true); setResendMsg(''); setError('');
    try {
      const res = await fetch(`${API}/api/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      setResendMsg(data.message || 'OTP resent');
      startCountdown();
    } catch { setResendMsg('Failed to resend. Try again.'); }
    finally { setResending(false); }
  };

  return (
    <>
      <div className={styles.otpIcon}>🔐</div>
      <h2 className={styles.title}>Verify your phone</h2>
      <p className={styles.subtitle}>
        OTP sent to <strong>{phone.replace(/(\+\d{1,3})(\d{2})(\d+)(\d{4})/, '$1 $2XXXX$4')}</strong>
        {devMode && (
          <><br /><span className={styles.otpHint}>⚠️ Dev mode — OTP printed to server console</span></>
        )}
        <br /><span className={styles.otpHint}>⏱ OTP expires in 5 minutes</span>
      </p>

      <form onSubmit={handleVerify} className={styles.form}>
        <div className={styles.otpBoxes} onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => inputs.current[i] = el}
              className={styles.otpBox}
              type="text" inputMode="numeric" maxLength={1}
              value={d}
              onChange={e => handleKey(i, e)}
              onKeyDown={e => { if (e.key === 'Backspace' && !d && i > 0) inputs.current[i-1]?.focus(); }}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {error   && <p className={styles.error}>{error}</p>}
        {resendMsg && <p className={styles.resendMsg}>{resendMsg}</p>}

        <button type="submit" className={styles.btn} disabled={loading || otp.join('').length < 6}>
          {loading ? 'Verifying…' : '✅ Verify & Continue'}
        </button>

        {/* Resend OTP */}
        <button
          type="button"
          className={styles.resendBtn}
          onClick={handleResend}
          disabled={countdown > 0 || resending}
        >
          {resending
            ? 'Resending…'
            : countdown > 0
              ? `Resend OTP (${countdown}s)`
              : 'Resend OTP'}
        </button>

        <button type="button" className={styles.skipBtn} onClick={() => onVerified({ token, user })}>
          Skip for now
        </button>
      </form>
    </>
  );
}

// ── Step 3: Welcome screen ────────────────────────────────────────────────────
function WelcomeStep({ name }) {
  return (
    <div className={styles.welcomeWrap}>
      <div className={styles.welcomeHeart}>❤️</div>
      <h2 className={styles.welcomeTitle}>
        {`Welcome, ${name.split(' ')[0]}!`}
      </h2>
      <p className={styles.welcomeSub}>
        Your account is ready. You can now request blood or help others by responding to emergency broadcasts near you.
      </p>
      <div className={styles.welcomeLoader}>
        <span /><span /><span />
      </div>
      <p className={styles.welcomeRedirect}>Taking you to your dashboard…</p>
    </div>
  );
}

// ── Main Signup page ──────────────────────────────────────────────────────────
export default function Signup() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();
  const [step, setStep]       = useState('form');
  const [session, setSession] = useState(null);

  const handleSignupSuccess = (data) => {
    setSession(data);
    setStep('otp');
  };

  const handleVerified = ({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setSession(s => ({ ...s, token, user }));
    setStep('welcome');
    setTimeout(() => navigate('/dashboard'), 2400);
  };

  return (
    <div className={styles.page}>
      {/* Theme + language toggles */}
      <div style={{ position:'fixed', top:'1rem', right:'1rem', display:'flex', gap:'0.5rem', zIndex:10 }}>
        <button
          onClick={toggleLang}
          title={lang === 'en' ? 'Switch to Tamil' : 'Switch to English'}
          style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:8,
            padding:'0.35rem 0.55rem', cursor:'pointer', fontSize:'0.78rem',
            fontWeight:700, color:'var(--text)', lineHeight:1 }}
        >
          {lang === 'en' ? 'தமிழ்' : 'EN'}
        </button>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:8,
            padding:'0.35rem 0.55rem', fontSize:'1.1rem', cursor:'pointer', lineHeight:1 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.logo}>
          <BrandLogo size={72} pulse />
          <h1 className={styles.brand}>LifeLink</h1>
          <p className={styles.tagline}>Dynamic Real-Time Emergency Network</p>
        </div>

        {step === 'form'    && <SignupForm onSuccess={handleSignupSuccess} />}
        {step === 'otp'     && (
          <OtpStep
            phone={session.phone}
            name={session.name}
            token={session.token}
            user={session.user}
            devMode={session.devMode}
            onVerified={handleVerified}
          />
        )}
        {step === 'welcome' && <WelcomeStep name={session.name} />}
      </div>
    </div>
  );
}
