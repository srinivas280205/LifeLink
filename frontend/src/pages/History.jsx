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

function RateModal({ broadcast, onClose, onRated }) {
  const [stars, setStars] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!stars) { setError('Please select a star rating'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${API}/api/broadcasts/${broadcast._id}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ stars, note }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message); setSubmitting(false); return; }
      onRated(broadcast._id, { stars, note, ratedAt: new Date() });
      onClose();
    } catch { setError('Failed to submit. Try again.'); }
    setSubmitting(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--card-bg)', border: '1px solid var(--border)',
        borderRadius: 16, padding: '1.6rem', width: '100%', maxWidth: 420,
        boxShadow: '0 16px 48px rgba(0,0,0,0.35)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
          <h3 style={{ margin: 0, color: 'var(--text)', fontSize: '1.05rem' }}>⭐ Rate Your Donor</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--muted)' }}>✕</button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '1.2rem' }}>
          How was your experience? Your rating helps recognize great donors.
        </p>

        {/* Star picker */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1rem' }}>
          {[1,2,3,4,5].map(n => (
            <span
              key={n}
              onClick={() => setStars(n)}
              onMouseEnter={() => setHovered(n)}
              onMouseLeave={() => setHovered(0)}
              style={{
                fontSize: '2.2rem', cursor: 'pointer', transition: 'transform 0.1s',
                transform: (hovered || stars) >= n ? 'scale(1.2)' : 'scale(1)',
                filter: (hovered || stars) >= n ? 'none' : 'grayscale(1) opacity(0.4)',
              }}
            >⭐</span>
          ))}
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '1rem', minHeight: 18 }}>
          {stars === 1 ? 'Poor' : stars === 2 ? 'Fair' : stars === 3 ? 'Good' : stars === 4 ? 'Great' : stars === 5 ? 'Excellent!' : ''}
        </p>

        <textarea
          rows={3}
          placeholder="Leave a short note (optional)…"
          value={note}
          onChange={e => setNote(e.target.value)}
          maxLength={200}
          style={{
            width: '100%', padding: '0.6rem 0.85rem', borderRadius: 8,
            border: '1.5px solid var(--border)', background: 'var(--bg)',
            color: 'var(--text)', fontSize: '0.9rem', resize: 'none',
            boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: '0.3rem',
          }}
        />
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'right', marginBottom: '0.8rem' }}>{note.length}/200</p>

        {error && <p style={{ color: '#d32f2f', fontSize: '0.85rem', marginBottom: '0.6rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '0.7rem' }}>
          <button onClick={onClose} style={{
            flex: '0 0 auto', padding: '0.6rem 1rem', borderRadius: 8,
            border: '1.5px solid var(--border)', background: 'none',
            color: 'var(--muted)', cursor: 'pointer', fontWeight: 600,
          }}>Cancel</button>
          <button onClick={submit} disabled={submitting || !stars} style={{
            flex: 1, padding: '0.6rem 1rem', borderRadius: 8, border: 'none',
            background: stars ? '#d32f2f' : '#aaa', color: '#fff',
            cursor: stars ? 'pointer' : 'default', fontWeight: 700, fontSize: '0.9rem',
          }}>{submitting ? 'Submitting…' : '⭐ Submit Rating'}</button>
        </div>
      </div>
    </div>
  );
}

function BroadcastCard({ b, showResponders, onRepost, onRate }) {
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
        {showResponders && b.status === 'fulfilled' && !b.rating?.stars && (b.responses || []).length > 0 && (
          <button
            className={styles.repostBtn}
            style={{ background: 'linear-gradient(135deg,#f57f17,#e65100)', color: '#fff', border: 'none' }}
            onClick={() => onRate(b)}
          >
            ⭐ Rate Donor
          </button>
        )}
        {showResponders && b.rating?.stars && (
          <span style={{
            fontSize: '0.82rem', color: '#f57f17', fontWeight: 700,
            background: '#fff8e1', border: '1px solid #ffe082',
            borderRadius: 6, padding: '0.2rem 0.55rem',
          }}>
            {'⭐'.repeat(b.rating.stars)} {b.rating.note && `· "${b.rating.note}"`}
          </span>
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
  const [rateModal, setRateModal] = useState(null); // broadcast object

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
            <BroadcastCard key={b._id} b={b} showResponders={showResponders} onRepost={load} onRate={setRateModal} />
          ))}
        </div>
      </div>
      {rateModal && (
        <RateModal
          broadcast={rateModal}
          onClose={() => setRateModal(null)}
          onRated={(id, rating) => {
            setRequests(prev => prev.map(b => b._id === id ? { ...b, rating } : b));
          }}
        />
      )}
    </AppShell>
  );
}
