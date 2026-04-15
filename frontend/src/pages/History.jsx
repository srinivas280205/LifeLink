import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import styles from './History.module.css';
import API_BASE from '../config/api.js';

const API = API_BASE;
const token = () => localStorage.getItem('token');

async function repostBroadcast(b) {
  const token = localStorage.getItem('token');
  return fetch(`${API}/api/broadcasts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      bloodGroup: b.bloodGroup, units: b.units, state: b.state,
      district: b.district, hospital: b.hospital, message: b.message, urgency: b.urgency,
    }),
  });
}
const STATUS_LABELS  = { active: '🟢 Active', fulfilled: '✅ Need Met', cancelled: '⛔ Cancelled' };
const URGENCY_LABELS = { critical: '🔴 Critical', urgent: '🟠 Urgent', normal: '🟡 Normal' };

function BroadcastCard({ b, showResponders, onRepost }) {
  const [reposting, setReposting] = useState(false);
  const [reposted, setReposted]   = useState(false);

  const handleRepost = async () => {
    setReposting(true);
    try {
      const res = await repostBroadcast(b);
      if (res.ok) { setReposted(true); onRepost?.(); setTimeout(() => setReposted(false), 3000); }
    } catch { /* ignore */ }
    setReposting(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardTop}>
        <span className={styles.bloodBadge}>{b.bloodGroup}</span>
        <span className={styles.urgencyLabel}>{URGENCY_LABELS[b.urgency]}</span>
        <span className={styles.statusBadge}>{STATUS_LABELS[b.status] || b.status}</span>
        {b.isSOS && <span className={styles.sosBadge}>🆘 SOS</span>}
      </div>

      <p className={styles.cardMeta}>
        📍 {[b.district, b.state].filter(Boolean).join(', ')}
        {b.hospital && ` · 🏥 ${b.hospital}`}
        {` · ${b.units} unit${b.units !== 1 ? 's' : ''}`}
      </p>

      {/* Requester info — shown on My Responses tab */}
      {!showResponders && (
        <p className={styles.cardMeta}>
          👤 Requester: <strong>{b.requesterName}</strong>
          {' · '}
          <a href={`tel:${b.requesterPhone}`} className={styles.callLink}>
            📞 {b.requesterPhone}
          </a>
        </p>
      )}

      {/* Responders — shown on My Requests tab */}
      {showResponders && (b.responses || []).length > 0 && (
        <div className={styles.respondersSection}>
          <p className={styles.respondersTitle}>
            {b.responses.length} Donor{b.responses.length !== 1 ? 's' : ''} Responded
          </p>
          {b.responses.map((r, i) => (
            <div key={i} className={styles.responderRow}>
              <span className={styles.responderBlood}>{r.bloodGroup}</span>
              <span className={styles.responderName}>{r.donorName}</span>
              <a href={`tel:${r.donorPhone}`} className={styles.callLink}>📞 {r.donorPhone}</a>
            </div>
          ))}
        </div>
      )}

      {showResponders && (b.responses || []).length === 0 && (
        <p className={styles.noResponders}>No donors have responded yet.</p>
      )}

      <div className={styles.cardFooter}>
        <p className={styles.cardDate}>
          {new Date(b.createdAt).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
        {showResponders && b.status !== 'active' && (
          reposted
            ? <span className={styles.repostedTag}>✅ Reposted!</span>
            : <button className={styles.repostBtn} onClick={handleRepost} disabled={reposting}>
                {reposting ? '...' : '🔄 Repost'}
              </button>
        )}
      </div>
    </div>
  );
}

export default function History() {
  const navigate = useNavigate();
  const [tab, setTab]         = useState('requests');
  const [requests, setRequests]   = useState([]);
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token()) { navigate('/login'); return; }
    setLoading(true);
    try {
      const [reqRes, resRes] = await Promise.all([
        fetch(`${API}/api/broadcasts/mine`,        { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/broadcasts/myresponses`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      const [reqData, resData] = await Promise.all([reqRes.json(), resRes.json()]);
      setRequests(Array.isArray(reqData)  ? reqData  : []);
      setResponses(Array.isArray(resData) ? resData  : []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [navigate]);

  useEffect(() => { load(); }, [load]);

  const items        = tab === 'requests' ? requests : responses;
  const showResponders = tab === 'requests';

  return (
    <AppShell connected={true}>
      <div className={styles.page}>
        <div className={styles.inner}>
          <h1 className={styles.heading}>📋 My History</h1>

          {/* Tabs */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tabBtn} ${tab === 'requests' ? styles.tabActive : ''}`}
              onClick={() => setTab('requests')}
            >
              📡 My Requests
              {requests.length > 0 && <span className={styles.tabCount}>{requests.length}</span>}
            </button>
            <button
              className={`${styles.tabBtn} ${tab === 'responses' ? styles.tabActive : ''}`}
              onClick={() => setTab('responses')}
            >
              🩸 My Responses
              {responses.length > 0 && <span className={styles.tabCount}>{responses.length}</span>}
            </button>
          </div>

          <p className={styles.sub}>
            {tab === 'requests'
              ? 'Blood requests you have posted and who responded'
              : 'Requests you have offered to help with'}
          </p>

          {loading && (
            <div className={styles.loading}><div className={styles.spinner} /></div>
          )}

          {!loading && items.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>{tab === 'requests' ? '📡' : '🩸'}</span>
              <p>{tab === 'requests'
                ? 'No requests yet. Use the dashboard to request blood.'
                : "You haven't responded to any requests yet."}</p>
            </div>
          )}

          {!loading && items.map((b) => (
            <BroadcastCard key={b._id} b={b} showResponders={showResponders} onRepost={load} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
