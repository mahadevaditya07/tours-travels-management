import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import './AuthShared.css';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState(null);

  const token = params.get('token');
  const email = params.get('email');

  const [emailInput, setEmailInput] = useState(email || '');
  const [tokenInput, setTokenInput] = useState(token || '');

  useEffect(() => {
    if (!token && !email) setStatus({ ok: false, message: 'Enter the code sent to your email or phone, or use the reset link.' });
  }, [token, email]);

  const submit = async e => {
    e.preventDefault(); setStatus(null);
    if (password !== confirm) return setStatus({ ok: false, message: 'Passwords do not match.' });
    const usedToken = token || tokenInput;
    const usedEmail = email || emailInput;
    if (!usedToken || !usedEmail) return setStatus({ ok: false, message: 'Token and email are required.' });
    try {
      const res = await resetPassword({ token: usedToken, email: usedEmail, password });
      setStatus({ ok: true, message: res.message || 'Password reset successful.' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) { setStatus({ ok: false, message: err.message }); }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form">
          <h2>Create a new password</h2>
          {status && <div className={`notice ${status.ok ? 'success' : 'error'}`}>{status.message}</div>}
          <form onSubmit={submit}>
            {!token && <div className="field"><label>Email</label><input value={emailInput} onChange={e => setEmailInput(e.target.value)} required /></div>}
            {!token && <div className="field"><label>Reset code</label><input value={tokenInput} onChange={e => setTokenInput(e.target.value)} required /></div>}
            <div className="field"><label>New password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
            <div className="field"><label>Confirm password</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required /></div>
            <button className="btn btn-primary full">Set new password</button>
          </form>
        </div>
      </div>
    </div>
  );
}
