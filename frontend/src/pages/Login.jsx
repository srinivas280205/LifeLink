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
      {/* Theme toggle — top right */}
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        style={{ position:'fixed', top:'1rem', right:'1rem', background:'var(--card-bg)',
          border:'1px solid var(--border)', borderRadius:8, padding:'0.35rem 0.55rem',
          fontSize:'1.1rem', cursor:'pointer', lineHeight:1, zIndex:10 }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      {/* Language toggle — top left */}
      <div
        onClick={toggleLang}
        role="button" tabIndex={0}
        aria-label="Change language"
        onKeyDown={e => e.key === 'Enter' && toggleLang()}
        style={{ position:'fixed', top:'1rem', left:'1rem', display:'flex', flexDirection:'column',
          alignItems:'center', gap:'2px', cursor:'pointer', zIndex:10 }}
      >
        <span style={{ fontSize:'0.58rem', color:'var(--muted)', fontWeight:600,
          letterSpacing:'0.4px', textTransform:'uppercase' }}>Change Language</span>
        <span style={{ background:'var(--card-bg)', border:'1px solid var(--border)',
          borderRadius:14, padding:'0.2rem 0.75rem', fontSize:'0.8rem', fontWeight:800,
          color:'var(--text)', display:'flex', alignItems:'center', gap:'0.3rem' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'#4caf50',
            display:'inline-block', boxShadow:'0 0 5px #4caf50' }} />
          {lang === 'en' ? 'English' : 'தமிழ்'}
        </span>
      </div>

      <div className={styles.card}>
        <div className={styles.logo}>
          <BrandLogo size={72} pulse />
          <h1 className={styles.brand}>LifeLink</h1>
          <p className={styles.tagline}>Dynamic Real-Time Emergency Network</p>
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
