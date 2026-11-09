import { useLanguage } from "../../context/LanguageContext";
import { translate as tr } from "../../i18n/coordination";
import CoordinationIcon from './CoordinationIcon';
import { labels } from './api';
import styles from './Coordination.module.css';
const icons = {
  notified: 'send',
  willing: 'heart',
  selected: 'person',
  completed: 'check',
  declined: 'minus',
  no_response: 'clock',
  withdrawn: 'undo'
};
export function StatusChip({
  state
}) {
  useLanguage();
  return <span className={styles.statusChip} data-state={state}><CoordinationIcon name={icons[state]} />{tr(labels[state]) || state}</span>;
}
export function StageStepper({
  request
}) {
  useLanguage();
  const closed = ['cancelled', 'expired'].includes(request.status);
  const current = request.status === 'fulfilled' ? 3 : request.counts.selected >= request.candidateTarget ? 2 : request.counts.willing + request.counts.selected > 0 ? 1 : 0;
  return <ol className={styles.stepper} aria-label={tr("Request stages")}>
    {[tr('Searching'), tr('Donors responding'), tr('Donors selected'), tr('Completed')].map((label, index) => <li key={label} data-state={closed ? 'inactive' : index < current ? 'done' : index === current ? 'current' : 'pending'} aria-current={!closed && index === current ? 'step' : undefined}>
      <span className={styles.stepDot}>{!closed && index < current ? <CoordinationIcon name="check" /> : index + 1}</span><span>{label}</span>
    </li>)}
  </ol>;
}
export function RadiusIndicator({
  request,
  active,
  time
}) {
  useLanguage();
  const awaitingSelection = request.counts.willing + request.counts.selected >= request.candidateTarget;
  const searching = active && request.searchStatus === 'searching' && !awaitingSelection;
  const nextTime = new Date(request.nextEvaluationAt).getTime();
  const seconds = Math.max(0, Math.ceil((nextTime - time) / 1000));
  const next = !active ? tr('Search ended') : request.searchStatus === 'paused_manual' || request.searchStatus === 'paused_target' ? tr('New alerts are paused') : request.searchStatus === 'exhausted' ? tr('No further automatic alerts') : awaitingSelection ? tr('Choose from the willing donors below') : !request.nextEvaluationAt || seconds === 0 ? tr('Awaiting server update') : tr(`Next check in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);
  return <div className={styles.radiusPanel}>
    <div className={styles.radiusRing} data-searching={searching}>
      <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="53" className={styles.ringTrack} /><circle cx="60" cy="60" r={36 + 17 * Math.min(request.radiusKm, 50) / 50} className={styles.ringSize} /></svg>
      <div><strong key={request.radiusKm}>{request.radiusKm}<small>{tr("km")}</small></strong><span>{active ? tr('Search radius') : tr('Last radius')}</span></div>
    </div>
    <div><p className={styles.status}><CoordinationIcon name={searching ? 'radar' : 'clock'} />{next}</p><p className={styles.hint}>{tr("Search is centred on the hospital. Distance is a straight-line estimate.")}</p>
      <p className={styles.privacyNote}><CoordinationIcon name="lock" />{tr("Donor locations stay private.")}</p></div>
  </div>;
}
export function LoadingSkeleton() {
  useLanguage();
  return <div className={styles.skeleton} role="status" aria-label={tr("Loading donor coordination")}><span /><span /><span /><p>{tr("Loading donor coordination\u2026")}</p></div>;
}
