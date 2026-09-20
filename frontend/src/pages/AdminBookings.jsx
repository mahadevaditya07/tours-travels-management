import { useEffect, useState } from "react";
import { getAdminBookings, cancelBookingAdmin } from "../services/api";
import { useToast } from "../context/ToastContext";
import AdminNav from "../components/AdminNav";
import "./AdminDashboard.css";

const formatDate = (dateVal) => {
  if (!dateVal) return "Flexible date";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return "Flexible date";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingTab, setBookingTab] = useState("Confirmed");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const toast = useToast();

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getAdminBookings();
      setBookings(res?.bookings || []);
    } catch (err) {
      setError(err.message || "Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId) => {
    if (!confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setError("");
      await cancelBookingAdmin(bookingId);
      toast?.showToast("Booking cancelled successfully", { type: "success" });
      await fetchBookings();
      if (selectedBooking && (selectedBooking._id === bookingId || selectedBooking.id === bookingId)) {
        setSelectedBooking(prev => prev ? { ...prev, status: 'Cancelled' } : null);
      }
    } catch (err) {
      setError(err.message || "Failed to cancel booking.");
      toast?.showToast(err.message || "Failed to cancel booking", { type: "error" });
    }
  };

  const activeBookings = bookings.filter(b => b.status === bookingTab);

  if (loading) return <div className="page container"><h2>Loading bookings...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">Booking Management</span>
          <h1 className="section-title">Manage Customer Bookings</h1>
          <p>Review booking status, inspect trip details, and manage customer cancellations.</p>
        </div>
        <div className="admin-pill">
          Total Bookings
          <strong>{bookings.length}</strong>
        </div>
      </div>

      <AdminNav />

      {error && <div className="notice error">{error}</div>}

      <div className="admin-grid">
        <div className="admin-stat-card"><span>Confirmed</span><strong>{bookings.filter(b => b.status === 'Confirmed').length}</strong><small>Active Bookings</small></div>
        <div className="admin-stat-card"><span>Pending</span><strong>{bookings.filter(b => b.status === 'Pending').length}</strong><small>Awaiting Verification</small></div>
        <div className="admin-stat-card"><span>Cancelled</span><strong>{bookings.filter(b => b.status === 'Cancelled').length}</strong><small>Cancelled Trips</small></div>
        <div className="admin-stat-card"><span>Total All</span><strong>{bookings.length}</strong><small>All Records</small></div>
      </div>

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2>Bookings</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`btn ${bookingTab === 'Confirmed' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setBookingTab('Confirmed')}
            >
              Confirmed ({bookings.filter(b => b.status === 'Confirmed').length})
            </button>
            <button
              className={`btn ${bookingTab === 'Pending' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setBookingTab('Pending')}
            >
              Pending ({bookings.filter(b => b.status === 'Pending').length})
            </button>
            <button
              className={`btn ${bookingTab === 'Cancelled' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setBookingTab('Cancelled')}
            >
              Cancelled ({bookings.filter(b => b.status === 'Cancelled').length})
            </button>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Tour / Route</th>
                <th>Date</th>
                <th>Vehicle</th>
                <th>Status</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeBookings.length ? (
                activeBookings.map((b) => (
                  <tr key={b._id || b.id}>
                    <td><strong>{b.bookingId || b.id || b._id}</strong></td>
                    <td>
                      {b.name}
                      <small style={{ display: 'block', color: '#a5b4cf' }}>{b.email}</small>
                    </td>
                    <td>{b.phone || 'N/A'}</td>
                    <td>{b.tourName || b.tour} ({b.startLocation || b.start} → {b.destination})</td>
                    <td>{formatDate(b.travelDate || b.date)}</td>
                    <td>{b.vehicle}</td>
                    <td>
                      <span className={`admin-status ${String(b.status).toLowerCase()}`}>
                        {b.status}
                      </span>
                    </td>
                    <td><strong>₹{Number(b.totalPrice || b.total || 0).toLocaleString('en-IN')}</strong></td>
                    <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setSelectedBooking(b)}>
                        View
                      </button>
                      {b.status !== 'Cancelled' && (
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleCancelBooking(b._id || b.id)}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: 24, color: '#a5b4cf' }}>
                    No {bookingTab.toLowerCase()} bookings found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Booking Details Modal */}
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
                <span className={`admin-status ${String(selectedBooking.status).toLowerCase()}`}>
                  {selectedBooking.status}
                </span>
              </div>

              <div className="modal-field modal-full">
                <label>Customer Name & Contact</label>
                <strong>{selectedBooking.name} ({selectedBooking.email} · {selectedBooking.phone || 'No phone'})</strong>
              </div>

              <div className="modal-field modal-full">
                <label>Package / Tour Name</label>
                <strong>{selectedBooking.tourName || selectedBooking.tour}</strong>
              </div>

              <div className="modal-field">
                <label>Route</label>
                <strong>{selectedBooking.startLocation || selectedBooking.start} → {selectedBooking.destination}</strong>
              </div>

              <div className="modal-field">
                <label>Stops</label>
                <strong>
                  {Array.isArray(selectedBooking.stops) && selectedBooking.stops.length
                    ? selectedBooking.stops.map(s => typeof s === 'string' ? s : s.name).join(', ')
                    : 'No extra stops'}
                </strong>
              </div>

              <div className="modal-field">
                <label>Travel Date</label>
                <strong>{formatDate(selectedBooking.travelDate || selectedBooking.date)}</strong>
              </div>

              <div className="modal-field">
                <label>Travelers</label>
                <strong>{selectedBooking.members} person(s)</strong>
              </div>

              <div className="modal-field">
                <label>Vehicle Selected</label>
                <strong>{selectedBooking.vehicle}</strong>
              </div>

              <div className="modal-field">
                <label>Route Distance</label>
                <strong>{selectedBooking.distance || 0} km</strong>
              </div>

              <div className="modal-field">
                <label>Base Price</label>
                <strong>₹{Number(selectedBooking.basePrice || 0).toLocaleString('en-IN')}</strong>
              </div>

              <div className="modal-field">
                <label>Vehicle Charge</label>
                <strong>₹{Number(selectedBooking.vehicleCost || 0).toLocaleString('en-IN')}</strong>
              </div>

              <div className="modal-field">
                <label>Additional Charges</label>
                <strong>₹{Number(selectedBooking.additionalCharges || 0).toLocaleString('en-IN')}</strong>
              </div>

              <div className="modal-field modal-full" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 4 }}>
                <label>Total Fare Amount</label>
                <strong style={{ fontSize: '1.4rem', color: '#62e6d0' }}>
                  ₹{Number(selectedBooking.totalPrice || selectedBooking.total || 0).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              {selectedBooking.status !== 'Cancelled' && (
                <button className="btn btn-danger" onClick={() => handleCancelBooking(selectedBooking._id || selectedBooking.id)}>
                  Cancel Booking
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
