import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import styles from './DonorSearch.module.css';
import { INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';
import { BLOOD_BANKS, BLOOD_BANK_STATES, filterBloodBanks } from '../data/bloodBanks';
import { useLanguage } from '../context/LanguageContext';

import API_BASE from '../config/api.js';
const API = API_BASE;
const token = () => localStorage.getItem('token');

// Show phone as 934XXXXX19 — real but not fully visible
function maskPhone(phone) {
  if (!phone) return '—';
  const digits = phone.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  if (last10.length < 10) return phone;
  const prefix = phone.startsWith('+') ? phone.slice(0, phone.length - 10).trim() + ' ' : '';
  return `${prefix}${last10.slice(0, 3)}XXXXX${last10.slice(8)}`;
}

const BLOOD_GROUPS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
  'A1+', 'A1-', 'A2+', 'A2-',
  'A1B+', 'A1B-', 'A2B+', 'A2B-',
  'Bombay (hh)', 'Oh+', 'Oh-',
];

const COMPATIBLE_DONORS = {
  'A+':  ['A+','A-','O+','O-'],
  'A-':  ['A-','O-'],
  'B+':  ['B+','B-','O+','O-'],
  'B-':  ['B-','O-'],
  'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
  'AB-': ['A-','B-','AB-','O-'],
  'O+':  ['O+','O-'],
  'O-':  ['O-'],
};

const DONOR_CAN_GIVE_TO = {
  'A+':  ['A+','AB+'],
  'A-':  ['A+','A-','AB+','AB-'],
  'B+':  ['B+','AB+'],
  'B-':  ['B+','B-','AB+','AB-'],
  'AB+': ['AB+'],
  'AB-': ['AB+','AB-'],
  'O+':  ['O+','A+','B+','AB+'],
  'O-':  ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
};

const TYPE_COLORS = {
  'Government': { bg: '#e3f2fd', color: '#1565c0', border: '#90caf9' },
  'Red Cross':  { bg: '#fce4ec', color: '#c62828', border: '#ef9a9a' },
  'Hospital':   { bg: '#e8f5e9', color: '#2e7d32', border: '#a5d6a7' },
};

export default function DonorSearch() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('donors');

  // ── Donors tab state
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ bloodGroup: '', state: '', district: '', compatible: false });
  const [searched, setSearched] = useState(false);
  const districts = filters.state ? (DISTRICTS_BY_STATE[filters.state] || []) : [];

  const search = async () => {
    setLoading(true);
    setSearched(true);
    try {
      const params = new URLSearchParams();
      if (filters.state)    params.set('state',    filters.state);
      if (filters.district) params.set('district', filters.district);
      const res = await fetch(`${API}/api/users/donors?${params}`, {
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (res.ok) {
        let data = await res.json();
        if (filters.bloodGroup) {
          if (filters.compatible) {
            const compatibleGroups = COMPATIBLE_DONORS[filters.bloodGroup] || [];
            data = data.filter(d => compatibleGroups.includes(d.bloodGroup));
          } else {
            data = data.filter(d => d.bloodGroup === filters.bloodGroup);
          }
        }
        setDonors(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { search(); }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(f => ({
      ...f,
      [key]: value,
      ...(key === 'state' ? { district: '' } : {}),
    }));
  };

  // ── Blood Banks tab state
  const [bbState, setBbState]       = useState('');
  const [bbDistrict, setBbDistrict] = useState('');
  const [bbType, setBbType]         = useState('');
  const bbDistricts = bbState ? [...new Set(BLOOD_BANKS.filter(b => b.state === bbState).map(b => b.district))].sort() : [];
  const filteredBanks = filterBloodBanks(bbState, bbDistrict).filter(b => !bbType || b.type === bbType);

  return (
    <AppShell connected={true}>
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>{t('findHelp')}</h1>
            <p className={styles.pageSubtitle}>{t('findHelpSub')}</p>
          </div>

          {/* Tab toggle */}
          <div className={styles.tabRow}>
            <button
              className={`${styles.tabBtn} ${tab === 'donors' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('donors')}
            >
              {t('donors')}
            </button>
            <button
              className={`${styles.tabBtn} ${tab === 'banks' ? styles.tabBtnActive : ''}`}
              onClick={() => setTab('banks')}
            >
              {t('bloodBanks')}
            </button>
          </div>

          {/* ══ DONORS TAB ══ */}
          {tab === 'donors' && (
            <>
              <div className={styles.filterBar}>
                <div className={styles.filterField}>
                  <label>{t('bloodGroup')}</label>
                  <select value={filters.bloodGroup} onChange={e => handleFilterChange('bloodGroup', e.target.value)}>
                    <option value="">{t('allGroups')}</option>
                    {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label>{t('stateUT')}</label>
                  <select value={filters.state} onChange={e => handleFilterChange('state', e.target.value)}>
                    <option value="">{t('allStates')}</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label>{t('district')}</label>
                  <select value={filters.district} onChange={e => handleFilterChange('district', e.target.value)} disabled={!filters.state}>
                    <option value="">{filters.state ? t('allDistricts') : t('selectStateFirst')}</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {filters.bloodGroup && (
                  <label className={styles.compatToggle}>
                    <input type="checkbox" checked={filters.compatible}
                      onChange={e => handleFilterChange('compatible', e.target.checked)} />
                    <span>{t('showCompatible')}</span>
                  </label>
                )}
                <div className={styles.resultCount}>
                  {searched && !loading && (
                    <span>{donors.length} {t('donors').replace('🩸 ', '')}</span>
                  )}
                </div>
              </div>

              {loading ? (
                <div className={styles.loadingRow}>
                  <div className={styles.spinner} />
                  <span>{t('searchingDonors')}</span>
                </div>
              ) : donors.length === 0 && searched ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🩸</span>
                  <p>{t('noDonorsFound')}</p>
                  <p className={styles.emptySub}>{t('tryChangingFilters')}</p>
                </div>
              ) : (
                <div className={styles.grid}>
                  {donors.map(donor => (
                    <div key={donor._id} className={styles.donorCard}>
                      <div className={styles.cardTop}>
                        <div className={styles.bloodCircle}>{donor.bloodGroup}</div>
                        <div className={styles.donorInfo}>
                          <p className={styles.donorName}>{donor.fullName}</p>
                          <p className={styles.donorCity}>
                            📍 {donor.district || donor.state
                              ? [donor.district, donor.state].filter(Boolean).join(', ')
                              : t('locationNotSet')}
                          </p>
                        </div>
                        <span className={styles.availBadge}>● Available</span>
                      </div>
                      <div className={styles.contactRow}>
                        <span className={styles.maskedPhone}>📞 {maskPhone(donor.phone)}</span>
                        {donor.phone && (
                          <a
                            href={`tel:${donor.phone}`}
                            className={styles.callBtn}
                          >
                            📞 Call
                          </a>
                        )}
                      </div>
                      <div className={styles.compatRow}>
                        <span className={styles.compatLabel}>{t('canDonateTo2')}</span>
                        <div className={styles.compatPills}>
                          {(DONOR_CAN_GIVE_TO[donor.bloodGroup] || []).map(bg => (
                            <span key={bg} className={styles.pill}>{bg}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ══ BLOOD BANKS TAB ══ */}
          {tab === 'banks' && (
            <>
              <div className={styles.filterBar}>
                <div className={styles.filterField}>
                  <label>{t('stateUT')}</label>
                  <select value={bbState} onChange={e => { setBbState(e.target.value); setBbDistrict(''); }}>
                    <option value="">{t('allStates')}</option>
                    {BLOOD_BANK_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label>{t('district')}</label>
                  <select value={bbDistrict} onChange={e => setBbDistrict(e.target.value)} disabled={!bbState}>
                    <option value="">{bbState ? t('allDistricts') : t('selectStateFirst')}</option>
                    {bbDistricts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label>{t('bankType')}</label>
                  <select value={bbType} onChange={e => setBbType(e.target.value)}>
                    <option value="">{t('allTypes')}</option>
                    <option value="Government">{t('government')}</option>
                    <option value="Red Cross">{t('redCross')}</option>
                    <option value="Hospital">{t('hospital')}</option>
                  </select>
                </div>
                <div className={styles.resultCount}>
                  <span>{filteredBanks.length} {t('bloodBanks').replace('🏥 ', '')}</span>
                </div>
              </div>

              {filteredBanks.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🏥</span>
                  <p>{t('noBanksFound')}</p>
                  <p className={styles.emptySub}>{t('tryDiffArea')}</p>
                </div>
              ) : (
                <div className={styles.bbGrid}>
                  {filteredBanks.map(bank => {
                    const typeStyle = TYPE_COLORS[bank.type] || TYPE_COLORS['Government'];
                    return (
                      <div key={bank.id} className={styles.bbCard}>
                        <div className={styles.bbCardTop}>
                          <span className={styles.bbIcon}>🏥</span>
                          <div className={styles.bbInfo}>
                            <p className={styles.bbName}>{bank.name}</p>
                            <p className={styles.bbLocation}>📍 {bank.district}, {bank.state}</p>
                          </div>
                          <span
                            className={styles.bbTypeBadge}
                            style={{ background: typeStyle.bg, color: typeStyle.color, borderColor: typeStyle.border }}
                          >
                            {bank.type}
                          </span>
                        </div>

                        <p className={styles.bbAddress}>🏠 {bank.address}</p>

                        <div className={styles.bbMeta}>
                          <span className={styles.bbHours}>🕐 {bank.hours}</span>
                        </div>

                        <div className={styles.bbActions}>
                          <a href={`tel:${bank.phone}`} className={styles.bbCallBtn}>
                            📞 {bank.phone}
                          </a>
                          <a
                            href={`https://www.google.com/maps/search/${encodeURIComponent(bank.name + ' ' + bank.district)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.bbMapBtn}
                          >
                            🗺️ Map
                          </a>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className={styles.bbDisclaimer}>
                {t('bankDisclaimer')}
              </p>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
