import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatDate, labels } from './api';
import styles from './Coordination.module.css';
import CoordinationIcon from './CoordinationIcon';
import { StageStepper, RadiusIndicator, StatusChip } from './ProgressVisuals';
const SearchAreaMap = lazy(() => import('./SearchAreaMap'));
export default function RequestProgress({
  request,
  busy,
  onAction
}) {
  useLanguage();
  const [consent, setConsent] = useState(false);
  const [completed, setCompleted] = useState([]);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [time, setTime] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const active = request.status === 'active' && new Date(request.coordinationDeadline).getTime() > time;
  const selected = request.donors.filter(donor => donor.state === 'selected');
  const actualDonors = completed.filter(id => selected.some(donor => donor.donorId === id));
  const mine = request.donors[0];
  const status = request.status !== 'active' ? tr(labels[request.status]) : !active ? tr('Deadline reached — search ending') : tr(labels[request.searchStatus]);
  return <article className={styles.card} aria-label={tr("Request progress")}>
    <div className={`${styles.row} ${styles.requestHeading}`}><span className={styles.blood}>{request.bloodGroup}</span><h3>{request.hospital}</h3><span className={styles.badge} data-urgency={request.urgency}>{tr(request.urgency)}</span></div>
    <p>{request.district} · {request.candidateTarget} {' '} {tr("donor(s) needed \xB7")}{request.units} {' '} {tr("unit(s)")}</p>
    <p className={styles.status} role="status">{status}</p>
    <p className={styles.hint}>{tr("Deadline:")}{formatDate(request.coordinationDeadline)}</p>
    {request.message && <p>{request.message}</p>}
    {request.owner ? <>
      <StageStepper request={request} />
      <RadiusIndicator request={request} active={active} time={time} />
      <div className={styles.metrics}>
        <div><strong>{request.radiusKm} {' '} {tr("km")}</strong><span>{active ? tr('Current radius') : tr('Last search radius')}</span></div>
        <div><strong>{request.counts.alerted}</strong><span>{tr("Invitations saved")}</span></div>
        <div><strong>{request.counts.willing}</strong><span>{tr("Willing")}</span></div>
        <div><strong>{request.status === 'fulfilled' ? request.counts.completed : `${request.counts.selected}/${request.candidateTarget}`}</strong><span>{request.status === 'fulfilled' ? tr('Recorded donations') : tr('Selected')}</span></div>
      </div>
      <p className={styles.hint}>{tr("An invitation does not mean the donor has seen it. Willing donors still need your selection.")}</p>
      {active && <div className={styles.row}>
        {['searching', 'paused_target'].includes(request.searchStatus) && <button disabled={busy} onClick={() => onAction('pause')}>{tr("Pause search")}</button>}
        {['paused_manual', 'exhausted'].includes(request.searchStatus) && request.counts.selected < request.candidateTarget && <button disabled={busy} onClick={() => onAction('resume')}>{tr("Resume search")}</button>}
        <button className={styles.danger} disabled={busy} onClick={() => setConfirmCancel(true)}>{tr("Cancel request")}</button>
      </div>}
      {active && confirmCancel && <div className={styles.notice}>
        <p>{tr("Cancel this request? Alerts will stop and selected donors will be released.")}</p>
        <div className={styles.row}><button className={styles.danger} disabled={busy} onClick={() => onAction('cancel')}>{tr("Yes, cancel request")}</button><button disabled={busy} onClick={() => setConfirmCancel(false)}>{tr("Keep request")}</button></div>
      </div>}
      {request.searchStatus === 'exhausted' && active && <div className={styles.notice}>
        <p>{tr("No more eligible, unalerted donors were found within 50 km. You can still select willing donors.")}</p>
        <Link to="/search?tab=banks">{tr("Open blood-bank directory")}</Link>
      </div>}
      <h4>{tr("Donor responses")}</h4>
      {!request.donors.length && <p className={styles.hint}>{tr("No invitations yet. The search will start automatically.")}</p>}
      <ul className={styles.donors}>{request.donors.map((donor, index) => <li key={donor.donorId || index} data-state={donor.state}>
        <div><strong>{donor.name}</strong><div><StatusChip state={donor.state} />{!active && donor.state !== 'completed' ? tr(' · request ended') : ''}</div>
          <small>{donor.approximateDistanceKm === 0 ? tr('Less than 1 km') : tr(`About ${donor.approximateDistanceKm} km`)} {' '} {tr("from hospital \xB7")}{donor.locationSource === 'manual' ? tr('self-reported') : tr('device location')}{donor.locationStale ? tr(' · location is old') : ''}</small>
          {active && donor.phone && <p><a href={`tel:${donor.phone}`}>{tr("Call")}{donor.phone}</a></p>}
          {active && !donor.phone && ['notified', 'willing', 'no_response'].includes(donor.state) && <p className={styles.privacyNote}><CoordinationIcon name="lock" />{tr("Phone shown only after selection")}</p>}
        </div>
        {active && donor.state === 'willing' && donor.donorId && request.counts.selected < request.candidateTarget && <button className={styles.primary} disabled={busy} onClick={() => onAction('select', {
            donorId: donor.donorId
          })}>{tr("Select")}</button>}
      </li>)}</ul>
      {active && selected.length > 0 && <fieldset className={styles.completion} disabled={busy}>
        <legend>{tr("Record completed donations")}</legend>
        <p className={styles.hint}>{tr("Only tick people who actually donated. This closes the request and releases all remaining donors.")}</p>
        {selected.map(donor => <label className={styles.check} key={donor.donorId}><input type="checkbox" checked={actualDonors.includes(donor.donorId)} onChange={event => setCompleted(previous => event.target.checked ? [...previous, donor.donorId] : previous.filter(id => id !== donor.donorId))} />{donor.name} {' '} {tr("actually donated")}</label>)}
        <button className={styles.success} disabled={busy || actualDonors.length === 0} onClick={() => onAction('complete', {
          donors: actualDonors
        })}>{tr("Complete request")}</button>
      </fieldset>}
      <details className={styles.timeline}><summary>{tr("Search timeline (")}{request.timeline.length})</summary>
        <ol>{request.timeline.map(item => <li key={item._id}><time>{formatDate(item.createdAt)}</time><span className={styles.timelineRadius}>{item.radiusKm} {' '} {tr("km")}</span><p>{tr(item.reason)}</p></li>)}</ol>
      </details>
      {request.hospitalLocation && <details onToggle={event => setMapOpen(event.currentTarget.open)}>
        <summary>{tr("Hospital search area")}</summary><p className={styles.hint}>{tr("The circle shows the search radius. Only the hospital pin is shown.")}</p>
        {mapOpen && <Suspense fallback={<p>{tr("Loading search map\u2026")}</p>}><SearchAreaMap lat={request.hospitalLocation.lat} lng={request.hospitalLocation.lng} radiusKm={request.radiusKm} /></Suspense>}
      </details>}
    </> : <>
      <p className={styles.status}>{tr("Your response:")} {' '} {tr(labels[mine?.state])}</p>
      {active && ['notified', 'no_response'].includes(mine?.state) && <>
        <label className={styles.check}><input type="checkbox" checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} />{tr("I agree to share my phone number with the requester if selected.")}</label>
        <div className={styles.row}><button className={styles.primary} disabled={busy || !consent} onClick={() => onAction('willing')}>{tr("I can help")}</button><button disabled={busy} onClick={() => onAction('declined')}>{tr("Unavailable")}</button></div>
      </>}
      {active && mine?.state === 'willing' && <p className={styles.hint}>{tr("Waiting for the requester to select you. Offering help does not count as a completed donation.")}</p>}
      {active && request.requesterPhone && <div className={styles.notice}><p>{tr("You have been selected. Contact the requester to arrange your visit.")}</p><a href={`tel:${request.requesterPhone}`}>{tr("Call requester:")}{request.requesterPhone}</a></div>}
      <StatusChip state={mine?.state} />
      {active && ['willing', 'selected'].includes(mine?.state) && <button className={styles.danger} disabled={busy} onClick={() => onAction('withdraw')}>{tr("Withdraw")}</button>}
      {request.hospitalLocation && <p><a target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${request.hospitalLocation.lat}&mlon=${request.hospitalLocation.lng}#map=16/${request.hospitalLocation.lat}/${request.hospitalLocation.lng}`}>{tr("View hospital location")}</a></p>}
      <p className={styles.hint}>{tr("The hospital confirms eligibility and blood compatibility before donation.")}</p>
    </>}
  </article>;
}
