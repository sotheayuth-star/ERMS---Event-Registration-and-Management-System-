import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../assets/css/9_auth-gm.css';
import './ForgotPasswordPage.css';

const RESERVED_EMAILS = [
  'muonsokea@gmail.com',
  'sansotheayuth@gmail.com',
  'proeungsivly@gmail.com',
  'langsocheat@gmail.com',
];

function loadAttendees() {
  try {
    const a = JSON.parse(localStorage.getItem('erms_attendees') || '[]');
    return Array.isArray(a) ? a : [];
  } catch { return []; }
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [step, setStep]             = useState(1); // 1 email | 2 otp | 3 newpw | 4 success
  const [email, setEmail]           = useState('');
  const [emailErr, setEmailErr]     = useState('');
  const [resetCode, setResetCode]   = useState('');
  const [accountType, setAccType]   = useState(null); // 'attendee' | 'reserved'

  const [otp, setOtp]               = useState(['', '', '', '', '', '']);
  const [otpErr, setOtpErr]         = useState('');
  const otpRefs                     = useRef([]);

  const [newPw, setNewPw]           = useState('');
  const [confirmPw, setConfirmPw]   = useState('');
  const [pwErr, setPwErr]           = useState('');
  const [confirmErr, setConfirmErr] = useState('');
  const [showNew, setShowNew]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const [sending, setSending]       = useState(false);
  const [verifying, setVerifying]   = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [resendLabel, setResendLabel] = useState('Resend code');

  // password strength
  const pwLen  = newPw.length >= 8;
  const pwUp   = /[A-Z]/.test(newPw);
  const pwNum  = /[0-9]/.test(newPw);
  const pwSpec = /[^A-Za-z0-9]/.test(newPw);
  const score  = [pwLen, pwUp, pwNum, pwSpec].filter(Boolean).length;
  const strength = newPw.length === 0 ? '' : score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
  const strengthLabel = { weak: 'Weak', medium: 'Medium', strong: 'Strong' }[strength] || '';

  function dotClass(dotStep) {
    if (step > dotStep) return 'fp-dot completed';
    if (step === dotStep) return 'fp-dot active';
    return 'fp-dot';
  }

  // ── Step 1: send code ───────────────────────────────────────────────────────
  function sendCode() {
    const lower = email.trim().toLowerCase();
    if (!lower || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)) {
      setEmailErr('Please enter a valid email address.'); return;
    }
    const isAttendee = loadAttendees().some(u => (u.email || '').toLowerCase() === lower);
    const isReserved = RESERVED_EMAILS.includes(lower);
    if (!isAttendee && !isReserved) {
      setEmailErr('No account found with this email. Please sign up first.'); return;
    }
    setEmailErr('');
    setAccType(isAttendee ? 'attendee' : 'reserved');
    setSending(true);
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setResetCode(code);
      setOtp(['', '', '', '', '', '']);
      setOtpErr('');
      setSending(false);
      setStep(2);
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }, 1000);
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  function handleOtpChange(idx, val) {
    const digit = val.replace(/[^0-9]/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function handleOtpKeydown(idx, e) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }
  function verifyCode() {
    const code = otp.join('');
    if (code.length !== 6) { setOtpErr('Please enter the complete 6-digit code.'); return; }
    if (code !== resetCode) { setOtpErr('Incorrect code. Check the demo code above and try again.'); return; }
    setOtpErr('');
    setVerifying(true);
    setTimeout(() => {
      setVerifying(false);
      setStep(3);
    }, 700);
  }
  function resendCode() {
    setResendLabel('Sending…');
    setTimeout(() => {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      setResetCode(code);
      setResendLabel('Code resent!');
      setTimeout(() => setResendLabel('Resend code'), 2000);
    }, 900);
  }

  // ── Step 3: reset password ─────────────────────────────────────────────────
  function doReset() {
    if (newPw.length < 8) { setPwErr('Password must be at least 8 characters.'); return; }
    if (newPw !== confirmPw) { setConfirmErr('Passwords do not match.'); return; }
    setPwErr(''); setConfirmErr('');
    setResetting(true);
    setTimeout(() => {
      setResetting(false);
      if (accountType === 'attendee') {
        const list = loadAttendees();
        const lower = email.trim().toLowerCase();
        const idx = list.findIndex(u => (u.email || '').toLowerCase() === lower);
        if (idx !== -1) {
          list[idx].password = newPw;
          localStorage.setItem('erms_attendees', JSON.stringify(list));
        }
        setSuccessMsg('Your password has been updated. You can now sign in with your new password.');
      } else {
        setSuccessMsg('Reset simulated for this demo role account. (Built-in role logins keep their original password.)');
      }
      setStep(4);
    }, 1000);
  }

  function goBack() {
    if (step > 1 && step < 4) setStep(s => s - 1);
    else navigate('/login');
  }

  return (
    <div className="gm-root">
      <header className="gm-header">
        <Link className="gm-logo" to="/" aria-label="Planning Center home">
          <span className="t">Planning</span>
          <span className="b">Center</span>
        </Link>
        <div className="gm-actions">
          <button className="gm-btn ghost" onClick={() => navigate('/register')}>Sign up</button>
          <button className="gm-btn solid" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </header>

      <main className="gm-main">
        <div className="card fp-card">

          <button className="fp-back" onClick={goBack}>
            <i className="ri-arrow-left-line" /> Back to sign in
          </button>

          <div className="fp-lock-badge" aria-hidden="true">
            <i className="ri-lock-2-line" />
          </div>

          <div className="fp-steps">
            <div className={dotClass(1)} />
            <div className={dotClass(2)} />
            <div className={step >= 3 ? (step >= 4 ? 'fp-dot completed' : 'fp-dot active') : 'fp-dot'} />
          </div>

          {/* ── Step 1: Email ── */}
          <div className={`fp-form-step${step === 1 ? ' active' : ''}`}>
            <h1>Forgot password?</h1>
            <p className="sub">No worries — enter your email and we'll send a reset code.</p>
            <div className={`field${emailErr ? ' invalid' : ''}`}>
              <input
                type="email" placeholder=" " autoComplete="email"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendCode(); }}
              />
              <label>Email address</label>
              {emailErr && <div className="field-error">{emailErr}</div>}
            </div>
            <button className={`cta${sending ? ' loading' : ''}`} onClick={sendCode} disabled={sending}>
              <span className="spinner" aria-hidden="true" />
              <span className="label">Send reset code</span>
              <span className="check" aria-hidden="true"><i className="ri-check-line" /></span>
            </button>
          </div>

          {/* ── Step 2: OTP ── */}
          <div className={`fp-form-step${step === 2 ? ' active' : ''}`}>
            <h1>Verify your email</h1>
            <p className="sub">We sent a 6-digit code to <strong>{email}</strong></p>
            <div className="fp-otp-row">
              {otp.map((digit, i) => (
                <input
                  key={i} type="text" inputMode="numeric" className={`fp-otp-input${digit ? ' filled' : ''}`}
                  maxLength={1} value={digit}
                  ref={el => { otpRefs.current[i] = el; }}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeydown(i, e)}
                />
              ))}
            </div>
            {otpErr && <div className="fp-otp-error">{otpErr}</div>}
            <div className="fp-demo-hint">Demo mode — your code is <strong>{resetCode}</strong></div>
            <button className={`cta${verifying ? ' loading' : ''}`} onClick={verifyCode} disabled={verifying} style={{ marginTop: 16 }}>
              <span className="spinner" aria-hidden="true" />
              <span className="label">Verify code</span>
              <span className="check" aria-hidden="true"><i className="ri-check-line" /></span>
            </button>
            <p className="fp-resend">
              Didn't get it?{' '}
              <span className="fp-resend-link" onClick={resendCode}>{resendLabel}</span>
            </p>
          </div>

          {/* ── Step 3: New password ── */}
          <div className={`fp-form-step${step === 3 ? ' active' : ''}`}>
            <h1>Create new password</h1>
            <p className="sub">Your new password must be different from previous ones.</p>
            <div className={`field${pwErr ? ' invalid' : ''}`}>
              <input
                type={showNew ? 'text' : 'password'} placeholder=" " autoComplete="new-password"
                value={newPw} onChange={e => { setNewPw(e.target.value); setPwErr(''); }}
              />
              <label>New password</label>
              <button type="button" className="pw-toggle" aria-label="Toggle password" onClick={() => setShowNew(v => !v)}>
                <i className={showNew ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
              {pwErr && <div className="field-error">{pwErr}</div>}
            </div>
            {newPw.length > 0 && (
              <div className={`pw-strength show ${strength}`}>
                <div className="pw-bars"><span /><span /><span /></div>
                <span className="pw-label">{strengthLabel}</span>
              </div>
            )}
            <div className={`field${confirmErr ? ' invalid' : ''}`}>
              <input
                type={showConfirm ? 'text' : 'password'} placeholder=" " autoComplete="new-password"
                value={confirmPw} onChange={e => { setConfirmPw(e.target.value); setConfirmErr(''); }}
              />
              <label>Confirm password</label>
              <button type="button" className="pw-toggle" aria-label="Toggle confirm" onClick={() => setShowConfirm(v => !v)}>
                <i className={showConfirm ? 'ri-eye-off-line' : 'ri-eye-line'} />
              </button>
              {confirmErr && <div className="field-error">{confirmErr}</div>}
            </div>
            <div className="fp-requirements">
              <div className={`fp-req${pwLen ? ' met' : ''}`}><div className="fp-req-icon"><i className="ri-check-line" /></div><span>At least 8 characters</span></div>
              <div className={`fp-req${pwUp ? ' met' : ''}`}><div className="fp-req-icon"><i className="ri-check-line" /></div><span>One uppercase letter</span></div>
              <div className={`fp-req${pwNum ? ' met' : ''}`}><div className="fp-req-icon"><i className="ri-check-line" /></div><span>One number</span></div>
              <div className={`fp-req${pwSpec ? ' met' : ''}`}><div className="fp-req-icon"><i className="ri-check-line" /></div><span>One special character (!@#$)</span></div>
            </div>
            <button className={`cta${resetting ? ' loading' : ''}`} onClick={doReset} disabled={resetting} style={{ marginTop: 14 }}>
              <span className="spinner" aria-hidden="true" />
              <span className="label">Reset password</span>
              <span className="check" aria-hidden="true"><i className="ri-check-line" /></span>
            </button>
          </div>

          {/* ── Step 4: Success ── */}
          <div className={`fp-form-step${step === 4 ? ' active' : ''}`}>
            <div className="fp-success">
              <div className="fp-success-circle"><i className="ri-check-line" /></div>
              <h1>Password reset!</h1>
              <p>{successMsg}</p>
              <button className="cta" onClick={() => navigate('/login')}>
                <span className="label">Back to sign in</span>
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
