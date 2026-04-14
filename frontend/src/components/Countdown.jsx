import { useState, useEffect } from 'react';
import styles from './Countdown.module.css';

function getRemaining(expiresAt) {
  if (!expiresAt) return null;
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return { expired: true, label: 'Expired', pct: 0, urgency: 'dead' };
  const totalSecs = Math.floor(diff / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  let label, urgency;
  if (h > 0) { label = `${h}h ${m}m`; urgency = h < 2 ? 'warn' : 'ok'; }
  else if (m > 0) { label = `${m}m ${s}s`; urgency = m < 10 ? 'critical' : 'warn'; }
  else { label = `${s}s`; urgency = 'critical'; }
  return { expired: false, label, pct: Math.min(100, (diff / (48 * 3600 * 1000)) * 100), urgency };
}

export default function Countdown({ expiresAt }) {
  const [rem, setRem] = useState(() => getRemaining(expiresAt));
  useEffect(() => {
    const t = setInterval(() => setRem(getRemaining(expiresAt)), 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!rem) return null;
  return (
    <span className={`${styles.pill} ${styles[rem.urgency]}`}>
      ⏳ {rem.label}
    </span>
  );
}
