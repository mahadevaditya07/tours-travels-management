import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./MyBookings.css";
import Loading from "../components/Loading";
import StarRating from "../components/StarRating";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { addRating } = useAuth();
  const [ratingOpenId, setRatingOpenId] = useState(null);

  useEffect(() => { getMyBookings().then(setBookings).finally(() => setLoading(false)); }, []);

  const cancel = async id => { await cancelBooking(id); setBookings(await getMyBookings()); };

  const rate = async (bookingId, val) => {
    await addRating(val);
    setRatingOpenId(null);
    setBookings(await getMyBookings());
  };

  if (loading) return <Loading text="Loading your bookings..." />;

  return (
    <div className="page">
      <div className="container page-title-wrap">
        <span className="eyebrow">Your journeys</span>
        <h1 className="section-title">My bookings.</h1>
        <p className="muted">Track upcoming trips and revisit completed experiences.</p>
        {location.state?.success && <div className="notice success" style={{marginTop:18}}>{location.state.success}</div>}
      </div>
      <div className="container">
        {bookings.length ? (
          <div className="booking-list">
            {bookings.map(b => (
              <article className="booking-item card" key={b.id}>
                <div className="booking-id"><span>Booking ID</span><strong>{b.id}</strong></div>
                <div>
                  <span className="eyebrow">Experience</span>
                  <h2>{b.tour}</h2>
                  <p className="muted">{b.start} → {b.destination} · {b.date ? new Date(b.date).toLocaleDateString("en-IN") : "Flexible date"}</p>
                </div>
                <div className="booking-info"><span>{b.members} travelers</span><span>{b.vehicle}</span><strong>₹{Number(b.total||0).toLocaleString("en-IN")}</strong></div>
                <div className={`status ${String(b.status).toLowerCase()}`}>{b.status}</div>
                <div className="booking-actions">
                  {b.status !== "Cancelled" && b.status !== "Completed" && <button className="btn btn-danger" onClick={() => cancel(b.id)}>Cancel</button>}
                  {b.status === "Completed" && (
                    ratingOpenId === b.id
                      ? <StarRating onRate={(v) => rate(b.id, v)} />
                      : <button className="btn btn-secondary" onClick={() => setRatingOpenId(b.id)}>Rate trip</button>
                  )}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No bookings yet</h3>
            <p>Start exploring and create your first journey.</p>
            <Link className="btn btn-primary" to="/tours">Explore tours →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
