import { useState } from 'react';
import styles from './EligibilityChecker.module.css';

const QUESTIONS = [
  { id: 'age',        label: 'Are you between 18 and 65 years old?',                    disqualify: false },
  { id: 'weight',     label: 'Do you weigh at least 50 kg (110 lbs)?',                  disqualify: false },
  { id: 'healthy',    label: 'Are you feeling well and in good health today?',           disqualify: false },
  { id: 'lastDonate', label: 'Has it been at least 56 days since your last blood donation?', disqualify: false },
  { id: 'noFever',    label: 'Have you been fever-free for the last 7 days?',            disqualify: false },
  { id: 'noMeds',     label: 'Are you NOT on antibiotics or blood thinners?',            disqualify: false },
  { id: 'noPregnant', label: 'Are you NOT currently pregnant or breastfeeding?',         disqualify: false },
  { id: 'noTattoo',   label: 'Have you NOT gotten a tattoo/piercing in the last 6 months?', disqualify: false },
  { id: 'noSurgery',  label: 'Have you NOT had surgery in the last 6 months?',           disqualify: false },
  { id: 'noMalaria',  label: 'Have you NOT had malaria in the last 3 years?',            disqualify: false },
];

export default function EligibilityChecker({ onClose }) {
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = QUESTIONS.every(q => answers[q.id] !== undefined);
  const eligible = allAnswered && QUESTIONS.every(q => answers[q.id] === true);
  const failedQ  = QUESTIONS.filter(q => answers[q.id] === false);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <span className={styles.title}>🩸 Donation Eligibility Check</span>
          <button className={styles.close} onClick={onClose}>✕</button>
        </div>

        {!submitted ? (
          <>
            <p className={styles.intro}>Answer all questions honestly to check if you can donate blood today.</p>
            <div className={styles.questions}>
              {QUESTIONS.map((q, i) => (
                <div key={q.id} className={styles.qRow}>
                  <p className={styles.qText}><span className={styles.qNum}>{i + 1}.</span> {q.label}</p>
                  <div className={styles.qBtns}>
                    <button
                      className={`${styles.qBtn} ${answers[q.id] === true ? styles.qYes : ''}`}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: true }))}
                    >Yes</button>
                    <button
                      className={`${styles.qBtn} ${answers[q.id] === false ? styles.qNo : ''}`}
                      onClick={() => setAnswers(a => ({ ...a, [q.id]: false }))}
                    >No</button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className={styles.checkBtn}
              disabled={!allAnswered}
              onClick={() => setSubmitted(true)}
            >
              Check My Eligibility →
            </button>
          </>
        ) : (
          <div className={styles.result}>
            {eligible ? (
              <>
                <div className={styles.resultIcon}>✅</div>
                <h2 className={styles.resultTitle}>You're Eligible!</h2>
                <p className={styles.resultMsg}>
                  Based on your answers, you appear to be eligible to donate blood today.
                  Visit your nearest blood bank or join an upcoming <strong>Blood Drive Event</strong> to donate.
                </p>
                <div className={styles.tips}>
                  <p className={styles.tipsTitle}>Before you donate:</p>
                  <ul>
                    <li>Drink plenty of water beforehand</li>
                    <li>Eat a healthy meal 2–3 hours before</li>
                    <li>Wear comfortable, loose-fitting clothing</li>
                    <li>Carry a valid ID</li>
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className={styles.resultIcon}>❌</div>
                <h2 className={styles.resultTitle} style={{ color: '#d32f2f' }}>Not Eligible Right Now</h2>
                <p className={styles.resultMsg}>Based on your answers, you may not be eligible to donate at this time.</p>
                {failedQ.length > 0 && (
                  <div className={styles.failList}>
                    <p className={styles.tipsTitle}>Reason(s):</p>
                    <ul>
                      {failedQ.map(q => <li key={q.id}>{q.label}</li>)}
                    </ul>
                  </div>
                )}
                <p className={styles.resultSub}>Conditions may be temporary — check again once your situation changes. Consult a doctor if unsure.</p>
              </>
            )}
            <button className={styles.checkBtn} onClick={() => { setAnswers({}); setSubmitted(false); }}>
              ↩ Check Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
