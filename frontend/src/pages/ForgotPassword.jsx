import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import PhoneInput, { toApiPhone } from '../components/PhoneInput';
import API_BASE from '../config/api.js';

const API = API_BASE;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, t } = useLanguage();

  // step: 'phone' | 'otp' | 'reset'
  const [step, setStep]             = useState('phone');
  const [apiPhone, setApiPhone]     = useState('');
  const [resetToken, setResetToken] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // ── Step 1 state ─────────────────────────────────────────────────────────────
  const [phone, setPhone]       = useState({ countryCode: '+91', number: '' });
  const [phoneError, setPhoneError] = useState('');
  const [phoneBusy, setPhoneBusy]   = useState(false);

  // ── Step 2 state ─────────────────────────────────────────────────────────────
  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError]     = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resending, setResending]   = useState(false);
  const [resendMsg, setResendMsg]   = useState('');
  const [countdown, setCountdown]   = useState(30);
  const inputs = useRef([]);

  // ── Step 3 state ─────────────────────────────────────────────────────────────
  const [newPassword, setNewPassword]         = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError]           = useState('');
  const [resetBusy, setResetBusy]             = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const startCountdown = () => {
    setCountdown(30);
    const id = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(id); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const maskPhone = (p) => p.replace(/(\+\d{1,3})(\d{2})(\d+)(\d{4})/, '$1 $2XXXXX$4');

  // ── Step 1: send OTP ──────────────────────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setPhoneError('');
    setPhoneBusy(true);

    const formatted = toApiPhone(phone);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formatted }),
      });
      const data = await res.json();
      if (!res.ok) { setPhoneError(data.message || 'Failed to send OTP'); return; }

      setApiPhone(formatted);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setResendMsg('');
      startCountdown();
      setStep('otp');
    } catch {
      setPhoneError('Unable to connect to server. Please try again.');
    } finally {
      setPhoneBusy(false);
    }
  };

  // ── Step 2: OTP box handlers ──────────────────────────────────────────────────
  const handleOtpKey = (i, e) => {
    const val = e.target.value.replace(/\D/, '');
    if (!val) {
      const next = [...otp]; next[i] = '';
      setOtp(next);
      if (i > 0) inputs.current[i - 1]?.focus();
      return;
    }
    const next = [...otp]; next[i] = val.slice(-1);
    setOtp(next);
    if (i < 5) inputs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      inputs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setOtpError('Please enter the 6-digit OTP'); return; }
    setOtpLoading(true); setOtpError('');
    try {
      const res = await fetch(`${API}/api/auth/verify-forgot-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: apiPhone, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) { setOtpError(data.message || 'OTP verification failed'); return; }
      setResetToken(data.resetToken);
      setStep('reset');
    } catch {
      setOtpError('Verification failed. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || resending) return;
    setResending(true); setResendMsg(''); setOtpError('');
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: apiPhone }),
      });
      const data = await res.json();
      setResendMsg(data.message || 'OTP resent');
      startCountdown();
    } catch {
      setResendMsg('Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Step 3: reset password ────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setResetError('');

    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match'); return;
    }

    setResetBusy(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.message || 'Password reset failed'); return; }
      setSuccessMsg(data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login', { state: { successMsg: 'Password reset! Please log in.' } }), 1800);
    } catch {
      setResetError('Unable to connect to server. Please try again.');
    } finally {
      setResetBusy(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className={styles.page}>
      {/* Theme + language toggles */}
      <div style={{ position:'fixed', top:'1rem', right:'1rem', display:'flex', gap:'0.5rem', zIndex:10 }}>
        <button
          onClick={toggleLang}
          title={lang === 'en' ? t('switchToTamil') : t('switchToEnglish')}
          style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:8,
            padding:'0.35rem 0.55rem', cursor:'pointer', fontSize:'0.78rem',
            fontWeight:700, color:'var(--text)', lineHeight:1 }}
        >
          {lang === 'en' ? 'தமிழ்' : 'EN'}
        </button>
        <button
          onClick={toggle}
          aria-label="Toggle theme"
          style={{ background:'var(--card-bg)', border:'1px solid var(--border)', borderRadius:8,
            padding:'0.35rem 0.55rem', fontSize:'1.1rem', cursor:'pointer', lineHeight:1 }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className={styles.card}>
        {/* Brand header */}
        <div className={styles.logo}>
          <BrandLogo size={72} pulse />
          <h1 className={styles.brand}>LifeLink</h1>
          <p className={styles.tagline}>{t('tagline')}</p>
        </div>

        {/* ── Step 1: Enter phone ── */}
        {step === 'phone' && (
          <>
            <h2 className={styles.title}>{t('forgotPasswordTitle')}</h2>
            <p className={styles.subtitle}>{t('forgotPasswordSub')}</p>

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.field}>
                <label>{t('phone')}</label>
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>

              {phoneError && <p className={styles.error}>{phoneError}</p>}

              <button type="submit" className={styles.btn} disabled={phoneBusy}>
                {phoneBusy ? t('sendingOtp') : t('sendOtp')}
              </button>
            </form>

            <p className={styles.switch}>
              <Link to="/login">{t('backToLogin')}</Link>
            </p>
          </>
        )}

        {/* ── Step 2: Verify OTP ── */}
        {step === 'otp' && (
          <>
            <div className={styles.otpIcon}>🔐</div>
            <h2 className={styles.title}>{t('verifyOtpTitle')}</h2>
            <p className={styles.subtitle}>
              {t('otpSentTo')} <strong>{maskPhone(apiPhone)}</strong>
              <br />
              <span className={styles.otpHint}>{t('otpExpiry')}</span>
            </p>

            <form onSubmit={handleVerifyOtp} className={styles.form}>
              <div className={styles.otpBoxes} onPaste={handlePaste}>
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputs.current[i] = el}
                    className={styles.otpBox}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpKey(i, e)}
                    onKeyDown={e => {
                      if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus();
                    }}
                    autoFocus={i === 0}
                  />
                ))}
              </div>

              {otpError  && <p className={styles.error}>{otpError}</p>}
              {resendMsg && <p className={styles.resendMsg}>{resendMsg}</p>}

              <button
                type="submit"
                className={styles.btn}
                disabled={otpLoading || otp.join('').length < 6}
              >
                {otpLoading ? t('verifying') : t('verifyOtpTitle')}
              </button>

              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={countdown > 0 || resending}
              >
                {resending
                  ? t('resending')
                  : countdown > 0
                    ? `${t('resendOtp')} (${countdown}s)`
                    : t('resendOtp')}
              </button>

              <button
                type="button"
                className={styles.skipBtn}
                onClick={() => setStep('phone')}
              >
                {t('backToLogin')}
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === 'reset' && (
          <>
            <h2 className={styles.title}>{t('resetPasswordTitle')}</h2>
            <p className={styles.subtitle}>{t('resetPasswordSub')}</p>

            <form onSubmit={handleReset} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="newPassword">{t('newPasswordLabel')}</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder={t('minPassword')}
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder={t('confirmPasswordPh')}
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }}
                  required
                  autoComplete="new-password"
                />
              </div>

              {resetError  && <p className={styles.error}>{resetError}</p>}
              {successMsg  && <p className={styles.resendMsg}>{successMsg}</p>}

              <button type="submit" className={styles.btn} disabled={resetBusy || !!successMsg}>
                {resetBusy ? t('resettingBtn') : t('resetBtn')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
