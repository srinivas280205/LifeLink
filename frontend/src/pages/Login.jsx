import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PhoneInput, { toApiPhone } from '../components/PhoneInput';
import API_BASE from '../config/api.js';
const API = API_BASE;

export default function Login() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang } = useLanguage();

  const [phone, setPhone] = useState({ countryCode: '+91', number: '' });
  const [password, setPassword] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: toApiPhone(phone),   // e.g. "+919344763919"
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/home');
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Theme + language toggles — top right */}
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

        <h2 className={styles.title}>Welcome back</h2>
        <p className={styles.subtitle}>Sign in to your account</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Phone with country code */}
          <div className={styles.field}>
            <label>Phone Number</label>
            <PhoneInput value={phone} onChange={setPhone} required />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              required
              autoComplete="current-password"
            />
          </div>

          <p style={{ textAlign: 'right', fontSize: '0.82rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <Link to="/forgot-password" style={{ color: '#d32f2f', textDecoration: 'none', fontWeight: 600 }}>
              Forgot password?
            </Link>
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className={styles.switch}>
          {"Don't have an account?"}{' '}
          <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
}
