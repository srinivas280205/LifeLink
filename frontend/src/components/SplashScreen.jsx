import { useEffect, useState } from 'react';
import styles from './SplashScreen.module.css';

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState('enter'); // enter → pulse → exit

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('pulse'), 400);
    const t2 = setTimeout(() => setPhase('exit'), 2600);
    const t3 = setTimeout(() => onDone(), 3200);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);

  return (
    <div className={`${styles.splash} ${phase === 'exit' ? styles.exit : ''}`}>
      <div className={`${styles.content} ${phase !== 'enter' ? styles.visible : ''}`}>

        {/* Outer pulse rings */}
        <div className={styles.rings}>
          <span /><span /><span /><span />
        </div>

        {/* Beating heart */}
        <div className={styles.heartWrap}>
          <svg className={styles.heart} viewBox="0 0 100 92" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="hg" cx="50%" cy="40%" r="55%">
                <stop offset="0%"   stopColor="#ff4444" />
                <stop offset="55%"  stopColor="#c62828" />
                <stop offset="100%" stopColor="#7f0000" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            <path
              className={styles.heartPath}
              d="M50,82 C50,82 8,55 8,28 C8,14 18,4 32,4 C40,4 46,9 50,16 C54,9 60,4 68,4 C82,4 92,14 92,28 C92,55 50,82 50,82Z"
              fill="url(#hg)"
              filter="url(#glow)"
            />
            <polyline
              className={styles.ecgInner}
              points="20,44 28,44 34,44 38,30 42,58 46,44 52,44 58,44 62,34 66,54 70,44 78,44"
              fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>

          {/* Blood drop */}
          <div className={styles.dropWrap}>
            <svg className={styles.drop} viewBox="0 0 20 28" xmlns="http://www.w3.org/2000/svg">
              <path d="M10,2 C10,2 2,12 2,18 C2,23 5.5,26 10,26 C14.5,26 18,23 18,18 C18,12 10,2 10,2Z"
                fill="#ef5350" opacity="0.9"/>
            </svg>
          </div>
        </div>

        {/* Brand */}
        <div className={styles.brand}>
          <span className={styles.life}>Life</span><span className={styles.link}>Link</span>
        </div>
        <p className={styles.tagline}>India's Emergency Blood Network</p>

        {/* Bottom ECG bar */}
        <div className={styles.ecgWrap}>
          <svg viewBox="0 0 240 36" className={styles.ecg} preserveAspectRatio="none">
            <polyline
              className={styles.ecgLine}
              points="0,18 25,18 38,18 46,3 54,33 62,18 80,18 110,18 124,18 132,6 140,30 148,18 170,18 200,18 214,18 222,8 230,28 238,18 240,18"
            />
          </svg>
        </div>

        <p className={styles.sub}>Real-Time · Emergency · Life Saving</p>
      </div>
    </div>
  );
}
