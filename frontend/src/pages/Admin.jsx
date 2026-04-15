import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Admin.module.css';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const STATUS_COLORS  = { active: '#2196f3', fulfilled: '#4caf50', cancelled: '#9e9e9e' };
const URGENCY_COLORS = { critical: '#d32f2f', urgent: '#f57c00', normal: '#388e3c' };

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Sparkline({ data = [], color = '#d32f2f', height = 36, width = 120 }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (v / max) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} className={styles.sparkline}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      <polyline points={`0,${height} ${pts} ${width},${height}`}
        fill={color} fillOpacity="0.12" stroke="none" />
    </svg>
  );
}

export default function Admin() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const [tab, setTab]         = useState('overview');
  const [stats, setStats]     = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [activity, setActivity] = useState([]);
  const [trends, setTrends]     = useState(null);

  // Users
  const [users, setUsers]           = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage]   = useState(1);
  const [usersPages, setUsersPages] = useState(1);
  const [userSearch, setUserSearch] = useState('');
  const [userBG, setUserBG]         = useState('');
  const [usersLoading, setUsersLoading] = useState(false);

  // Broadcasts
  const [broadcasts, setBroadcasts] = useState([]);
  const [bcTotal, setBcTotal]       = useState(0);
  const [bcPage, setBcPage]         = useState(1);
  const [bcPages, setBcPages]       = useState(1);
  const [bcStatus, setBcStatus]     = useState('');
  const [bcBG, setBcBG]             = useState('');
  const [bcLoading, setBcLoading]   = useState(false);

  // Events
  const [events, setEvents]         = useState([]);
  const [evTotal, setEvTotal]       = useState(0);
  const [evPage, setEvPage]         = useState(1);
  const [evPages, setEvPages]       = useState(1);
  const [evLoading, setEvLoading]   = useState(false);

  // Announce
  const [annTitle, setAnnTitle]     = useState('');
  const [annBody, setAnnBody]       = useState('');
  const [annSending, setAnnSending] = useState(false);
  const [annResult, setAnnResult]   = useState('');

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    if (!user.isAdmin) navigate('/dashboard');
  }, [navigate, user.isAdmin]);

  /* ── Fetchers ─────────────────────────────────────────────────────── */
  const fetchStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const [sRes, aRes, tRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`,        { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/admin/activity`,     { headers: { Authorization: `Bearer ${token()}` } }),
        fetch(`${API}/api/admin/stats/trends`, { headers: { Authorization: `Bearer ${token()}` } }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (aRes.ok) setActivity((await aRes.json()).feed || []);
      if (tRes.ok) setTrends(await tRes.json());
    } catch { /* ignore */ }
    setStatsLoading(false);
  }, []);

  const fetchUsers = useCallback(async (page = 1) => {
    setUsersLoading(true);
    const p = new URLSearchParams({ page });
    if (userSearch) p.set('search', userSearch);
    if (userBG)     p.set('bloodGroup', userBG);
    try {
      const res = await fetch(`${API}/api/admin/users?${p}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users); setUsersTotal(d.total); setUsersPage(d.page); setUsersPages(d.pages);
      }
    } catch { /* ignore */ }
    setUsersLoading(false);
  }, [userSearch, userBG]);

  const fetchBroadcasts = useCallback(async (page = 1) => {
    setBcLoading(true);
    const p = new URLSearchParams({ page });
    if (bcStatus) p.set('status', bcStatus);
    if (bcBG)     p.set('bloodGroup', bcBG);
    try {
      const res = await fetch(`${API}/api/admin/broadcasts?${p}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const d = await res.json();
        setBroadcasts(d.broadcasts); setBcTotal(d.total); setBcPage(d.page); setBcPages(d.pages);
      }
    } catch { /* ignore */ }
    setBcLoading(false);
  }, [bcStatus, bcBG]);

  const fetchEvents = useCallback(async (page = 1) => {
    setEvLoading(true);
    try {
      const res = await fetch(`${API}/api/admin/events?page=${page}`, { headers: { Authorization: `Bearer ${token()}` } });
      if (res.ok) {
        const d = await res.json();
        setEvents(d.events); setEvTotal(d.total); setEvPage(d.page); setEvPages(d.pages);
      }
    } catch { /* ignore */ }
    setEvLoading(false);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  useEffect(() => { if (tab === 'users')      fetchUsers(1); },      [tab, fetchUsers]);
  useEffect(() => { if (tab === 'broadcasts') fetchBroadcasts(1); }, [tab, fetchBroadcasts]);
  useEffect(() => { if (tab === 'events')     fetchEvents(1); },     [tab, fetchEvents]);

  /* ── Actions ──────────────────────────────────────────────────────── */
  const deleteUser = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    await fetch(`${API}/api/admin/users/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    fetchUsers(usersPage); fetchStats();
  };

  const toggleVerify = async (id) => {
    const res = await fetch(`${API}/api/admin/users/${id}/verify`, { method: 'PATCH', headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) {
      const { isVerified } = await res.json();
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isVerified } : u));
    }
  };

  const toggleAdmin = async (id, name) => {
    if (!window.confirm(`Toggle admin role for "${name}"?`)) return;
    const res = await fetch(`${API}/api/admin/users/${id}/toggle-admin`, { method: 'PATCH', headers: { Authorization: `Bearer ${token()}` } });
    if (res.ok) {
      const { isAdmin } = await res.json();
      setUsers(prev => prev.map(u => u._id === id ? { ...u, isAdmin } : u));
    }
  };

  const cancelBroadcast = async (id) => {
    await fetch(`${API}/api/admin/broadcasts/${id}/cancel`, { method: 'PATCH', headers: { Authorization: `Bearer ${token()}` } });
    fetchBroadcasts(bcPage); fetchStats();
  };

  const deleteEvent = async (id, title) => {
    if (!window.confirm(`Delete event "${title}"?`)) return;
    await fetch(`${API}/api/admin/events/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token()}` } });
    fetchEvents(evPage);
  };

  const sendAnnouncement = async () => {
    if (!annTitle.trim() || !annBody.trim()) return;
    setAnnSending(true); setAnnResult('');
    try {
      const res = await fetch(`${API}/api/admin/announce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ title: annTitle, body: annBody }),
      });
      const d = await res.json();
      setAnnResult(res.ok ? `✅ ${d.message}` : `❌ ${d.message}`);
      if (res.ok) { setAnnTitle(''); setAnnBody(''); }
    } catch { setAnnResult('❌ Network error'); }
    setAnnSending(false);
  };

  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

  const bg    = stats?.bloodGroupDistribution || [];
  const maxBG = bg.length ? Math.max(...bg.map(b => b.count)) : 1;

  return (
    <div className={styles.shell}>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <BrandLogo size={28} />
          <span className={styles.brandName}>LifeLink</span>
          <span className={styles.adminBadge}>Admin</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.adminUser}>👤 {user.fullName?.split(' ')[0]}</span>
          <button className={styles.themeBtn} onClick={toggle}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button className={styles.backBtn} onClick={() => navigate('/dashboard')}>← Dashboard</button>
          <button className={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {/* Tab bar */}
      <div className={styles.tabBar}>
        {[
          { key: 'overview',   label: '📊 Overview'  },
          { key: 'users',      label: '👥 Users'      },
          { key: 'broadcasts', label: '📡 Broadcasts' },
          { key: 'events',     label: '🗓️ Events'     },
          { key: 'announce',   label: '📣 Announce'   },
        ].map(t => (
          <button key={t.key}
            className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
            onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.content}>

        {/* ══ OVERVIEW ══ */}
        {tab === 'overview' && (
          statsLoading ? <div className={styles.loading}><div className={styles.spinner} /></div>
          : stats ? (
            <>
              {/* KPI cards */}
              <div className={styles.statGrid}>

                <div className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div>
                      <div className={styles.statNum}>{stats.users.total}</div>
                      <div className={styles.statLabel}>Total Users</div>
                      <div className={styles.statSub}>{stats.users.verified} verified · {stats.users.withBloodGroup} with blood group</div>
                    </div>
                    <div className={styles.statIconBig}>👥</div>
                  </div>
                  {trends && <Sparkline data={trends.users} color="#1a237e" />}
                  <div className={styles.trendLabel}>Signups — last 14 days</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div>
                      <div className={styles.statNum}>{stats.broadcasts.total}</div>
                      <div className={styles.statLabel}>Total Broadcasts</div>
                      <div className={styles.statSub}>{stats.broadcasts.active} active · {stats.broadcasts.sos} SOS</div>
                    </div>
                    <div className={styles.statIconBig}>📡</div>
                  </div>
                  {trends && <Sparkline data={trends.broadcasts} color="#d32f2f" />}
                  <div className={styles.trendLabel}>Requests — last 14 days</div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div>
                      <div className={`${styles.statNum} ${styles.green}`}>{stats.broadcasts.fulfilled}</div>
                      <div className={styles.statLabel}>Needs Met</div>
                      <div className={styles.statSub}>
                        {stats.broadcasts.total > 0
                          ? `${Math.round((stats.broadcasts.fulfilled / stats.broadcasts.total) * 100)}% fulfill rate`
                          : 'No requests yet'}
                      </div>
                    </div>
                    <div className={styles.statIconBig}>✅</div>
                  </div>
                  <div className={styles.fulfillBar}>
                    <div className={styles.fulfillFill} style={{
                      width: stats.broadcasts.total > 0
                        ? `${Math.round((stats.broadcasts.fulfilled / stats.broadcasts.total) * 100)}%` : '0%'
                    }} />
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div>
                      <div className={`${styles.statNum} ${styles.red}`}>{stats.broadcasts.totalResponses}</div>
                      <div className={styles.statLabel}>Total Responses</div>
                      <div className={styles.statSub}>Donors who offered help</div>
                    </div>
                    <div className={styles.statIconBig}>🩸</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div>
                      <div className={styles.statNum} style={{ color: '#d32f2f' }}>{stats.broadcasts.sos}</div>
                      <div className={styles.statLabel}>SOS Alerts</div>
                      <div className={styles.statSub}>{stats.broadcasts.cancelled} cancelled total</div>
                    </div>
                    <div className={styles.statIconBig}>🆘</div>
                  </div>
                </div>

                <div className={styles.statCard}>
                  <div className={styles.statCardTop}>
                    <div>
                      <div className={styles.statNum} style={{ color: '#7b1fa2' }}>
                        {stats.users.total > 0
                          ? `${Math.round((stats.users.verified / stats.users.total) * 100)}%` : '—'}
                      </div>
                      <div className={styles.statLabel}>Verified Rate</div>
                      <div className={styles.statSub}>{stats.users.verified} of {stats.users.total} users</div>
                    </div>
                    <div className={styles.statIconBig}>🛡️</div>
                  </div>
                </div>

              </div>

              {/* Charts row */}
              <div className={styles.row3}>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>🩸 Blood Group Distribution</h3>
                  {bg.length === 0 ? <p className={styles.empty}>No data yet</p> : (
                    <div className={styles.bgBars}>
                      {bg.map(b => (
                        <div key={b._id} className={styles.bgRow}>
                          <span className={styles.bgLabel}>{b._id}</span>
                          <div className={styles.bgTrack}>
                            <div className={styles.bgBar} style={{ width: `${Math.round((b.count / maxBG) * 100)}%` }} />
                          </div>
                          <span className={styles.bgCount}>{b.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>📍 Top States</h3>
                  {stats.topStates.length === 0 ? <p className={styles.empty}>No data yet</p> : (
                    <div className={styles.stateList}>
                      {stats.topStates.slice(0, 8).map((s, i) => (
                        <div key={s._id} className={styles.stateRow}>
                          <span className={styles.stateRank}>#{i + 1}</span>
                          <span className={styles.stateName}>{s._id || 'Unknown'}</span>
                          <div className={styles.stateBarTrack}>
                            <div className={styles.stateBarFill}
                              style={{ width: `${Math.round((s.count / stats.topStates[0].count) * 100)}%` }} />
                          </div>
                          <span className={styles.stateCount}>{s.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>⚡ Live Activity</h3>
                  {activity.length === 0 ? <p className={styles.empty}>No recent activity</p> : (
                    <div className={styles.activityFeed}>
                      {activity.map((a, i) => (
                        <div key={i} className={styles.activityItem}>
                          <span className={`${styles.activityDot} ${a.type === 'broadcast' ? styles.dotRed : styles.dotBlue}`} />
                          <div className={styles.activityBody}>
                            <span className={styles.activityText}>{a.text}</span>
                            <span className={styles.activityTime}>{timeAgo(a.time)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Recent signups grid */}
              <div className={styles.card} style={{ marginTop: '1rem' }}>
                <h3 className={styles.cardTitle}>🆕 Recent Signups</h3>
                {stats.recentSignups.length === 0 ? <p className={styles.empty}>No signups yet</p> : (
                  <div className={styles.recentGrid}>
                    {stats.recentSignups.map(u => (
                      <div key={u._id} className={styles.recentCard}>
                        <div className={styles.recentBlood}>{u.bloodGroup || '?'}</div>
                        <div className={styles.recentInfo}>
                          <span className={styles.recentName}>{u.fullName}</span>
                          <span className={styles.recentMeta}>{u.phone} · {u.state || 'No state'}</span>
                          <span className={styles.recentTime}>{timeAgo(u.createdAt)}</span>
                        </div>
                        {u.isVerified && <span className={styles.verifiedBadge}>✅</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : <p className={styles.empty}>Failed to load stats. Is the backend running?</p>
        )}

        {/* ══ USERS ══ */}
        {tab === 'users' && (
          <>
            <div className={styles.tableControls}>
              <input className={styles.searchInput} placeholder="Search name or phone…"
                value={userSearch} onChange={e => setUserSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchUsers(1)} />
              <select className={styles.filterSelect} value={userBG}
                onChange={e => setUserBG(e.target.value)}>
                <option value="">All Blood Groups</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <button className={styles.searchBtn} onClick={() => fetchUsers(1)}>Search</button>
              <button className={styles.refreshBtn} onClick={() => fetchUsers(usersPage)}>↻</button>
              <span className={styles.totalCount}>{usersTotal} users</span>
            </div>

            {usersLoading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th><th>Phone</th><th>Blood</th><th>Location</th>
                        <th>Verified</th><th>Admin</th><th>Available</th><th>Joined</th><th>Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0
                        ? <tr><td colSpan={9} className={styles.emptyCell}>No users found</td></tr>
                        : users.map(u => (
                          <tr key={u._id}>
                            <td className={styles.nameCell}>
                              {u.isAdmin && <span className={styles.adminTag}>Admin</span>}
                              {u.fullName}
                            </td>
                            <td>{u.phone}</td>
                            <td>{u.bloodGroup ? <span className={styles.bloodPill}>{u.bloodGroup}</span> : <span className={styles.noBG}>—</span>}</td>
                            <td className={styles.locCell}>{[u.district, u.state].filter(Boolean).join(', ') || '—'}</td>
                            <td>
                              <button className={u.isVerified ? styles.verifyOnBtn : styles.verifyOffBtn}
                                onClick={() => toggleVerify(u._id)} title={u.isVerified ? 'Unverify' : 'Verify'}>
                                {u.isVerified ? '✅' : '⏳'}
                              </button>
                            </td>
                            <td>
                              <button className={u.isAdmin ? styles.adminOnBtn : styles.adminOffBtn}
                                onClick={() => toggleAdmin(u._id, u.fullName)} title={u.isAdmin ? 'Revoke admin' : 'Grant admin'}>
                                {u.isAdmin ? '🛡️' : '+'}
                              </button>
                            </td>
                            <td className={styles.center}>
                              <span title={u.isAvailable ? 'Available' : 'Unavailable'}>
                                {u.isAvailable !== false ? '🟢' : '⚫'}
                              </span>
                            </td>
                            <td className={styles.timeCell}>{timeAgo(u.createdAt)}</td>
                            <td>
                              {!u.isAdmin && (
                                <button className={styles.deleteBtn} onClick={() => deleteUser(u._id, u.fullName)}>Del</button>
                              )}
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                <div className={styles.pagination}>
                  <button disabled={usersPage <= 1} onClick={() => fetchUsers(usersPage - 1)}>← Prev</button>
                  <span>Page {usersPage} of {usersPages}</span>
                  <button disabled={usersPage >= usersPages} onClick={() => fetchUsers(usersPage + 1)}>Next →</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ BROADCASTS ══ */}
        {tab === 'broadcasts' && (
          <>
            <div className={styles.tableControls}>
              <select className={styles.filterSelect} value={bcStatus} onChange={e => setBcStatus(e.target.value)}>
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="fulfilled">Fulfilled</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select className={styles.filterSelect} value={bcBG} onChange={e => setBcBG(e.target.value)}>
                <option value="">All Blood Groups</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
              <button className={styles.searchBtn} onClick={() => fetchBroadcasts(1)}>Filter</button>
              <button className={styles.refreshBtn} onClick={() => fetchBroadcasts(bcPage)}>↻</button>
              <span className={styles.totalCount}>{bcTotal} broadcasts</span>
            </div>

            {bcLoading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Blood</th><th>Requester</th><th>Location</th>
                        <th>Urgency</th><th>Status</th><th>Resp.</th><th>Time</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {broadcasts.length === 0
                        ? <tr><td colSpan={8} className={styles.emptyCell}>No broadcasts found</td></tr>
                        : broadcasts.map(b => (
                          <tr key={b._id}>
                            <td><span className={styles.bloodPill}>{b.bloodGroup}</span></td>
                            <td className={styles.nameCell}>
                              {b.isSOS && <span className={styles.sosTag}>SOS</span>}
                              {b.requesterName}<br />
                              <small style={{ color: 'var(--muted)' }}>{b.requesterPhone}</small>
                            </td>
                            <td className={styles.locCell}>{b.hospital ? `${b.hospital}, ` : ''}{b.district}, {b.state}</td>
                            <td>
                              <span className={styles.urgencyPill} style={{
                                background: URGENCY_COLORS[b.urgency] + '22',
                                color: URGENCY_COLORS[b.urgency],
                                borderColor: URGENCY_COLORS[b.urgency] + '55'
                              }}>{b.urgency}</span>
                            </td>
                            <td>
                              <span className={styles.statusPill} style={{
                                background: STATUS_COLORS[b.status] + '22',
                                color: STATUS_COLORS[b.status],
                                borderColor: STATUS_COLORS[b.status] + '55'
                              }}>{b.status}</span>
                            </td>
                            <td className={styles.center}>{(b.responses || []).length}</td>
                            <td className={styles.timeCell}>{timeAgo(b.createdAt)}</td>
                            <td>
                              {b.status === 'active' && (
                                <button className={styles.cancelBtn} onClick={() => cancelBroadcast(b._id)}>Cancel</button>
                              )}
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                <div className={styles.pagination}>
                  <button disabled={bcPage <= 1} onClick={() => fetchBroadcasts(bcPage - 1)}>← Prev</button>
                  <span>Page {bcPage} of {bcPages}</span>
                  <button disabled={bcPage >= bcPages} onClick={() => fetchBroadcasts(bcPage + 1)}>Next →</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ EVENTS ══ */}
        {tab === 'events' && (
          <>
            <div className={styles.tableControls}>
              <span className={styles.totalCount}>{evTotal} events</span>
              <button className={styles.refreshBtn} onClick={() => fetchEvents(1)}>↻ Refresh</button>
            </div>
            {evLoading ? <div className={styles.loading}><div className={styles.spinner} /></div> : (
              <>
                <div className={styles.tableWrap}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Title</th><th>Organizer</th><th>Location</th>
                        <th>Date</th><th>Attendees</th><th>Status</th><th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.length === 0
                        ? <tr><td colSpan={7} className={styles.emptyCell}>No events found</td></tr>
                        : events.map(ev => (
                          <tr key={ev._id}>
                            <td className={styles.nameCell}>{ev.title}</td>
                            <td>{ev.organizer || '—'}</td>
                            <td className={styles.locCell}>{[ev.venue, ev.district, ev.state].filter(Boolean).join(', ') || '—'}</td>
                            <td className={styles.timeCell}>{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</td>
                            <td className={styles.center}>{(ev.attendees || []).length}{ev.targetDonors ? ` / ${ev.targetDonors}` : ''}</td>
                            <td>
                              <span className={styles.statusPill} style={{
                                background: '#e3f2fd', color: '#1565c0', borderColor: '#90caf9'
                              }}>{ev.status || 'upcoming'}</span>
                            </td>
                            <td>
                              <button className={styles.deleteBtn} onClick={() => deleteEvent(ev._id, ev.title)}>Del</button>
                            </td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>
                <div className={styles.pagination}>
                  <button disabled={evPage <= 1} onClick={() => fetchEvents(evPage - 1)}>← Prev</button>
                  <span>Page {evPage} of {evPages}</span>
                  <button disabled={evPage >= evPages} onClick={() => fetchEvents(evPage + 1)}>Next →</button>
                </div>
              </>
            )}
          </>
        )}

        {/* ══ ANNOUNCE ══ */}
        {tab === 'announce' && (
          <div className={styles.announceWrap}>
            <div className={styles.announceCard}>
              <h3 className={styles.cardTitle}>📣 System Announcement</h3>
              <p className={styles.announceSub}>
                Sends an in-app notification to <strong>all registered users</strong> instantly.
                Use for urgent blood camps, system updates, or critical alerts.
              </p>

              <div className={styles.announceField}>
                <label>Title <span className={styles.charHint}>{annTitle.length}/80</span></label>
                <input className={styles.announceInput}
                  placeholder="e.g. Urgent Blood Camp at Apollo Hospital"
                  value={annTitle} onChange={e => setAnnTitle(e.target.value)} maxLength={80} />
              </div>

              <div className={styles.announceField}>
                <label>Message <span className={styles.charHint}>{annBody.length}/300</span></label>
                <textarea className={styles.announceTextarea}
                  placeholder="Write your announcement here…"
                  value={annBody} onChange={e => setAnnBody(e.target.value)}
                  maxLength={300} rows={5} />
              </div>

              {annResult && (
                <div className={`${styles.announceResult} ${annResult.startsWith('✅') ? styles.resultOk : styles.resultErr}`}>
                  {annResult}
                </div>
              )}

              <button className={styles.announceBtn} onClick={sendAnnouncement}
                disabled={annSending || !annTitle.trim() || !annBody.trim()}>
                {annSending ? '⏳ Sending…' : '📣 Send to All Users'}
              </button>
            </div>

            <div className={styles.announceTips}>
              <h4>📋 Best Practices</h4>
              <ul>
                <li>Keep titles short and action-oriented</li>
                <li>Include location and time for blood camps</li>
                <li>Avoid more than 2–3 announcements per day</li>
                <li>Push notifications also fire if users subscribed</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
