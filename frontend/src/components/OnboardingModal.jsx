import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingModal.module.css';
import { INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';
import { useLanguage } from '../context/LanguageContext';

import API_BASE from '../config/api.js';
const API = API_BASE;
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function OnboardingModal({ onDone }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [step, setStep] = useState(1); // 1=welcome, 2=blood group, 3=location
  const [bloodGroup, setBloodGroup] = useState('');
  const [state, setState] = useState('');
  const [district, setDistrict] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API}/api/users/profile`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bloodGroup, state, district }),
      });
      if (res.ok) {
        const data = await res.json();
        const stored = JSON.parse(localStorage.getItem('user') || '{}');
        localStorage.setItem('user', JSON.stringify({ ...stored, bloodGroup, state, district }));
      }
    } catch { /* ignore */ }
    setSaving(false);
    onDone();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>

        {/* Progress dots */}
        <div className={styles.dots}>
          {[1,2,3].map(s => <span key={s} className={`${styles.dot} ${step >= s ? styles.dotOn : ''}`} />)}
        </div>

        {step === 1 && (
          <div className={styles.step}>
            <div className={styles.heroIcon}>❤️</div>
            <h2 className={styles.title}>{t('onboardWelcome')}</h2>
            <p className={styles.desc}>{t('onboardWelcomeDesc')}</p>
            <div className={styles.highlights}>
              <div className={styles.highlight}><span>📡</span><span>{t('onboardHighlight1')}</span></div>
              <div className={styles.highlight}><span>🩸</span><span>{t('onboardHighlight2')}</span></div>
              <div className={styles.highlight}><span>🗺️</span><span>{t('onboardHighlight3')}</span></div>
            </div>
            <button className={styles.primary} onClick={() => setStep(2)}>{t('onboardSetup')}</button>
            <button className={styles.skip} onClick={onDone}>{t('onboardSkip')}</button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <div className={styles.heroIcon}>🩸</div>
            <h2 className={styles.title}>{t('onboardBloodTitle')}</h2>
            <p className={styles.desc}>{t('onboardBloodDesc')}</p>
            <div className={styles.bgGrid}>
              {BLOOD_GROUPS.map(bg => (
                <button
                  key={bg}
                  className={`${styles.bgBtn} ${bloodGroup === bg ? styles.bgBtnOn : ''}`}
                  onClick={() => setBloodGroup(bg)}
                >{bg}</button>
              ))}
            </div>
            <button className={styles.primary} disabled={!bloodGroup} onClick={() => setStep(3)}>
              {t('onboardContinue')}
            </button>
            <button className={styles.skip} onClick={() => setStep(3)}>{t('onboardDontKnow')}</button>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <div className={styles.heroIcon}>📍</div>
            <h2 className={styles.title}>{t('onboardLocationTitle')}</h2>
            <p className={styles.desc}>{t('onboardLocationDesc')}</p>
            <div className={styles.field}>
              <label>{t('state')}</label>
              <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }}>
                <option value="">{t('onboardSelectState')}</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {state && (
              <div className={styles.field}>
                <label>{t('district')}</label>
                <select value={district} onChange={e => setDistrict(e.target.value)}>
                  <option value="">{t('onboardSelectDist')}</option>
                  {(DISTRICTS_BY_STATE[state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <button className={styles.primary} onClick={save} disabled={saving}>
              {saving ? t('onboardSaving') : t('onboardComplete')}
            </button>
            <button className={styles.skip} onClick={onDone}>{t('onboardSkip2')}</button>
          </div>
        )}
      </div>
    </div>
  );
}
