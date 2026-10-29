import { displayError } from './api';
import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { useState } from 'react';
import LocationPicker from './LazyLocationPicker';
import { coordinationApi, deviceLocation } from './api';
import styles from './Coordination.module.css';
const GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'A1+', 'A1-', 'A2+', 'A2-', 'A1B+', 'A1B-', 'A2B+', 'A2B-', 'Bombay (hh)', 'Oh+', 'Oh-'];
export default function RequestForm({
  onCreated,
  onClose
}) {
  useLanguage();
  const [form, setForm] = useState({
    bloodGroup: '',
    hospital: '',
    district: '',
    urgency: 'normal',
    candidateTarget: 1,
    units: 1,
    message: ''
  });
  const [location, setLocation] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  function field(name, value) {
    setForm(previous => ({
      ...previous,
      [name]: value
    }));
    if (name === 'hospital') setConfirmed(false);
  }
  function choose(point) {
    setLocation(point);
    setConfirmed(false);
  }
  async function locate() {
    setLocating(true);
    setError('');
    try {
      const fix = await deviceLocation();
      choose({
        lat: fix.lat,
        lng: fix.lng
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    if (!location || !confirmed) {
      setError('Choose and confirm the hospital location first.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const created = await coordinationApi('', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          candidateTarget: Number(form.candidateTarget),
          units: Number(form.units),
          hospitalLocation: location
        })
      });
      onCreated(created);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className={styles.card}>
    <div className={styles.row}><h3>{tr("Request blood")}</h3><button type="button" onClick={onClose} disabled={busy}>{tr("Close form")}</button></div>
    <fieldset disabled={busy || locating} className={styles.fields}>
      <div className={styles.grid}>
        <label>{tr("Blood group")}<select aria-label={tr("Blood group")} required value={form.bloodGroup} onChange={e => field('bloodGroup', e.target.value)}><option value="">{tr("Choose group")}</option>{GROUPS.map(group => <option key={group}>{group}</option>)}</select></label>
        <label>{tr("Urgency")}<select aria-label={tr("Urgency")} value={tr(form.urgency)} onChange={e => field('urgency', e.target.value)}><option value="normal">{tr("Normal")}</option><option value="urgent">{tr("Urgent")}</option><option value="critical">{tr("Critical")}</option></select></label>
        <label>{tr("Hospital name")}<input required maxLength={200} value={form.hospital} onChange={e => field('hospital', e.target.value)} /></label>
        <label>{tr("District")}<input required maxLength={100} value={form.district} onChange={e => field('district', e.target.value)} /></label>
        <label>{tr("Donors needed")}<input required type="number" min="1" max="10" step="1" value={form.candidateTarget} onChange={e => field('candidateTarget', e.target.value)} /></label>
        <label>{tr("Blood units requested")}<input required type="number" min="1" max="10" step="1" value={form.units} onChange={e => field('units', e.target.value)} /></label>
      </div>
      <p className={styles.hint}>{tr("Donors needed is the number of people to coordinate. It is separate from blood units.")}</p>
      <h4>{tr("Hospital location")}</h4>
      <button type="button" onClick={locate}>{locating ? tr('Finding location…') : tr('I am at the hospital — use my location')}</button>
      <LocationPicker value={location} onChange={choose} label={tr("hospital")} />
      <label className={styles.check}><input type="checkbox" checked={confirmed} disabled={!location} onChange={e => setConfirmed(e.target.checked)} />{tr("I confirm this pin is the hospital where donors should go.")}</label>
      <label>{tr("Message (optional)")}<textarea maxLength={300} value={form.message} onChange={e => field('message', e.target.value)} placeholder={tr("Where to report at the hospital")} /></label>
      <p className={styles.hint}>{tr("Search starts around the hospital. Your phone number is shared only with selected donors. The hospital decides donation eligibility.")}</p>
    </fieldset>
    {error && <p className={styles.error} role="alert">{displayError(error)}</p>}
    <button className={styles.primary} disabled={busy || locating || !confirmed}>{busy ? tr('Creating request…') : tr('Find donors')}</button>
  </form>;
}
