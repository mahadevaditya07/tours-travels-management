import { useState } from 'react';
import { forgotPassword } from '../services/api';
import './AuthShared.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus(null);

    try {
      const res = await forgotPassword(email);

      setStatus({
        ok: true,
        message:
          res.message ||
          'A password reset link has been sent to your email.'
      });
    } catch (err) {
      setStatus({
        ok: false,
        message: err.message || 'Unable to send reset link.'
      });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form">

          <h2>Reset password</h2>

          <p className="muted">
            Enter your registered email to receive a password reset link.
          </p>

          {status && (
            <div
              className={`notice ${
                status.ok ? 'success' : 'error'
              }`}
            >
              {status.message}
            </div>
          )}

          <form onSubmit={submit}>

            <div className="field">
              <label>Email address</label>

              <input
                type="email"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary full"
            >
              Send reset link
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}