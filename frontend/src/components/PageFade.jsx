import styles from './PageFade.module.css';

export default function PageFade({ children }) {
  return <div className={styles.fade}>{children}</div>;
}
