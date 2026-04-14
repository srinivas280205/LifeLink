import { useEffect, useState } from 'react';
import styles from './InstallPrompt.module.css';

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Don't show if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if (localStorage.getItem('pwa_dismissed')) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setVisible(true), 3000); // show after 3s
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setInstalled(true));
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_dismissed', '1');
    setVisible(false);
  };

  if (!visible || installed) return null;

  return (
    <div className={styles.banner}>
      <div className={styles.icon}>❤️</div>
      <div className={styles.text}>
        <strong>Install LifeLink</strong>
        <span>Add to home screen for instant emergency access</span>
      </div>
      <button className={styles.installBtn} onClick={handleInstall}>Install</button>
      <button className={styles.dismissBtn} onClick={handleDismiss}>✕</button>
    </div>
  );
}
