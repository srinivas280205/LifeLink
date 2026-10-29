import EssentialShell from '../components/EssentialShell';
import CoordinationPanel from '../components/coordination/CoordinationPanel';
import styles from './Essential.module.css';
import { useLocation } from 'react-router-dom';
export default function EssentialHome() {
  const location = useLocation();
  const mode = new URLSearchParams(location.search).get('view') || 'requests';
  return <EssentialShell><div className={styles.page}><CoordinationPanel key={`${location.pathname}:${mode}`} /></div></EssentialShell>;
}
