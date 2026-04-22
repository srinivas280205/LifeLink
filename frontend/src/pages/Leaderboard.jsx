import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import styles from './Leaderboard.module.css';
import { SkeletonLeaderRow } from '../components/Skeleton';
import { useLanguage } from '../context/LanguageContext';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');

const RANK_ICONS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const BG_COLORS  = {
  'O-': '#b71c1c', 'O+': '#c62828', 'A-': '#1565c0', 'A+': '#1976d2',
  'B-': '#2e7d32', 'B+': '#388e3c', 'AB-': '#4a148c', 'AB+': '#6a1b9a',
};

function getBadge(count, t) {
  if (count >= 20) return { icon: '🏆', label: t('badgeLegend'), color: '#f57f17' };
  if (count >= 10) return { icon: '⭐', label: t('badgeHero'),   color: '#d32f2f' };
  if (count >= 5)  return { icon: '💪', label: t('badgeActive'), color: '#1976d2' };
  return                  { icon: '🩸', label: t('badgeDonor'),  color: '#388e3c' };
}

export default function Leaderboard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const me = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token()) { navigate('/login'); return; }
    fetch(`${API}/api/leaderboard`, { headers: { Authorization: `Bearer ${token()}` } })
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [navigate]);

  return (
    <AppShell connected={true}>
      <div className={styles.page}>
        <div className={styles.inner}>

          {/* Header */}
          <div className={styles.header}>
            <h1 className={styles.title}>{t('leaderboardTitle')}</h1>
            <p className={styles.sub}>{t('leaderboardSub')}</p>
          </div>

          {/* Platform stats bar */}
          {data?.stats && (
            <div className={styles.statsBar}>
              <div className={styles.statItem}>
                <span className={styles.statVal}>{data.stats.totalDonors}</span>
                <span className={styles.statLbl}>{t('activeDonors')}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statVal}>{data.stats.totalResponses}</span>
                <span className={styles.statLbl}>{t('totalResponses')}</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.statItem}>
                <span className={styles.statVal}>{data.stats.fulfilledCount}</span>
                <span className={styles.statLbl}>{t('livesSaved')}</span>
              </div>
            </div>
          )}

          {loading && (
            <div style={{ padding: '0.5rem 0' }}>
              {Array.from({ length: 8 }).map((_, i) => <SkeletonLeaderRow key={i} />)}
            </div>
          )}

          {!loading && data?.leaderboard?.length === 0 && (
            <div className={styles.empty}>
              <span className={styles.emptyIcon}>🏆</span>
              <p>{t('noDonors')}</p>
              <p className={styles.emptySub}>{t('beFirst')}</p>
            </div>
          )}

          {/* Top 3 podium */}
          {!loading && data?.leaderboard?.length > 0 && (
            <>
              <div className={styles.podium}>
                {[data.leaderboard[1], data.leaderboard[0], data.leaderboard[2]]
                  .filter(Boolean)
                  .map((donor, i) => {
                    const pos = [2, 1, 3][i];
                    const badge = getBadge(donor.donationsGiven, t);
                    const isMe = donor.donorId === (me.id || me._id);
                    return (
                      <div
                        key={donor.donorId}
                        className={`${styles.podiumCard} ${styles[`pos${pos}`]} ${isMe ? styles.isMe : ''}`}
                      >
                        <div className={styles.podiumRank}>{RANK_ICONS[pos] || `#${pos}`}</div>
                        <div
                          className={styles.podiumAvatar}
                          style={{ background: BG_COLORS[donor.bloodGroup] || '#c62828' }}
                        >
                          {donor.bloodGroup}
                        </div>
                        <p className={styles.podiumName}>
                          {donor.donorName.split(' ')[0]}
                          {isMe && <span className={styles.youBadge}> ({t('you')})</span>}
                        </p>
                        <p className={styles.podiumCount}>
                          {donor.donationsGiven}
                          <span> {t('donations')}</span>
                        </p>
                        <span className={styles.badgePill} style={{ color: badge.color }}>
                          {badge.icon} {badge.label}
                        </span>
                      </div>
                    );
                  })}
              </div>

              {/* Full ranked list */}
              <div className={styles.list}>
                {data.leaderboard.map((donor) => {
                  const badge = getBadge(donor.donationsGiven, t);
                  const isMe  = donor.donorId === (me.id || me._id);
                  return (
                    <div key={donor.donorId} className={`${styles.row} ${isMe ? styles.rowMe : ''}`}>
                      <span className={styles.rowRank}>
                        {RANK_ICONS[donor.rank] || `#${donor.rank}`}
                      </span>
                      <div
                        className={styles.rowAvatar}
                        style={{ background: BG_COLORS[donor.bloodGroup] || '#c62828' }}
                      >
                        {donor.bloodGroup}
                      </div>
                      <div className={styles.rowInfo}>
                        <span className={styles.rowName}>
                          {donor.donorName}
                          {isMe && <span className={styles.youBadge}> ({t('you')})</span>}
                        </span>
                        <span className={styles.rowLocation}>
                          {[donor.district, donor.state].filter(Boolean).join(', ') || 'India'}
                        </span>
                      </div>
                      <div className={styles.rowRight}>
                        <span className={styles.rowBadge} style={{ color: badge.color }}>
                          {badge.icon} {badge.label}
                        </span>
                        <span className={styles.rowCount}>
                          {donor.donationsGiven} <span>{t('donations')}</span>
                        </span>
                      </div>
                      <span className={`${styles.availDot} ${donor.isAvailable ? styles.availOn : styles.availOff}`} />
                    </div>
                  );
                })}
              </div>

              <p className={styles.footnote}>
                {t('rankingsNote')}
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
