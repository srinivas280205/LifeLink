import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import styles from './Events.module.css';
import { INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';

const API = '';
const token = () => localStorage.getItem('token');
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}
function daysUntil(d) {
  const diff = new Date(d) - Date.now();
  const days = Math.floor(diff / 86400000);
  if (days < 0) return 'Today';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `In ${days} days`;
}

export default function Events() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user.id || user._id || '';

  const [events, setEvents]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [joining, setJoining]     = useState({});
  const [filterState, setFilterState] = useState('');

  const [form, setForm] = useState({
    title: '', description: '', venue: '', state: '', district: '',
    date: '', endDate: '', bloodGroupsNeeded: [], targetDonors: 50,
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const params = filterState ? `?state=${encodeURIComponent(filterState)}` : '';
      const res = await fetch(`${API}/api/events${params}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) setEvents(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    load();
  }, [filterState]);

  const toggleBG = (bg) => setForm(f => ({
    ...f,
    bloodGroupsNeeded: f.bloodGroupsNeeded.includes(bg)
      ? f.bloodGroupsNeeded.filter(x => x !== bg)
      : [...f.bloodGroupsNeeded, bg],
  }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true); setCreateError('');
    try {
      const res = await fetch(`${API}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setCreateError(data.message); return; }
      setEvents(prev => [data, ...prev]);
      setCreateOpen(false);
      setForm({ title:'', description:'', venue:'', state:'', district:'', date:'', endDate:'', bloodGroupsNeeded:[], targetDonors:50 });
    } catch { setCreateError('Failed to create event.'); }
    finally { setCreating(false); }
  };

  const handleJoin = async (eventId, joined) => {
    setJoining(j => ({ ...j, [eventId]: true }));
    try {
      const method = joined ? 'DELETE' : 'POST';
      const url = `${API}/api/events/${eventId}/${joined ? 'leave' : 'join'}`;
      const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const { attendees } = await res.json();
        setEvents(prev => prev.map(e =>
          e._id === eventId
            ? { ...e,
                attendees: joined
                  ? e.attendees.filter(a => a.userId !== userId)
                  : [...e.attendees, { userId, name: user.fullName, bloodGroup: user.bloodGroup }],
              }
            : e
        ));
      }
    } catch { /* ignore */ }
    setJoining(j => ({ ...j, [eventId]: false }));
  };

  return (
    <AppShell connected={true}>
      <div className={styles.page}>
        <div className={styles.inner}>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>🩸 Blood Drive Events</h1>
              <p className={styles.sub}>Join a local blood donation camp near you</p>
            </div>
            <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>
              + Create Event
            </button>
          </div>

          {/* State filter */}
          <div className={styles.filterRow}>
            <select className={styles.filterSelect} value={filterState} onChange={e => setFilterState(e.target.value)}>
              <option value="">All States</option>
              {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Events list */}
          {loading ? (
            <div className={styles.loading}><div className={styles.spinner} /></div>
          ) : events.length === 0 ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🏥</span>
              <p>No upcoming events{filterState ? ` in ${filterState}` : ''}</p>
              <p className={styles.emptySub}>Be the first to organize a blood drive in your area!</p>
              <button className={styles.createBtn} onClick={() => setCreateOpen(true)}>+ Create Event</button>
            </div>
          ) : (
            <div className={styles.grid}>
              {events.map(ev => {
                const joined = ev.attendees?.some(a => String(a.userId) === userId);
                const pct = Math.min(100, Math.round(((ev.attendees?.length || 0) / ev.targetDonors) * 100));
                const daysLabel = daysUntil(ev.date);
                return (
                  <div key={ev._id} className={styles.card}>
                    <div className={styles.cardTop}>
                      <div className={styles.daysChip} data-soon={daysLabel === 'Today' || daysLabel === 'Tomorrow' ? 'true' : 'false'}>
                        {daysLabel}
                      </div>
                      {ev.bloodGroupsNeeded?.length > 0 && (
                        <div className={styles.bgPills}>
                          {ev.bloodGroupsNeeded.slice(0,4).map(bg => (
                            <span key={bg} className={styles.bgPill}>{bg}</span>
                          ))}
                          {ev.bloodGroupsNeeded.length > 4 && <span className={styles.bgPill}>+{ev.bloodGroupsNeeded.length - 4}</span>}
                        </div>
                      )}
                    </div>

                    <h3 className={styles.evTitle}>{ev.title}</h3>
                    {ev.description && <p className={styles.evDesc}>{ev.description}</p>}

                    <div className={styles.evMeta}>
                      <span>📅 {formatDate(ev.date)} · {formatTime(ev.date)}</span>
                      {ev.endDate && <span> – {formatTime(ev.endDate)}</span>}
                    </div>
                    <div className={styles.evMeta}>📍 {[ev.venue, ev.district, ev.state].filter(Boolean).join(', ')}</div>
                    <div className={styles.evMeta}>👤 Organised by {ev.organizerName} · 📞 {ev.organizerPhone}</div>

                    {/* Progress bar */}
                    <div className={styles.progress}>
                      <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={styles.progressLabel}>
                        {ev.attendees?.length || 0} / {ev.targetDonors} donors joined
                      </span>
                    </div>

                    <button
                      className={joined ? styles.leaveBtn : styles.joinBtn}
                      disabled={!!joining[ev._id]}
                      onClick={() => handleJoin(ev._id, joined)}
                    >
                      {joining[ev._id] ? '...' : joined ? '✓ Joined — Leave' : '🩸 Join Drive'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create event modal */}
      {createOpen && (
        <div className={styles.overlay} onClick={() => setCreateOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span className={styles.modalTitle}>🩸 Create Blood Drive</span>
              <button className={styles.modalClose} onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.field}>
                <label>Event Title *</label>
                <input placeholder="e.g. Chennai Blood Drive 2026" required
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea rows={2} placeholder="Details about the event…"
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label>Venue / Address *</label>
                <input placeholder="Hospital or community hall name + address" required
                  value={form.venue} onChange={e => setForm(f => ({ ...f, venue: e.target.value }))} />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>State</label>
                  <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value, district: '' }))}>
                    <option value="">Select state</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>District</label>
                  <select value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                    <option value="">Select district</option>
                    {(DISTRICTS_BY_STATE[form.state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Date & Time *</label>
                  <input type="datetime-local" required
                    value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className={styles.field}>
                  <label>End Time</label>
                  <input type="datetime-local"
                    value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
              <div className={styles.field}>
                <label>Blood Groups Needed</label>
                <div className={styles.bgChips}>
                  {BLOOD_GROUPS.map(bg => (
                    <button key={bg} type="button"
                      className={`${styles.bgChip} ${form.bloodGroupsNeeded.includes(bg) ? styles.bgChipOn : ''}`}
                      onClick={() => toggleBG(bg)}>{bg}</button>
                  ))}
                </div>
              </div>
              <div className={styles.field}>
                <label>Target Donors</label>
                <input type="number" min={5} max={500} value={form.targetDonors}
                  onChange={e => setForm(f => ({ ...f, targetDonors: Number(e.target.value) }))} />
              </div>
              {createError && <p className={styles.error}>{createError}</p>}
              <button type="submit" className={styles.submitBtn} disabled={creating}>
                {creating ? 'Creating…' : '🩸 Create Event'}
              </button>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
