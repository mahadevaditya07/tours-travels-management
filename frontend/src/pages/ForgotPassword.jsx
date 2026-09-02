import { useState } from 'react';
import { forgotPassword } from '../services/api';
import './AuthShared.css';

export default function ForgotPassword() {
  const [contact, setContact] = useState('');
  const [status, setStatus] = useState(null);

  const submit = async e => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await forgotPassword(contact);
      setStatus({ ok: true, message: res.message || 'If an account matches the provided contact, a reset link has been sent.' });
    } catch (err) {
      setStatus({ ok: false, message: err.message });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form">
          <h2>Reset password</h2>
          <p className="muted">Enter your email or phone to receive a reset link.</p>
          {status && <div className={`notice ${status.ok ? 'success' : 'error'}`}>{status.message}</div>}
          <form onSubmit={submit}>
            <div className="field"><label>Email or phone</label><input value={contact} onChange={e => setContact(e.target.value)} required /></div>
            <button className="btn btn-primary full">Send reset link</button>
          </form>
        </div>
      </div>
    </div>
  );
}
