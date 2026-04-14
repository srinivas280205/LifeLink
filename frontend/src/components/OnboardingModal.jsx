import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './OnboardingModal.module.css';
import { INDIA_STATES, DISTRICTS_BY_STATE } from '../data/locationData';

const API = '';
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function OnboardingModal({ onDone }) {
  const navigate = useNavigate();
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
            <h2 className={styles.title}>Welcome to LifeLink!</h2>
            <p className={styles.desc}>
              You're now part of India's emergency blood donor network.<br/>
              Let's set up your profile so we can match you with people who need your help.
            </p>
            <div className={styles.highlights}>
              <div className={styles.highlight}><span>📡</span><span>Get notified about emergency requests</span></div>
              <div className={styles.highlight}><span>🩸</span><span>Your blood group helps save lives</span></div>
              <div className={styles.highlight}><span>🗺️</span><span>Connect with donors near you</span></div>
            </div>
            <button className={styles.primary} onClick={() => setStep(2)}>Let's Set Up My Profile →</button>
            <button className={styles.skip} onClick={onDone}>Skip for now</button>
          </div>
        )}

        {step === 2 && (
          <div className={styles.step}>
            <div className={styles.heroIcon}>🩸</div>
            <h2 className={styles.title}>What's your blood group?</h2>
            <p className={styles.desc}>This helps us alert you when someone nearby needs your specific blood type.</p>
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
              Continue →
            </button>
            <button className={styles.skip} onClick={() => setStep(3)}>I don't know my blood group</button>
          </div>
        )}

        {step === 3 && (
          <div className={styles.step}>
            <div className={styles.heroIcon}>📍</div>
            <h2 className={styles.title}>Where are you located?</h2>
            <p className={styles.desc}>Helps us show nearby requests and connect you with local donors.</p>
            <div className={styles.field}>
              <label>State / UT</label>
              <select value={state} onChange={e => { setState(e.target.value); setDistrict(''); }}>
                <option value="">Select your state</option>
                {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {state && (
              <div className={styles.field}>
                <label>District</label>
                <select value={district} onChange={e => setDistrict(e.target.value)}>
                  <option value="">Select your district</option>
                  {(DISTRICTS_BY_STATE[state] || []).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            )}
            <button className={styles.primary} onClick={save} disabled={saving}>
              {saving ? 'Saving…' : '✅ Complete Setup'}
            </button>
            <button className={styles.skip} onClick={onDone}>Skip</button>
          </div>
        )}
      </div>
    </div>
  );
}
