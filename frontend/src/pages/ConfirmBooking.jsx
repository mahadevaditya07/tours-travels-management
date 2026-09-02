import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { confirmBooking } from '../services/api';
import './AuthShared.css';

export default function ConfirmBooking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState(null);

  const token = params.get('token');
  const bookingId = params.get('bookingId');

  useEffect(() => {
    const run = async () => {
      if (!token || !bookingId) return setStatus({ ok: false, message: 'Invalid confirmation link.' });
      try {
        const res = await confirmBooking(bookingId, token);
        setStatus({ ok: true, message: res.message || 'Booking confirmed. Redirecting to my bookings...' });
        setTimeout(() => navigate('/my-bookings'), 1400);
      } catch (err) { setStatus({ ok: false, message: err.message }); }
    };
    run();
  }, [token, bookingId, navigate]);

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-form">
          <h2>Confirm booking</h2>
          {status && <div className={`notice ${status.ok ? 'success' : 'error'}`}>{status.message}</div>}
          {!status && <p className="muted">Confirming your booking...</p>}
        </div>
      </div>
    </div>
  );
}
