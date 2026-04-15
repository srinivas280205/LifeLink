import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import styles from './Notifications.module.css';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const TYPE_META = {
  new_broadcast:    { icon: '🩸', label: 'Blood Request', color: '#d32f2f' },
  donor_responded:  { icon: '✅', label: 'Donor Responded', color: '#388e3c' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    fetch(`${API}/api/notifications`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => {
        setNotifications(d.notifications || []);
        setUnread(d.unreadCount || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [navigate]);

  const markAllRead = async () => {
    await fetch(`${API}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token()}` },
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const grouped = notifications.reduce((acc, n) => {
    const key = new Date(n.createdAt).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(n);
    return acc;
  }, {});

  return (
    <AppShell connected={true}>
      <div className={styles.page}>
        <div className={styles.inner}>

          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>🔔 Notifications</h1>
              <p className={styles.sub}>Your activity alerts and blood request updates</p>
            </div>
            {unread > 0 && (
              <button className={styles.markAllBtn} onClick={markAllRead}>
                ✓ Mark all read ({unread})
              </button>
            )}
          </div>

          {loading && (
            <div className={styles.loading}><div className={styles.spinner} /></div>
          )}

          {!loading && notifications.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🔔</span>
              <p>No notifications yet</p>
              <p className={styles.emptySub}>You'll be notified when blood requests match your type or someone responds to your request.</p>
            </div>
          )}

          {!loading && Object.entries(grouped).map(([day, items]) => (
            <div key={day} className={styles.group}>
              <p className={styles.groupLabel}>{day}</p>
              {items.map((n, i) => {
                const meta = TYPE_META[n.type] || { icon: '📢', label: 'Update', color: '#666' };
                return (
                  <div
                    key={n._id || i}
                    className={`${styles.notifCard} ${!n.read ? styles.unread : ''}`}
                    onClick={() => navigate('/dashboard')}
                  >
                    <div className={styles.iconWrap} style={{ background: `${meta.color}18` }}>
                      <span>{meta.icon}</span>
                    </div>
                    <div className={styles.body}>
                      <div className={styles.topRow}>
                        <span className={styles.notifTitle}>{n.title}</span>
                        <span className={styles.time}>{timeAgo(n.createdAt)}</span>
                      </div>
                      <p className={styles.notifBody}>{n.body}</p>
                      <span className={styles.typePill} style={{ color: meta.color, background: `${meta.color}12` }}>
                        {meta.label}
                      </span>
                    </div>
                    {!n.read && <span className={styles.unreadDot} />}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
