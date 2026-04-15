import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import styles from './AppShell.module.css';
import BrandLogo from './BrandLogo';
import OnboardingBanner from './OnboardingBanner';

const API = '';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AppShell({ children, connected, socket }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, t } = useLanguage();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || user._id || '';

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [available, setAvailable] = useState(user.isAvailable !== false);
  const [togglingAvail, setTogglingAvail] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // PWA install prompt
  useEffect(() => {
    if (localStorage.getItem('pwa_install_dismissed')) return;
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    localStorage.setItem('pwa_install_dismissed', '1');
  };

  // Listen for real-time notifications
  useEffect(() => {
    if (!socket) return;
    const handler = ({ userId: notifUserId, notification }) => {
      if (notifUserId !== userId) return;
      setNotifications((prev) => [{ ...notification, _id: Date.now() }, ...prev]);
      setUnread((n) => n + 1);
    };
    socket.on('new_notification', handler);
    return () => socket.off('new_notification', handler);
  }, [socket, userId]);

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API}/api/notifications/read-all`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* ignore */ }
  };

  const toggleAvailability = async () => {
    const token = localStorage.getItem('token');
    if (!token || togglingAvail) return;
    setTogglingAvail(true);
    const next = !available;
    setAvailable(next);
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (res.ok) {
        const data = await res.json();
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, isAvailable: next }));
        // sync with returned user if available
        if (data.user) localStorage.setItem('user', JSON.stringify({ ...stored, ...data.user }));
      } else {
        setAvailable(!next); // revert on error
      }
    } catch {
      setAvailable(!next);
    }
    setTogglingAvail(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const tabs = [
    { path: '/dashboard',   icon: '📡', label: t('liveFeed')  },
    { path: '/map',         icon: '🗺️', label: t('donorMap')  },
    { path: '/search',      icon: '🔍', label: t('search')    },
    { path: '/leaderboard', icon: '🏆', label: t('leaders')   },
    { path: '/events',      icon: '🩸', label: t('events')    },
    { path: '/history',     icon: '📋', label: t('history')   },
    { path: '/profile',     icon: '👤', label: t('profile')   },
    ...(user.isAdmin ? [{ path: '/admin', icon: '🛡️', label: t('admin') }] : []),
  ];

  return (
    <div className={styles.shell}>
      {/* PWA install banner */}
      {showInstallBanner && (
        <div className={styles.installBanner}>
          <span className={styles.installIcon}>📲</span>
          <div className={styles.installText}>
            <strong>{t('installApp')}</strong>
            <span>{t('installHint')}</span>
          </div>
          <button className={styles.installBtn} onClick={handleInstall}>{t('install')}</button>
          <button className={styles.installClose} onClick={dismissInstall}>✕</button>
        </div>
      )}

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand} onClick={() => navigate('/dashboard')} style={{ cursor: 'pointer' }}>
            <BrandLogo size={32} />
            <span className={styles.brandName}>LifeLink</span>
          </div>

          <div className={styles.headerMeta}>
            <span className={connected ? styles.dotOn : styles.dotOff} />
            <span className={styles.connLabel}>{connected ? t('live') : t('connecting')}</span>
          </div>

          <div className={styles.headerRight}>
            {/* Availability toggle */}
            {user.bloodGroup && (
              <button
                className={`${styles.availBtn} ${available ? styles.availOn : styles.availOff}`}
                onClick={toggleAvailability}
                disabled={togglingAvail}
                title={available ? 'You are available to donate — click to go offline' : 'You are unavailable — click to go available'}
              >
                <span className={available ? styles.availDotOn : styles.availDotOff} />
                {available ? t('available') : t('offline')}
              </button>
            )}

            {/* Notification bell */}
            <button
              className={styles.bellBtn}
              onClick={() => { setNotifOpen((o) => !o); if (!notifOpen && unread > 0) markAllRead(); }}
              title="Notifications"
              aria-label={unread > 0 ? `${unread} unread notifications` : 'Notifications'}
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
            >
              🔔
              {unread > 0 && <span className={styles.badge} aria-hidden="true">{unread > 9 ? '9+' : unread}</span>}
            </button>

            {/* Language toggle — shows current language name */}
            <div className={styles.langWrap} onClick={toggleLang} role="button" tabIndex={0}
              aria-label="Change language"
              onKeyDown={e => e.key === 'Enter' && toggleLang()}>
              <span className={styles.langLabel}>Change Language</span>
              <span className={styles.langBtn}>
                <span className={styles.langDot} />
                {lang === 'en' ? 'English' : 'தமிழ்'}
              </span>
            </div>

            <button className={styles.themeBtn} onClick={toggle} title="Toggle theme"
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <div className={styles.userPill}>
              <span className={styles.userBlood}>{user.bloodGroup || '👤'}</span>
              <span className={styles.userName}>{user.fullName?.split(' ')[0]}</span>
            </div>
            <button className={styles.logoutBtn} onClick={handleLogout} aria-label="Log out of LifeLink">{t('logout')}</button>
          </div>
        </div>

        {/* Nav tabs */}
        <nav className={styles.tabs} aria-label="Main navigation">
          {tabs.map(tab => (
            <button
              key={tab.path}
              className={`${styles.tab} ${location.pathname === tab.path ? styles.tabActive : ''}`}
              onClick={() => navigate(tab.path)}
              aria-label={tab.label}
              aria-current={location.pathname === tab.path ? 'page' : undefined}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </header>

      {/* Notification drawer */}
      {notifOpen && (
        <div className={styles.notifOverlay} onClick={() => setNotifOpen(false)} role="presentation">
          <div className={styles.notifDrawer} onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="Notifications">
            <div className={styles.notifHeader}>
              <span className={styles.notifTitle}>{t('notifications')}</span>
              {notifications.some((n) => !n.read) && (
                <button className={styles.markReadBtn} onClick={markAllRead}>{t('markAllRead')}</button>
              )}
              <button
                className={styles.markReadBtn}
                style={{ borderColor: '#1976d2', color: '#1976d2' }}
                onClick={() => { setNotifOpen(false); navigate('/notifications'); }}
              >{t('viewAll')}</button>
              <button className={styles.notifClose} onClick={() => setNotifOpen(false)}>✕</button>
            </div>

            <div className={styles.notifList}>
              {notifications.length === 0 ? (
                <div className={styles.notifEmpty}>
                  <span>🔔</span>
                  <p>{t('noNotifications')}</p>
                  <small>{t('notifHint')}</small>
                </div>
              ) : (
                notifications.map((n, i) => (
                  <div
                    key={n._id || i}
                    className={`${styles.notifItem} ${!n.read ? styles.notifUnread : ''}`}
                    onClick={() => { setNotifOpen(false); navigate('/dashboard'); }}
                  >
                    <div className={styles.notifIcon}>
                      {n.type === 'new_broadcast' ? '🩸' : '✅'}
                    </div>
                    <div className={styles.notifBody}>
                      <div className={styles.notifItemTitle}>{n.title}</div>
                      <div className={styles.notifItemBody}>{n.body}</div>
                      <div className={styles.notifTime}>{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <span className={styles.unreadDot} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Onboarding nudge */}
      <OnboardingBanner />

      {/* Page content */}
      <main className={styles.content} id="main-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
