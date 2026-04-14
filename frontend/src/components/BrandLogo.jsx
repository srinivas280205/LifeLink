import styles from './BrandLogo.module.css';

/**
 * Reusable animated heartbeat logo.
 * size  — px width (height is auto-proportional)
 * pulse — show outer pulse ring (default false)
 */
export default function BrandLogo({ size = 36, pulse = false }) {
  return (
    <span className={styles.wrap} style={{ width: size, height: size }}>
      {pulse && <span className={styles.ring} />}
      <svg
        className={styles.heart}
        viewBox="0 0 100 92"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
      >
        <defs>
          <radialGradient id="blg" cx="50%" cy="38%" r="58%">
            <stop offset="0%"   stopColor="#ff5252" />
            <stop offset="55%"  stopColor="#c62828" />
            <stop offset="100%" stopColor="#7f0000" />
          </radialGradient>
          <filter id="bglow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Heart shape */}
        <path
          className={styles.heartPath}
          d="M50,82 C50,82 8,55 8,28 C8,14 18,4 32,4 C40,4 46,9 50,16 C54,9 60,4 68,4 C82,4 92,14 92,28 C92,55 50,82 50,82Z"
          fill="url(#blg)"
          filter="url(#bglow)"
        />

        {/* ECG line */}
        <polyline
          className={styles.ecg}
          points="18,44 26,44 32,44 37,30 41,58 45,44 51,44 57,44 62,34 66,54 70,44 80,44"
          fill="none"
          stroke="rgba(255,255,255,0.88)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
