import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './OnboardingBanner.module.css';

export default function OnboardingBanner() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const [dismissed, setDismiss] = useState(
    () => !!localStorage.getItem('onboarding_dismissed')
  );

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const token = localStorage.getItem('token');

  // Only show when logged in, blood group missing, not on profile page
  if (!token || user.bloodGroup || dismissed) return null;
  if (location.pathname === '/profile') return null;

  const handleDismiss = () => {
    localStorage.setItem('onboarding_dismissed', '1');
    setDismiss(true);
  };

  return (
    <div className={styles.banner}>
      <span className={styles.icon}>🩸</span>
      <div className={styles.text}>
        <strong>Complete your profile</strong>
        <span>Set your blood group so donors can find you and you can receive matching alerts</span>
      </div>
      <button className={styles.actionBtn} onClick={() => navigate('/profile')}>
        Set Now
      </button>
      <button className={styles.dismissBtn} onClick={handleDismiss} title="Dismiss">✕</button>
    </div>
  );
}
