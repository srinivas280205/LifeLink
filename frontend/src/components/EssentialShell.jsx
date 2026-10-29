import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { translate as tr } from '../i18n/coordination';
import styles from '../pages/Essential.module.css';
export default function EssentialShell({ children }) {
  const { lang, toggle } = useLanguage();
  const { theme, toggle: toggleTheme } = useTheme();
  const location = useLocation();
  const donor = new URLSearchParams(location.search).get('view') === 'donor';
  return <><header className={styles.header}><div className={styles.top}>
    <Link className={styles.brand} to="/dashboard">♥ LifeLink</Link>
    <div className={styles.tools}><button onClick={toggle} aria-label={lang === 'en' ? 'Switch to Tamil' : 'ஆங்கிலத்திற்கு மாற்று'}>{lang === 'en' ? 'தமிழ்' : 'English'}</button>
      <Link to="/profile">{tr('Settings')}</Link><button onClick={toggleTheme} aria-label={tr(theme === 'light' ? 'Dark mode' : 'Light mode')}>{theme === 'light' ? '☾' : '☀'}</button></div>
    </div><nav className={styles.nav} aria-label={tr('Main navigation')}>
      <Link to="/dashboard" aria-current={location.pathname === '/dashboard' && !donor ? 'page' : undefined}>{tr('Need blood')}</Link>
      <Link to="/dashboard?view=donor" aria-current={location.pathname === '/dashboard' && donor ? 'page' : undefined}>{tr('I can donate')}</Link>
      <Link to="/history" aria-current={location.pathname === '/history' ? 'page' : undefined}>{tr('My requests')}</Link>
    </nav></header><main id="main-content">{children}</main></>;
}
