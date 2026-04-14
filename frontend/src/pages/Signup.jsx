import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import { COUNTRIES, INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';

const API = '';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ── Step 1: Registration form ────────────────────────────────────────────────
function SignupForm({ onSuccess }) {
  const [form, setForm] = useState({
    fullName: '', phone: '', password: '',
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
    try {
      const res = await fetch(`${API}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Signup failed'); return; }
      onSuccess({ token: data.token, user: data.user, phone: form.phone, name: form.fullName });
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
          <label htmlFor="phone">Phone Number</label>
          <input id="phone" name="phone" type="tel" placeholder="10-digit mobile number"
            maxLength={10} value={form.phone} onChange={handleChange} required autoComplete="tel" />
        </div>

        <div className={styles.field}>
          <label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Minimum 6 characters"
            value={form.password} onChange={handleChange} required minLength={6} autoComplete="new-password" />
        </div>

        <div className={styles.field}>
          <label htmlFor="bloodGroup">Your Blood Group <span className={styles.optionalTag}>(optional — set in profile later)</span></label>
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
          {loading ? 'Creating account…' : 'Create Account →'}
        </button>
      </form>

      <p className={styles.switch}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </>
  );
}

// ── Step 2: OTP verification ──────────────────────────────────────────────────
function OtpStep({ phone, name, token, user, onVerified }) {
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

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
    if (code.length < 6) { setError('Enter all 6 digits'); return; }
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

  return (
    <>
      <div className={styles.otpIcon}>🔐</div>
      <h2 className={styles.title}>Verify your phone</h2>
      <p className={styles.subtitle}>
        OTP sent to <strong>{phone.replace(/(\d{2})(\d{4})(\d{4})/, '$1XXXX$3')}</strong>
        <br /><span className={styles.otpHint}>(Demo: enter any 6 digits)</span>
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

        {error && <p className={styles.error}>{error}</p>}

        <button type="submit" className={styles.btn} disabled={loading || otp.join('').length < 6}>
          {loading ? 'Verifying…' : '✅ Verify & Continue'}
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
      <h2 className={styles.welcomeTitle}>Welcome, {name.split(' ')[0]}!</h2>
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
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        style={{ position:'fixed', top:'1rem', right:'1rem', background:'var(--card-bg)',
          border:'1px solid var(--border)', borderRadius:8, padding:'0.35rem 0.55rem',
          fontSize:'1.1rem', cursor:'pointer', lineHeight:1, zIndex:10 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
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
            onVerified={handleVerified}
          />
        )}
        {step === 'welcome' && <WelcomeStep name={session.name} />}
      </div>
    </div>
  );
}
