import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmBooking } from '../services/api';
import './AuthShared.css';

export default function ConfirmBooking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const token = params.get('token');
  const bookingId = params.get('bookingId');
  const isValidLink = useMemo(() => Boolean(token && bookingId), [token, bookingId]);

  useEffect(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('tours_user');
  }, []);

  const handleConfirm = async () => {
    if (!isValidLink) {
      setStatus({ ok: false, message: 'Invalid confirmation link.' });
      return;
    }

    setSubmitting(true);
    setStatus(null);

    try {
      const res = await confirmBooking(bookingId, token);
      setStatus({ ok: true, message: res.message || 'Booking confirmed. Please sign in to your account to view it.' });
      setTimeout(() => navigate('/login'), 1600);
    } catch (err) {
      setStatus({ ok: false, message: err.message || 'Unable to confirm this booking.' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form">
          <h2>Confirm booking</h2>
          {!isValidLink && <div className="notice error">Invalid confirmation link.</div>}
          {status && <div className={`notice ${status.ok ? 'success' : 'error'}`}>{status.message}</div>}
          {isValidLink && !status?.ok && (
            <>
              <p className="muted">Please confirm this booking before it is activated.</p>
              <button className="btn btn-primary full" type="button" onClick={handleConfirm} disabled={submitting}>
                {submitting ? 'Confirming...' : 'Confirm Booking'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
