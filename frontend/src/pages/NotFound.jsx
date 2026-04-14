import { useNavigate } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <div className={styles.code}>404</div>
        <div className={styles.icon}>🩸</div>
        <h1 className={styles.title}>Page Not Found</h1>
        <p className={styles.sub}>The page you're looking for doesn't exist or has been moved.</p>
        <div className={styles.actions}>
          <button className={styles.primary} onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
          <button className={styles.secondary} onClick={() => navigate(-1)}>← Go Back</button>
        </div>
      </div>
    </div>
  );
}
