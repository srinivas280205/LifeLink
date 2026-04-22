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
  const { lang, toggle: toggleLang, t } = useLanguage();

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
          title={lang === 'en' ? t('switchToTamil') : t('switchToEnglish')}
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
          <p className={styles.tagline}>{t('tagline')}</p>
        </div>

        <h2 className={styles.title}>{t('welcomeBack')}</h2>
        <p className={styles.subtitle}>{t('signInAccount')}</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Phone with country code */}
          <div className={styles.field}>
            <label>{t('phone')}</label>
            <PhoneInput value={phone} onChange={setPhone} required />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label htmlFor="password">{t('password')}</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder={t('passwordPlaceholder')}
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              required
              autoComplete="current-password"
            />
          </div>

          <p style={{ textAlign: 'right', fontSize: '0.82rem', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            <Link to="/forgot-password" style={{ color: '#d32f2f', textDecoration: 'none', fontWeight: 600 }}>
              {t('forgotPassword')}
            </Link>
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? t('signingIn') : t('login')}
          </button>
        </form>

        <p className={styles.switch}>
          {t('noAccount')}{' '}
          <Link to="/signup">{t('createOne')}</Link>
        </p>
      </div>
    </div>
  );
}
