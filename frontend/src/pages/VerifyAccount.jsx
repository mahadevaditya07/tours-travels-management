import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyAccount } from '../services/api';
import './AuthShared.css';

export default function VerifyAccount() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  const token = params.get('token');
  const email = params.get('email');

  useEffect(() => {
    const run = async () => {
      if (!token || !email) return setStatus({ ok: false, message: 'Invalid verification link.' });
      try {
        const res = await verifyAccount({ token, email });
        setStatus({ ok: true, message: res.message || 'Account verified. Redirecting to login...' });
        setTimeout(() => navigate('/login'), 1400);
      } catch (err) { setStatus({ ok: false, message: err.message }); }
    };
    run();
  }, [token, email, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form">
          <h2>Verify account</h2>
          {status && <div className={`notice ${status.ok ? 'success' : 'error'}`}>{status.message}</div>}
          {!status && <p className="muted">Verifying your account...</p>}
        </div>
      </div>
    </div>
  );
}
