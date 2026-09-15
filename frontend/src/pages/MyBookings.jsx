import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cancelBooking, getMyBookings } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./MyBookings.css";
import Loading from "../components/Loading";
import StarRating from "../components/StarRating";

const formatDate = (dateVal) => {
  if (!dateVal) return "Flexible date";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Flexible date";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const { addRating } = useAuth();
  const [ratingOpenId, setRatingOpenId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => { getMyBookings().then(setBookings).finally(() => setLoading(false)); }, []);

  const cancel = async id => {
    await cancelBooking(id);
    setBookings(await getMyBookings());
    if (selectedBooking && (selectedBooking.id === id || selectedBooking._id === id)) {
      setSelectedBooking(prev => prev ? { ...prev, status: 'Cancelled' } : null);
    }
  };

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
              <article className="booking-item card" key={b.id || b._id}>
                <div className="booking-id"><span>Booking ID</span><strong>{b.bookingId || b.id}</strong></div>
                <div>
                  <span className="eyebrow">Experience</span>
                  <h2>{b.tourName || b.tour}</h2>
                  <p className="muted">{b.startLocation || b.start} → {b.destination} · {formatDate(b.travelDate || b.date)}</p>
                </div>
                <div className="booking-info">
                  <span>{b.members} traveler{b.members > 1 ? 's' : ''}</span>
                  <span>{b.vehicle}</span>
                  <strong>₹{Number(b.totalPrice !== undefined ? b.totalPrice : b.total || 0).toLocaleString("en-IN")}</strong>
                </div>
                <div className={`status ${String(b.status).toLowerCase()}`}>{b.status}</div>
                <div className="booking-actions">
                  <button className="btn btn-outline" onClick={() => setSelectedBooking(b)}>View details</button>
                  {b.status !== "Cancelled" && b.status !== "Completed" && <button className="btn btn-danger" onClick={() => cancel(b.id || b._id)}>Cancel</button>}
                  {b.status === "Completed" && (
                    ratingOpenId === (b.id || b._id)
                      ? <StarRating onRate={(v) => rate(b.id || b._id, v)} />
                      : <button className="btn btn-secondary" onClick={() => setRatingOpenId(b.id || b._id)}>Rate trip</button>
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

        {/* View Details Modal */}
        {selectedBooking && (
          <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
            <div className="modal-card" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Booking Details</h2>
                <button className="modal-close" onClick={() => setSelectedBooking(null)}>✕</button>
              </div>

              <div className="modal-grid">
                <div className="modal-field">
                  <label>Booking ID</label>
                  <strong>{selectedBooking.bookingId || selectedBooking.id || selectedBooking._id}</strong>
                </div>

                <div className="modal-field">
                  <label>Status</label>
                  <span className={`status ${String(selectedBooking.status).toLowerCase()}`} style={{ display: 'inline-block', width: 'fit-content' }}>
                    {selectedBooking.status}
                  </span>
                </div>

                <div className="modal-field modal-full">
                  <label>Package / Tour</label>
                  <strong>{selectedBooking.tourName || selectedBooking.tour}</strong>
                </div>

                <div className="modal-field">
                  <label>Travel Date</label>
                  <strong>{formatDate(selectedBooking.travelDate || selectedBooking.date)}</strong>
                </div>

                <div className="modal-field">
                  <label>Travelers</label>
                  <strong>{selectedBooking.members} passenger(s)</strong>
                </div>

                <div className="modal-divider" />

                <div className="modal-field">
                  <label>From</label>
                  <strong>{selectedBooking.startLocation || selectedBooking.start || 'N/A'}</strong>
                </div>

                <div className="modal-field">
                  <label>Destination</label>
                  <strong>{selectedBooking.destination || 'N/A'}</strong>
                </div>

                {Array.isArray(selectedBooking.stops) && selectedBooking.stops.length > 0 && (
                  <div className="modal-field modal-full">
                    <label>Intermediate Stops</label>
                    <strong>{selectedBooking.stops.map(s => typeof s === 'string' ? s : s.name).join(', ')}</strong>
                  </div>
                )}

                <div className="modal-field">
                  <label>Vehicle</label>
                  <strong>{selectedBooking.vehicle}</strong>
                </div>

                <div className="modal-field">
                  <label>Distance</label>
                  <strong>{selectedBooking.distance ? `${selectedBooking.distance} km` : 'N/A'}</strong>
                </div>

                <div className="modal-divider" />

                <div className="modal-field">
                  <label>Traveler Name</label>
                  <strong>{selectedBooking.name}</strong>
                </div>

                <div className="modal-field">
                  <label>Phone</label>
                  <strong>{selectedBooking.phone || 'N/A'}</strong>
                </div>

                <div className="modal-field modal-full">
                  <label>Email</label>
                  <strong>{selectedBooking.email}</strong>
                </div>

                <div className="modal-divider" />

                <div className="modal-field">
                  <label>Base Tour Cost</label>
                  <strong>₹{Number(selectedBooking.basePrice || 0).toLocaleString('en-IN')}</strong>
                </div>

                <div className="modal-field">
                  <label>Vehicle Cost</label>
                  <strong>₹{Number(selectedBooking.vehicleCost || 0).toLocaleString('en-IN')}</strong>
                </div>

                {Boolean(selectedBooking.additionalCharges || selectedBooking.additional) && (
                  <div className="modal-field">
                    <label>Additional Charges</label>
                    <strong>₹{Number(selectedBooking.additionalCharges || selectedBooking.additional || 0).toLocaleString('en-IN')}</strong>
                  </div>
                )}

                <div className="modal-field modal-full">
                  <label>Total Price</label>
                  <strong style={{ fontSize: '1.2rem', color: '#23c4a8' }}>
                    ₹{Number(selectedBooking.totalPrice !== undefined ? selectedBooking.totalPrice : selectedBooking.total || 0).toLocaleString('en-IN')}
                  </strong>
                </div>
              </div>

              <div className="modal-actions">
                {selectedBooking.status !== "Cancelled" && selectedBooking.status !== "Completed" && (
                  <button className="btn btn-danger" onClick={() => cancel(selectedBooking.id || selectedBooking._id)}>
                    Cancel Booking
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
