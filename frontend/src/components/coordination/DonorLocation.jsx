import { displayError } from './api';
import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { useEffect, useState } from 'react';
import LocationPicker from './LazyLocationPicker';
import { coordinationApi, deviceLocation, formatDate } from './api';
import styles from './Coordination.module.css';
export default function DonorLocation() {
  useLanguage();
  const [saved, setSaved] = useState(null);
  const [manual, setManual] = useState(false);
  const [point, setPoint] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    coordinationApi('/location', {
      signal: controller.signal
    }).then(setSaved).catch(err => {
      if (err.name !== 'AbortError') setError(err.message);
    });
    return () => controller.abort();
  }, []);
  async function save(useDevice) {
    setBusy(true);
    setError('');
    try {
      const location = useDevice ? await deviceLocation() : {
        ...point,
        source: 'manual'
      };
      const result = await coordinationApi('/location', {
        method: 'PATCH',
        body: JSON.stringify(location)
      });
      setSaved(result);
      setManual(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return <details className={styles.card}>
    <summary>{tr("My donor location")}{saved && (saved.eligibleLocation ? tr('· ready for matching') : tr('· update needed'))}</summary>
    <p className={styles.hint}>{tr("Share your location to receive nearby requests. Exact coordinates stay private. This does not track you in the background. Set your blood group and availability in your profile.")}</p>
    {saved && <p className={styles.hint}>{saved.location?.updatedAt ? `${saved.location.source === 'manual' ? tr('Manually confirmed') : tr('Device location')} · ${formatDate(saved.location.updatedAt)}` : tr('No recent location saved.')}
      {!saved.eligibleLocation && tr(' Update a missing, old or imprecise location before matching.')}</p>}
    {error && <p className={styles.error} role="alert">{displayError(error)}</p>}
    <div className={styles.row}>
      <button type="button" disabled={busy} onClick={() => save(true)}>{busy ? tr('Saving location…') : tr('Share current location')}</button>
      <button type="button" disabled={busy} onClick={() => setManual(value => !value)}>{tr("Choose location manually")}</button>
    </div>
    {manual && <div className={styles.manual}>
      <LocationPicker value={point} onChange={setPoint} label={tr("my location")} />
      <button type="button" disabled={!point || busy} onClick={() => save(false)}>{tr("Confirm and save my location")}</button>
    </div>}
  </details>;
}
