import { useState, useEffect } from 'react';
import styles from './OfflineBanner.module.css';

export default function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);
  const [show, setShow] = useState(!navigator.onLine);
  const [justReconnected, setJustReconnected] = useState(false);

  useEffect(() => {
    const goOffline = () => { setOnline(false); setShow(true); setJustReconnected(false); };
    const goOnline  = () => {
      setOnline(true);
      setJustReconnected(true);
      setTimeout(() => { setShow(false); setJustReconnected(false); }, 2500);
    };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`${styles.banner} ${online ? styles.back : styles.offline}`}>
      {online
        ? <><span className={styles.dot} />Back online — syncing…</>
        : <><span className={styles.spinner} />No internet connection</>}
    </div>
  );
}
