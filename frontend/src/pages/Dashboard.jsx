import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import AppShell from '../components/AppShell';
import styles from './Dashboard.module.css';
import { INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';
import Countdown from '../components/Countdown';
import { SkeletonFeed } from '../components/Skeleton';
import OnboardingModal from '../components/OnboardingModal';
import { usePushSubscription } from '../hooks/usePushSubscription';
import { useLanguage } from '../context/LanguageContext';

import API_BASE from '../config/api.js';
const API = API_BASE;
const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'A1+', 'A1-', 'A2+', 'A2-',
  'A1B+', 'A1B-', 'A2B+', 'A2B-',
  'Bombay (hh)', 'Oh+', 'Oh-',
];

const token = () => localStorage.getItem('token');

export default function Dashboard() {
  const navigate = useNavigate();
  usePushSubscription();
  const { t } = useLanguage();
  const URGENCY_LABELS = { critical: t('urgencyCritical'), urgent: t('urgencyUrgent'), normal: t('urgencyNormal') };
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [broadcasts, setBroadcasts] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const [form, setForm] = useState({ bloodGroup: '', units: 1, state: '', district: '', hospital: '', message: '', urgency: 'urgent' });
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [respondedIds, setRespondedIds] = useState(new Set());
  const [newAlert, setNewAlert] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(
    !user.bloodGroup && !localStorage.getItem('onboarding_dismissed')
  );
  const [respondModal, setRespondModal]       = useState(null);
  const [detailModal, setDetailModal]         = useState(null);
  const [fulfillModal, setFulfillModal]       = useState(null); // broadcast object
  const [fulfillDonorId, setFulfillDonorId]   = useState('');    // selected donor

  // SOS state
  const [sosOpen, setSosOpen] = useState(false);
  const [sosForm, setSosForm] = useState({ bloodGroup: '', hospital: '', units: 1, message: '' });
  const [sosLocating, setSosLocating] = useState(false);
  const [sosCoords, setSosCoords] = useState(null);
  const [sosSending, setSosSending] = useState(false);
  const [sosResult, setSosResult] = useState(null);
  const [sosError, setSosError] = useState('');

  // SOS hold-to-activate state
  const [holdProgress, setHoldProgress] = useState(0); // 0–100
  const holdTimerRef  = useRef(null);
  const holdStartRef  = useRef(null);
  const HOLD_DURATION = 3000; // ms

  // Load existing broadcasts
  const loadBroadcasts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/broadcasts`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcasts(data);
      }
    } catch {
      // ignore
    } finally {
      setFeedLoading(false);
    }
  }, []);

  // Socket.io real-time
  useEffect(() => {
    loadBroadcasts();

    const socket = io({ transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('new_broadcast', (broadcast) => {
      setBroadcasts((prev) => [broadcast, ...prev]);
      // Alert if blood group matches and it's not our own broadcast
      if (user.bloodGroup && broadcast.requestedBy !== (user.id || user._id) &&
          (broadcast.bloodGroup === user.bloodGroup || isCompatible(broadcast.bloodGroup, user.bloodGroup))) {
        setNewAlert(broadcast);
        setTimeout(() => setNewAlert(null), 6000);
      }
    });

    socket.on('broadcast_response', ({ broadcastId, donor }) => {
      setBroadcasts((prev) =>
        prev.map((b) =>
          b._id === broadcastId
            ? { ...b, responses: [...(b.responses || []), donor] }
            : b
        )
      );
      setDetailModal((prev) =>
        prev && prev._id === broadcastId
          ? { ...prev, responses: [...(prev.responses || []), donor] }
          : prev
      );
    });

    socket.on('broadcast_updated', ({ broadcastId, status }) => {
      setBroadcasts((prev) =>
        prev.map((b) => (b._id === broadcastId ? { ...b, status } : b))
      );
    });

    // SOS alert — show urgent banner for nearby donors
    socket.on('sos_alert', ({ userId: targetId, broadcast }) => {
      const me = user.id || user._id || '';
      if (targetId !== me) return;
      setNewAlert({ ...broadcast, _isSOS: true });
      setTimeout(() => setNewAlert(null), 10000);
    });

    return () => socket.disconnect();
  }, [loadBroadcasts, user.bloodGroup, user.id, user._id]);

  // Blood compatibility helper
  function isCompatible(needed, donor) {
    const map = {
      'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
      'O+': ['O+', 'A+', 'B+', 'AB+'],
      'A-': ['A-', 'A+', 'AB-', 'AB+'],
      'A+': ['A+', 'AB+'],
      'B-': ['B-', 'B+', 'AB-', 'AB+'],
      'B+': ['B+', 'AB+'],
      'AB-': ['AB-', 'AB+'],
      'AB+': ['AB+'],
    };
    return map[donor]?.includes(needed);
  }

  // Send broadcast
  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`${API}/api/broadcasts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setSendError(data.message); return; }
      setForm({ bloodGroup: '', units: 1, state: '', district: '', hospital: '', message: '', urgency: 'urgent' });
    } catch {
      setSendError('Failed to send. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  // Donor respond — open confirmation modal
  const handleRespond = (broadcast) => setRespondModal(broadcast);

  const confirmRespond = async () => {
    if (!respondModal) return;
    try {
      const res = await fetch(`${API}/api/broadcasts/${respondModal._id}/respond`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        setRespondedIds((prev) => new Set([...prev, respondModal._id]));
        setRespondModal(null);
      }
    } catch { /* ignore */ }
  };

  // Mark fulfilled / cancel own broadcast
  const handleStatus = async (broadcastId, status) => {
    try {
      await fetch(`${API}/api/broadcasts/${broadcastId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ status }),
      });
    } catch { /* ignore */ }
  };

  // SOS hold-to-activate handlers
  const startHold = (e) => {
    e.preventDefault();
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const pct = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(pct);
      if (pct >= 100) {
        clearInterval(holdTimerRef.current);
        setHoldProgress(0);
        openSOS();
      }
    }, 30);
  };

  const cancelHold = () => {
    clearInterval(holdTimerRef.current);
    setHoldProgress(0);
  };

  // SOS — get location then open modal
  const openSOS = () => {
    setSosOpen(true);
    setSosResult(null);
    setSosError('');
    setSosCoords(null);
    setSosLocating(true);
    if (!navigator.geolocation) {
      setSosError(t('geolocationUnsupported'));
      setSosLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setSosCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setSosLocating(false); },
      ()    => { setSosError(t('locationDenied')); setSosLocating(false); }
    );
  };

  const handleSOS = async (e) => {
    e.preventDefault();
    if (!sosCoords) { setSosError(t('sosLocationRequired')); return; }
    setSosSending(true); setSosError('');
    try {
      const res = await fetch(`${API}/api/broadcasts/sos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ ...sosForm, lat: sosCoords.lat, lng: sosCoords.lng }),
      });
      const data = await res.json();
      if (!res.ok) { setSosError(data.message); return; }
      setSosResult(data);
    } catch {
      setSosError(t('sosFailed'));
    } finally {
      setSosSending(false);
    }
  };

  const [feedFilter, setFeedFilter] = useState({ bloodGroup: '', matchOnly: false });
  const activeBroadcasts = broadcasts
    .filter((b) => b.status === 'active')
    .filter((b) => !feedFilter.bloodGroup || b.bloodGroup === feedFilter.bloodGroup)
    .filter((b) => !feedFilter.matchOnly || !user.bloodGroup ||
      b.bloodGroup === user.bloodGroup || isCompatible(b.bloodGroup, user.bloodGroup));

  return (
    <AppShell connected={connected} socket={socketRef.current}>
      {showOnboarding && (
        <OnboardingModal onDone={() => {
          localStorage.setItem('onboarding_dismissed', '1');
          setShowOnboarding(false);
        }} />
      )}
      {/* Real-time alert banner for donors */}
      {newAlert && (
        <div className={`${styles.alertBanner} ${newAlert._isSOS ? styles.alertBannerSOS : ''}`}>
          <span className={styles.alertIcon}>{newAlert._isSOS ? '🆘' : '🚨'}</span>
          <div>
            {newAlert._isSOS
              ? <><strong>{t('sosAlert')} {newAlert.bloodGroup} {t('bloodNeededUrgent')}!</strong> {newAlert.hospital && `· ${newAlert.hospital}`} {newAlert._distanceKm && `· ${newAlert._distanceKm}km away`}</>
              : <><strong>{t('emergency')}: {newAlert.bloodGroup} {t('bloodNeeded')}</strong> in {newAlert.district}{newAlert.state ? `, ${newAlert.state}` : ''}{newAlert.hospital && ` · ${newAlert.hospital}`}</>
            }
          </div>
          <button className={styles.alertClose} onClick={() => setNewAlert(null)}>✕</button>
        </div>
      )}

      {/* ── Fulfillment Attribution Modal ── */}
      {fulfillModal && (
        <div className={styles.sosOverlay} onClick={() => setFulfillModal(null)}>
          <div className={styles.sosModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className={styles.sosModalHeader}>
              <span className={styles.sosBadge} style={{ background: 'linear-gradient(135deg,#2e7d32,#1b5e20)' }}>
                {t('markAsFulfilled')}
              </span>
              <button className={styles.sosClose} onClick={() => setFulfillModal(null)}>✕</button>
            </div>
            <p className={styles.sosModalSub}>
              {t('whoHelped')} <strong>{fulfillModal.bloodGroup}</strong> {t('bloodRequestWord')}
            </p>

            {(fulfillModal.responses || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                {(fulfillModal.responses || []).map((r, i) => (
                  <label key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                    background: fulfillDonorId === r.donorId ? 'rgba(46,125,50,0.12)' : 'var(--input-bg)',
                    border: `1.5px solid ${fulfillDonorId === r.donorId ? '#2e7d32' : 'var(--border)'}`,
                    borderRadius: 10, padding: '0.65rem 0.85rem', cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="fulfillDonor" value={r.donorId}
                      checked={fulfillDonorId === r.donorId}
                      onChange={() => setFulfillDonorId(r.donorId)}
                      style={{ accentColor: '#2e7d32' }} />
                    <span style={{ background: 'linear-gradient(135deg,#d32f2f,#b71c1c)', color: '#fff',
                      borderRadius: 6, padding: '0.1rem 0.45rem', fontSize: '0.78rem', fontWeight: 800 }}>
                      {r.bloodGroup}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--heading)' }}>{r.donorName}</div>
                      {r.donorPhone && <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{r.donorPhone}</div>}
                    </div>
                    {fulfillDonorId === r.donorId && <span style={{ color: '#2e7d32', fontSize: '1.1rem' }}>✓</span>}
                  </label>
                ))}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  background: fulfillDonorId === 'other' ? 'rgba(46,125,50,0.12)' : 'var(--input-bg)',
                  border: `1.5px solid ${fulfillDonorId === 'other' ? '#2e7d32' : 'var(--border)'}`,
                  borderRadius: 10, padding: '0.65rem 0.85rem', cursor: 'pointer',
                }}>
                  <input type="radio" name="fulfillDonor" value="other"
                    checked={fulfillDonorId === 'other'}
                    onChange={() => setFulfillDonorId('other')}
                    style={{ accentColor: '#2e7d32' }} />
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{t('someoneElse')}</span>
                </label>
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                {t('noRespondersYet')}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                className={styles.sosSendBtn}
                style={{ flex: 1, background: 'linear-gradient(135deg,#2e7d32,#1b5e20)' }}
                disabled={(fulfillModal.responses || []).length > 0 && !fulfillDonorId}
                onClick={() => { handleStatus(fulfillModal._id, 'fulfilled'); setFulfillModal(null); }}
              >
                {t('confirmFulfilled')}
              </button>
              <button
                onClick={() => setFulfillModal(null)}
                style={{ padding: '0.85rem 1.1rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', color: 'var(--muted)', fontWeight: 600 }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Broadcast Detail Modal ── */}
      {detailModal && (
        <div className={styles.sosOverlay} onClick={() => setDetailModal(null)}>
          <div className={styles.sosModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className={styles.sosModalHeader}>
              <span className={styles.sosBadge} style={{ background: 'linear-gradient(135deg,#b71c1c,#1a237e)' }}>
                🩸 {detailModal.bloodGroup} · {URGENCY_LABELS[detailModal.urgency]}
              </span>
              <button className={styles.sosClose} onClick={() => setDetailModal(null)}>✕</button>
            </div>

            <div style={{ padding: '0.2rem 0 0.8rem', borderBottom: '1px solid var(--border)', marginBottom: '0.85rem' }}>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
                📍 {[detailModal.hospital, detailModal.district, detailModal.state].filter(Boolean).join(' · ')}
              </p>
              <p style={{ margin: '0 0 0.3rem', fontSize: '0.88rem', color: 'var(--muted)' }}>
                🩸 {`${detailModal.units} ${detailModal.units !== 1 ? t('unitsNeeded') : t('unitNeeded')}`}
              </p>
              {detailModal.message && (
                <p style={{ margin: '0.4rem 0 0', fontSize: '0.85rem', color: 'var(--text)', fontStyle: 'italic' }}>"{detailModal.message}"</p>
              )}
              <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--muted)' }}>
                {t('posted')} {new Date(detailModal.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                {detailModal.escalated && ` · ${t('escalated')}`}
              </p>
            </div>

            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--heading)', marginBottom: '0.6rem' }}>
                {t('requester')}
              </p>
              <div style={{ background: 'var(--input-bg)', borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--heading)' }}>{detailModal.requesterName}</p>
                <a href={`tel:${detailModal.requesterPhone}`}
                  style={{ color: '#d32f2f', fontWeight: 800, textDecoration: 'none', fontSize: '1.05rem' }}>
                  📞 {detailModal.requesterPhone}
                </a>
              </div>
            </div>

            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--heading)', marginBottom: '0.6rem' }}>
                {t('responders')} ({(detailModal.responses || []).length})
              </p>
              {(detailModal.responses || []).length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>{t('noResponders')}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {(detailModal.responses || []).map((r, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '0.6rem',
                      background: 'var(--input-bg)', borderRadius: 10, padding: '0.6rem 0.85rem',
                    }}>
                      <span style={{
                        background: 'linear-gradient(135deg,#d32f2f,#b71c1c)', color: '#fff',
                        borderRadius: 6, padding: '0.1rem 0.45rem', fontSize: '0.78rem', fontWeight: 800, flexShrink: 0,
                      }}>{r.bloodGroup}</span>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: '0.88rem', color: 'var(--heading)' }}>{r.donorName}</span>
                      {r.donorPhone && (
                        <a href={`tel:${r.donorPhone}`}
                          style={{ color: '#d32f2f', fontWeight: 700, textDecoration: 'none', fontSize: '0.85rem' }}>
                          📞 Call
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detailModal.requestedBy !== (user.id || user._id) && !detailModal.responses?.some(r => r.donorId === (user.id || user._id)) && !respondedIds.has(detailModal._id) && (
              <button
                className={styles.sosSendBtn}
                style={{ marginTop: '1rem', background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' }}
                onClick={() => { setDetailModal(null); handleRespond(detailModal); }}
              >
                {t('iCanHelp')}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SOS Floating Action Button — hold 3s to activate ── */}
      <button
        className={styles.sosFab}
        onMouseDown={startHold}
        onMouseUp={cancelHold}
        onMouseLeave={cancelHold}
        onTouchStart={startHold}
        onTouchEnd={cancelHold}
        title={t('holdToSos')}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        {/* Pulsing rings (hidden while holding) */}
        {holdProgress === 0 && <span className={styles.sosFabRing} />}
        {holdProgress === 0 && <span className={styles.sosFabRing2} />}

        {/* Hold progress ring (SVG circle) */}
        {holdProgress > 0 && (
          <svg
            width="84" height="84"
            style={{ position: 'absolute', top: '-8px', left: '-8px', transform: 'rotate(-90deg)' }}
          >
            <circle
              cx="42" cy="42" r="38"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="4"
            />
            <circle
              cx="42" cy="42" r="38"
              fill="none"
              stroke="#fff"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 38}`}
              strokeDashoffset={`${2 * Math.PI * 38 * (1 - holdProgress / 100)}`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.03s linear' }}
            />
          </svg>
        )}

        <span className={styles.sosFabInner} style={{ fontSize: holdProgress > 0 ? '1.3rem' : '1.6rem', transition: 'font-size 0.1s' }}>
          {holdProgress > 0 ? '🆘' : '🆘'}
        </span>

        {/* Hold progress label */}
        {holdProgress > 0 && (
          <span style={{
            position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)',
            color: '#d32f2f', fontWeight: 800, fontSize: '0.72rem', whiteSpace: 'nowrap',
            textShadow: '0 1px 3px rgba(0,0,0,0.4)',
            background: 'var(--card-bg)', padding: '0.1rem 0.4rem', borderRadius: 6,
            border: '1px solid var(--border)',
          }}>
            {`${t('holdSecs')} ${Math.ceil(((100 - holdProgress) / 100) * 3)}s`}
          </span>
        )}
      </button>

      {/* ── SOS Modal ── */}
      {sosOpen && (
        <div className={styles.sosOverlay} onClick={() => { if (!sosSending) setSosOpen(false); }}>
          <div className={styles.sosModal} onClick={(e) => e.stopPropagation()}>
            {sosResult ? (
              /* Success screen */
              <div className={styles.sosSuccess}>
                <div className={styles.sosSuccessIcon}>✅</div>
                <h2 className={styles.sosSuccessTitle}>{t('sosSent')}</h2>
                <p className={styles.sosSuccessMsg}>
                  <strong>{sosResult.donorsNotified}</strong> {t('donorsNotifiedMsg')}
                </p>
                <p className={styles.sosSuccessSub}>{t('broadcastLive')}</p>
                <button className={styles.sosDoneBtn} onClick={() => setSosOpen(false)}>{t('done')}</button>
              </div>
            ) : (
              <>
                <div className={styles.sosModalHeader}>
                  <span className={styles.sosBadge}>{t('sosEmergency')}</span>
                  <button className={styles.sosClose} onClick={() => setSosOpen(false)}>✕</button>
                </div>
                <p className={styles.sosModalSub}>
                  {t('sosBroadcastInfo')}
                </p>

                {sosLocating && <p className={styles.sosLocating}>{t('gettingLocation')}</p>}
                {sosCoords && <p className={styles.sosLocOk}>{`${t('locationDetected')} (${sosCoords.lat.toFixed(3)}, ${sosCoords.lng.toFixed(3)})`}</p>}

                <form onSubmit={handleSOS} className={styles.sosForm}>
                  <div className={styles.sosField}>
                    <label>{t('bloodGroupRequired')}</label>
                    <select value={sosForm.bloodGroup} onChange={e => setSosForm(f => ({...f, bloodGroup: e.target.value}))} required>
                      <option value="">{t('selectBloodGroup')}</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>

                  <div className={styles.sosField}>
                    <label>{t('hospitalLocation')}</label>
                    <input type="text" placeholder={t('hospitalSosPh')}
                      value={sosForm.hospital} onChange={e => setSosForm(f => ({...f, hospital: e.target.value}))} />
                  </div>

                  <div className={styles.sosField}>
                    <label>{t('unitsRequired')}</label>
                    <input type="number" min={1} max={10} value={sosForm.units}
                      onChange={e => setSosForm(f => ({...f, units: Number(e.target.value)}))} />
                  </div>

                  <div className={styles.sosField}>
                    <label>{t('messageOptional')}</label>
                    <textarea rows={2} placeholder={t('additionalDetails')}
                      value={sosForm.message} onChange={e => setSosForm(f => ({...f, message: e.target.value}))} />
                  </div>

                  {sosError && <p className={styles.sosError}>{sosError}</p>}

                  <button type="submit" className={styles.sosSendBtn} disabled={sosSending || sosLocating || !sosCoords}>
                    {sosSending ? t('sendingSos') : t('sendSosBtn')}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Respond Confirmation Modal ── */}
      {respondModal && (
        <div className={styles.sosOverlay} onClick={() => setRespondModal(null)}>
          <div className={styles.sosModal} onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className={styles.sosModalHeader}>
              <span className={styles.sosBadge} style={{ background: 'linear-gradient(135deg,#d32f2f,#b71c1c)' }}>
                {t('confirmResponse')}
              </span>
              <button className={styles.sosClose} onClick={() => setRespondModal(null)}>✕</button>
            </div>

            <p className={styles.sosModalSub}>
              {t('confirmResponseSub')}
            </p>

            <div style={{ background: 'var(--input-bg)', borderRadius: 10, padding: '0.9rem 1rem', marginBottom: '1rem' }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--heading)' }}>
                {respondModal.bloodGroup} blood needed
                {respondModal.hospital ? ` · ${respondModal.hospital}` : ''}
              </p>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                📍 {[respondModal.district, respondModal.state].filter(Boolean).join(', ')}
                {` · ${respondModal.units} ${respondModal.units !== 1 ? t('units') : t('units')}`}
              </p>
              <p style={{ margin: '0.6rem 0 0', fontSize: '0.9rem', color: 'var(--text)' }}>
                👤 <strong>{respondModal.requesterName}</strong>
              </p>
              <a
                href={`tel:${respondModal.requesterPhone}`}
                style={{ display: 'inline-block', marginTop: '0.5rem', fontWeight: 800, fontSize: '1.05rem', color: '#d32f2f', textDecoration: 'none' }}
              >
                📞 {respondModal.requesterPhone}
              </a>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                onClick={confirmRespond}
                className={styles.sosSendBtn}
                style={{ flex: 1 }}
              >
                {t('confirmHelp')}
              </button>
              <button
                onClick={() => setRespondModal(null)}
                style={{ flex: '0 0 auto', padding: '0.85rem 1.1rem', background: 'var(--card-bg)', border: '1.5px solid var(--border)', borderRadius: 12, cursor: 'pointer', color: 'var(--muted)', fontWeight: 600 }}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.layout}>
        {/* LEFT: Request form + blood group info */}
        <aside className={styles.sidebar}>
          {/* Blood group info — shown if user has set their blood group */}
          {user.bloodGroup && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>{t('yourBloodGroup')}</h2>
              <div className={styles.bloodBadge}>{user.bloodGroup}</div>
              <p className={styles.donorNote}>{t('donorNote')}</p>
              <div className={styles.compatInfo}>
                <p className={styles.compatLabel}>{t('canDonateTo')}</p>
                <div className={styles.compatPills}>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-']
                    .filter(bg => isCompatible(bg, user.bloodGroup))
                    .map(bg => <span key={bg} className={styles.compatPill}>{bg}</span>)}
                </div>
              </div>
            </div>
          )}

          {/* Emergency request form — everyone can post */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>{t('sendEmergency')}</h2>
            <form onSubmit={handleSend} className={styles.form}>
              <div className={styles.field}>
                <label>{t('bloodGroupNeeded')}</label>
                <select value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })} required>
                  <option value="">{t('selectBloodGroup')}</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>{t('units')}</label>
                  <input type="number" min={1} max={10} value={form.units}
                    onChange={e => setForm({ ...form, units: parseInt(e.target.value) })} />
                </div>
                <div className={styles.field}>
                  <label>{t('urgency')}</label>
                  <select value={form.urgency} onChange={e => setForm({ ...form, urgency: e.target.value })}>
                    <option value="critical">{t('urgencyCritical')}</option>
                    <option value="urgent">{t('urgencyUrgent')}</option>
                    <option value="normal">{t('urgencyNormal')}</option>
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>{t('stateUT')}</label>
                <select value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value, district: '' })} required>
                  <option value="">{t('selectState')}</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>{t('district')}</label>
                <select value={form.district}
                  onChange={e => setForm({ ...form, district: e.target.value })} required>
                  <option value="">{t('selectDistrict')}</option>
                  {(DISTRICTS_BY_STATE[form.state] || []).map(d =>
                    <option key={d} value={d}>{d}</option>
                  )}
                </select>
              </div>
              <div className={styles.field}>
                <label>{t('hospitalOptional')}</label>
                <input type="text" placeholder={t('hospitalPh')} value={form.hospital}
                  onChange={e => setForm({ ...form, hospital: e.target.value })} />
              </div>
              <div className={styles.field}>
                <label>{t('messageOptional')}</label>
                <textarea placeholder={t('messagePh')} value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  maxLength={300} rows={3} />
              </div>
              {sendError && <p className={styles.error}>{sendError}</p>}
              <button type="submit" className={styles.sendBtn} disabled={sending}>
                {sending ? t('sending') : t('broadcastBtn')}
              </button>
            </form>
          </div>

          {/* Stats */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>{t('liveStats')}</h3>
            <div className={styles.statsList}>
              <div className={styles.statRow}>
                <span>{t('activeRequests')}</span>
                <strong className={styles.statNum}>{activeBroadcasts.length}</strong>
              </div>
              <div className={styles.statRow}>
                <span>{t('totalBroadcasts')}</span>
                <strong>{broadcasts.length}</strong>
              </div>
              <div className={styles.statRow}>
                <span>{t('needsMet')}</span>
                <strong className={styles.fulfilled}>{broadcasts.filter(b => b.status === 'fulfilled').length}</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT: Live broadcast feed */}
        <main className={styles.feed}>
          <div className={styles.feedHeader}>
            <h2 className={styles.feedTitle}>
              {t('feedTitle')}
              {activeBroadcasts.length > 0 && (
                <span className={styles.feedBadge}>{activeBroadcasts.length}</span>
              )}
            </h2>
            <button className={styles.refreshBtn} onClick={loadBroadcasts}>{t('refresh')}</button>
          </div>

          {/* Feed filters — blood group chips */}
          <div className={styles.feedFilters}>
            <button
              className={`${styles.filterChip} ${!feedFilter.bloodGroup && !feedFilter.matchOnly ? styles.filterChipActive : ''}`}
              onClick={() => setFeedFilter({ bloodGroup: '', matchOnly: false })}
            >{t('all')}</button>
            {user.bloodGroup && (
              <button
                className={`${styles.filterChip} ${feedFilter.matchOnly ? styles.filterChipMatch : ''}`}
                onClick={() => setFeedFilter(f => ({ bloodGroup: '', matchOnly: !f.matchOnly }))}
              >{t('myMatches')}</button>
            )}
            {BLOOD_GROUPS.map(bg => (
              <button
                key={bg}
                className={`${styles.filterChip} ${feedFilter.bloodGroup === bg ? styles.filterChipActive : ''}`}
                onClick={() => setFeedFilter(f => ({ matchOnly: false, bloodGroup: f.bloodGroup === bg ? '' : bg }))}
              >{bg}</button>
            ))}
          </div>

          {feedLoading ? (
            <SkeletonFeed count={3} />
          ) : activeBroadcasts.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>📡</span>
              <p>{t('noActiveRequests')}</p>
              <p className={styles.emptySmall}>{t('newRequestsSoon')}</p>
            </div>
          ) : (
            <div className={styles.cards}>
              {activeBroadcasts.map((b) => {
                const isMatch = user.bloodGroup && (b.bloodGroup === user.bloodGroup || isCompatible(b.bloodGroup, user.bloodGroup));
                const hasResponded = respondedIds.has(b._id) || (b.responses || []).some(r => r.donorId === (user.id || user._id));
                const isOwner = b.requestedBy === (user.id || user._id) || b.requesterPhone === user.phone;

                return (
                  <div key={b._id} className={`${styles.broadcastCard} ${isMatch ? styles.matchCard : ''}`} onClick={() => setDetailModal(b)} style={{ cursor: 'pointer' }}>
                    <div className={styles.bcTop}>
                      <div className={styles.bcBlood}>{b.bloodGroup}</div>
                      <div className={styles.bcMeta}>
                        <span className={styles.urgencyBadge} data-urgency={b.urgency}>
                          {URGENCY_LABELS[b.urgency]}
                        </span>
                        <span className={styles.bcUnits}>{b.units} {t('units')}</span>
                      </div>
                    </div>

                    <div className={styles.bcInfo}>
                      <p className={styles.bcCity}>📍 {b.district}{b.state ? `, ${b.state}` : ''}{b.hospital ? ` · ${b.hospital}` : ''}</p>
                      <p className={styles.bcRequester}>👤 {b.requesterName} · {b.requesterPhone}</p>
                      {b.message && <p className={styles.bcMessage}>"{b.message}"</p>}
                    </div>

                    <div className={styles.bcFooter}>
                      <span className={styles.bcTime}>{new Date(b.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                      {b.expiresAt && <Countdown expiresAt={b.expiresAt} />}
                      <span className={styles.bcResponses}>{(b.responses || []).length} {t('responses_plural')}</span>
                      <div className={styles.bcActions} onClick={e => e.stopPropagation()}>
                        {!isOwner && !hasResponded && (
                          <button className={styles.respondBtn} onClick={() => handleRespond(b)}>
                            {t('iCanHelp')}
                          </button>
                        )}
                        {!isOwner && hasResponded && (
                          <span className={styles.respondedTag}>{t('responded')}</span>
                        )}
                        {isOwner && (
                          <>
                            <button className={styles.fulfillBtn} onClick={() => { setFulfillModal(b); setFulfillDonorId(''); }}>
                              {t('markFulfilled')}
                            </button>
                            <button className={styles.cancelBtn} onClick={() => handleStatus(b._id, 'cancelled')}>
                              {t('cancelRequest')}
                            </button>
                          </>
                        )}
                        <button
                          className={styles.waShareBtn}
                          title="Share this request"
                          onClick={async (e) => {
                            e.stopPropagation();
                            const text = `🆘 *URGENT: ${b.bloodGroup} Blood Needed*\n📍 ${[b.hospital, b.district, b.state].filter(Boolean).join(', ')}\n🩸 ${b.units} unit${b.units > 1 ? 's' : ''} required\n👤 Contact: ${b.requesterName} — ${b.requesterPhone}\n${b.message ? `📝 ${b.message}\n` : ''}Respond via LifeLink app.`;
                            if (navigator.share) {
                              try { await navigator.share({ title: `Blood Needed: ${b.bloodGroup}`, text }); } catch { /* cancelled */ }
                            } else {
                              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
                            }
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z"/></svg>
                          Share
                        </button>
                      </div>
                    </div>

                    {b.escalated && (
                      <div className={styles.escalatedBanner}>🔴 No donor yet — escalated to critical</div>
                    )}
                    {isMatch && (
                      <div className={styles.matchBanner}>⚡ Matches your blood group</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </AppShell>
  );
}
