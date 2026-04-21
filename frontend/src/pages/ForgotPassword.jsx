import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Auth.module.css';
import BrandLogo from '../components/BrandLogo';
import { useTheme } from '../context/ThemeContext';
import PhoneInput, { toApiPhone } from '../components/PhoneInput';
import API_BASE from '../config/api.js';

const API = API_BASE;

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();

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
      {/* Theme toggle */}
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        style={{
          position: 'fixed', top: '1rem', right: '1rem',
          background: 'var(--card-bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '0.35rem 0.55rem',
          fontSize: '1.1rem', cursor: 'pointer', lineHeight: 1, zIndex: 10,
        }}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div className={styles.card}>
        {/* Brand header */}
        <div className={styles.logo}>
          <BrandLogo size={72} pulse />
          <h1 className={styles.brand}>LifeLink</h1>
          <p className={styles.tagline}>Dynamic Real-Time Emergency Network</p>
        </div>

        {/* ── Step 1: Enter phone ── */}
        {step === 'phone' && (
          <>
            <h2 className={styles.title}>Forgot password?</h2>
            <p className={styles.subtitle}>Enter your registered phone number to receive an OTP</p>

            <form onSubmit={handleSendOtp} className={styles.form}>
              <div className={styles.field}>
                <label>Phone Number</label>
                <PhoneInput value={phone} onChange={setPhone} required />
              </div>

              {phoneError && <p className={styles.error}>{phoneError}</p>}

              <button type="submit" className={styles.btn} disabled={phoneBusy}>
                {phoneBusy ? 'Sending OTP…' : 'Send OTP'}
              </button>
            </form>

            <p className={styles.switch}>
              Remember your password? <Link to="/login">Sign In</Link>
            </p>
          </>
        )}

        {/* ── Step 2: Verify OTP ── */}
        {step === 'otp' && (
          <>
            <div className={styles.otpIcon}>🔐</div>
            <h2 className={styles.title}>Enter OTP</h2>
            <p className={styles.subtitle}>
              OTP sent to <strong>{maskPhone(apiPhone)}</strong>
              <br />
              <span className={styles.otpHint}>⏱ OTP expires in 5 minutes</span>
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
                {otpLoading ? 'Verifying…' : 'Verify OTP'}
              </button>

              <button
                type="button"
                className={styles.resendBtn}
                onClick={handleResend}
                disabled={countdown > 0 || resending}
              >
                {resending
                  ? 'Resending…'
                  : countdown > 0
                    ? `Resend OTP (${countdown}s)`
                    : 'Resend OTP'}
              </button>

              <button
                type="button"
                className={styles.skipBtn}
                onClick={() => setStep('phone')}
              >
                Back
              </button>
            </form>
          </>
        )}

        {/* ── Step 3: New password ── */}
        {step === 'reset' && (
          <>
            <h2 className={styles.title}>Set new password</h2>
            <p className={styles.subtitle}>Choose a strong password for your account</p>

            <form onSubmit={handleReset} className={styles.form}>
              <div className={styles.field}>
                <label htmlFor="newPassword">New Password</label>
                <input
                  id="newPassword"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); setResetError(''); }}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setResetError(''); }}
                  required
                  autoComplete="new-password"
                />
              </div>

              {resetError  && <p className={styles.error}>{resetError}</p>}
              {successMsg  && <p className={styles.resendMsg}>{successMsg}</p>}

              <button type="submit" className={styles.btn} disabled={resetBusy || !!successMsg}>
                {resetBusy ? 'Resetting…' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
