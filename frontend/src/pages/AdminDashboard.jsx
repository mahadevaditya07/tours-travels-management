import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminDashboard, updateVehiclePricing, cancelBookingAdmin, getTours, updateTour, deleteAdminUser } from "../services/api";
import { useToast } from "../context/ToastContext";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingVehicleId, setSavingVehicleId] = useState("");
  const [toursList, setToursList] = useState([]);
  const [savingTourId, setSavingTourId] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboard();
      setDashboard(data);
      try {
        const toursRes = await getTours();
        // getTours returns { success, tours } or an array depending on backend; normalize
        const toursData = Array.isArray(toursRes) ? toursRes : (toursRes?.tours || []);
        setToursList(toursData);
      } catch (e) {
        // ignore tours fetch errors for now
      }
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);
  const toast = useToast();

  const handlePriceUpdate = async (vehicleId) => {
    const input = document.getElementById(`price-${vehicleId}`);
    const costPerKm = Number(input?.value);
    if (!Number.isFinite(costPerKm) || costPerKm <= 0) {
      setError("Enter a valid price per kilometer.");
      return;
    }

    try {
      setSavingVehicleId(vehicleId);
      setError("");
      await updateVehiclePricing(vehicleId, costPerKm);
      await fetchDashboard();
        toast?.showToast('Vehicle price updated', { type: 'success' });
    } catch (err) {
      setError(err.message || "Failed to update price.");
        toast?.showToast(err.message || 'Failed to update price', { type: 'error' });
    } finally {
      setSavingVehicleId("");
    }
  };

  const handleCancelBooking = async (bookingId) => {
    try {
      setError("");
      await cancelBookingAdmin(bookingId);
      await fetchDashboard();
    } catch (err) {
      setError(err.message || "Failed to cancel booking.");
    }
  };

  const handleTourPriceUpdate = async (tourId) => {
    const input = document.getElementById(`tour-price-${tourId}`);
    const value = Number(input?.value);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid tour price.");
      return;
    }

    // toast available from hook
    try {
      setSavingTourId(tourId);
      setError("");
      await updateTour(tourId, { price: value });
      // update local list
      setToursList(prev => prev.map(t => t._id === tourId || t.id === tourId ? { ...t, price: value } : t));
      toast?.showToast('Tour price updated', { type: 'success' });
    } catch (err) {
      setError(err.message || "Failed to update tour price.");
      toast?.showToast(err.message || 'Failed to update tour price', { type: 'error' });
    } finally {
      setSavingTourId("");
    }
  };

  const handleTourPerPersonUpdate = async (tourId) => {
    const input = document.getElementById(`tour-perperson-${tourId}`);
    const value = Number(input?.value);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid per-person price.");
      return;
    }

    try {
      setSavingTourId(tourId);
      setError("");
      await updateTour(tourId, { pricePerPerson: value });
      setToursList(prev => prev.map(t => t._id === tourId || t.id === tourId ? { ...t, pricePerPerson: value } : t));
      toast?.showToast('Tour per-person price updated', { type: 'success' });
    } catch (err) {
      setError(err.message || "Failed to update per-person price.");
      toast?.showToast(err.message || 'Failed to update per-person price', { type: 'error' });
    } finally {
      setSavingTourId("");
    }
  };

  const handleTourDatesUpdate = async (tourId, newDates) => {
    try {
      setSavingTourId(tourId);
      setError("");
      await updateTour(tourId, { availableDates: newDates, dates: newDates });
      setToursList(prev => prev.map(t => (t._id === tourId || t.id === tourId) ? { ...t, availableDates: newDates, dates: newDates } : t));
      toast?.showToast('Tour available dates updated', { type: 'success' });
    } catch (err) {
      setError(err.message || "Failed to update tour dates.");
      toast?.showToast(err.message || 'Failed to update tour dates', { type: 'error' });
    } finally {
      setSavingTourId("");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete user? This action cannot be undone.')) return;
    try {
      await deleteAdminUser(userId);
      toast?.showToast('User deleted', { type: 'success' });
      await fetchDashboard();
    } catch (err) {
      setError(err.message || 'Failed to delete user.');
      toast?.showToast(err.message || 'Failed to delete user', { type: 'error' });
    }
  };

  if (loading) return <div className="page container"><h2>Loading admin dashboard...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">Admin access</span>
          <h1 className="section-title">Welcome, {user?.name || 'Admin'}.</h1>
          <p>Manage pricing, bookings, and registered users from one secure workspace.</p>
        </div>
        <div className="admin-pill">
          Active
          <strong>{dashboard?.summary?.totalUsers ?? 0}</strong>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}

      <div className="admin-grid">
        <div className="admin-stat-card"><span>Total users</span><strong>{dashboard?.summary?.totalUsers ?? 0}</strong><small>Registered</small></div>
        <div className="admin-stat-card"><span>Total bookings</span><strong>{dashboard?.summary?.totalBookings ?? 0}</strong><small>All records</small></div>
        <div className="admin-stat-card"><span>Pending</span><strong>{dashboard?.summary?.pendingBookings ?? 0}</strong><small>Need review</small></div>
        <div className="admin-stat-card"><span>Cancelled</span><strong>{dashboard?.summary?.cancelledBookings ?? 0}</strong><small>Cancelled</small></div>
      </div>

      <div id="admin-pricing" className="admin-panel">
        <h2>Vehicle pricing (₹ per km)</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {(dashboard?.vehicles || []).map((vehicle) => (
            <div key={vehicle._id} className="admin-price-item">
              <div className="admin-price-meta">
                <strong>{vehicle.name}</strong>
                <span>Capacity: {vehicle.capacity}</span>
              </div>
              <div className="admin-price-controls">
                <label htmlFor={`price-${vehicle._id}`}>Price/km</label>
                <input key={`${vehicle._id}-${vehicle.costPerKm}`} id={`price-${vehicle._id}`} type="number" min="1" step="1" defaultValue={vehicle.costPerKm} />
                <button className="btn btn-primary" type="button" onClick={() => handlePriceUpdate(vehicle._id)} disabled={savingVehicleId === vehicle._id}>
                  {savingVehicleId === vehicle._id ? 'Saving...' : 'Update'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="admin-tours" className="admin-panel">
        <h2>Manage tours</h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {(toursList || []).map((t) => (
            <div key={t._id || t.id} className="admin-price-item">
              <div className="admin-price-meta">
                <strong>{t.title}</strong>
                <span>{t.destination}</span>
              </div>
              <div className="admin-price-controls">
                <label htmlFor={`tour-price-${t._id || t.id}`}>Package Price</label>
                <input key={`price-${t._id || t.id}-${t.price}`} id={`tour-price-${t._id || t.id}`} type="number" min="1" step="1" defaultValue={t.price} />
                <button className="btn btn-primary" type="button" onClick={() => handleTourPriceUpdate(t._id || t.id)} disabled={savingTourId === (t._id || t.id)}>
                  {savingTourId === (t._id || t.id) ? 'Saving...' : 'Update'}
                </button>
                <label htmlFor={`tour-perperson-${t._id || t.id}`}>Price / person</label>
                <input key={`perperson-${t._id || t.id}-${t.pricePerPerson ?? t.price}`} id={`tour-perperson-${t._id || t.id}`} type="number" min="1" step="1" defaultValue={t.pricePerPerson ?? t.price} />
                <button className="btn btn-secondary" type="button" onClick={() => handleTourPerPersonUpdate(t._id || t.id)} disabled={savingTourId === (t._id || t.id)}>
                  {savingTourId === (t._id || t.id) ? 'Saving...' : 'Update per-person'}
                </button>
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--primary-2, #62e6d0)' }}>Available Dates</strong>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {(() => {
                    const todayTime = new Date().setHours(0, 0, 0, 0);
                    const currentList = Array.isArray(t.availableDates) && t.availableDates.length ? t.availableDates : (Array.isArray(t.dates) ? t.dates : []);
                    const futureList = currentList.filter(dStr => {
                      try {
                        const d = new Date(dStr);
                        d.setHours(0, 0, 0, 0);
                        return d.getTime() > todayTime;
                      } catch { return false; }
                    });
                    return futureList.map((dStr, idx) => {
                      let formatted = dStr;
                      try { formatted = new Date(dStr).toISOString().split('T')[0]; } catch {}
                      return (
                        <span key={idx} style={{ background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 8, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          {formatted}
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', color: '#ff6b7a', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}
                            onClick={() => {
                              const nextList = futureList.filter((_, i) => i !== idx);
                              handleTourDatesUpdate(t._id || t.id, nextList);
                            }}
                          >✕</button>
                        </span>
                      );
                    });
                  })()}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(() => {
                    const tmrw = new Date();
                    tmrw.setDate(tmrw.getDate() + 1);
                    const minDateVal = tmrw.toISOString().split("T")[0];
                    return (
                      <>
                        <input type="date" id={`add-date-${t._id || t.id}`} min={minDateVal} style={{ width: 150, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#0a1726', color: '#fff', colorScheme: 'dark' }} />
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            const input = document.getElementById(`add-date-${t._id || t.id}`);
                            const val = input?.value;
                            if (!val) return alert('Select a valid date to add.');
                            
                            const selectedD = new Date(val);
                            selectedD.setHours(0, 0, 0, 0);
                            const nowD = new Date();
                            nowD.setHours(0, 0, 0, 0);
                            if (selectedD.getTime() <= nowD.getTime()) {
                              return alert('Available date must be greater than today\'s date.');
                            }

                            const rawList = Array.isArray(t.availableDates) && t.availableDates.length ? t.availableDates : (Array.isArray(t.dates) ? t.dates : []);
                            const formattedList = rawList.map(d => {
                              try { return new Date(d).toISOString().split('T')[0]; } catch { return String(d); }
                            });
                            if (formattedList.includes(val)) return alert('Date already added.');
                            const nextList = [...formattedList, val];
                            handleTourDatesUpdate(t._id || t.id, nextList);
                            if (input) input.value = '';
                          }}
                        >
                          + Add Date
                        </button>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div id="admin-users" className="admin-panel">
        <h2>Users</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Verified</th>
                  <th>Action</th>
                </tr>
            </thead>
            <tbody>
              {(dashboard?.users || []).map((person) => (
                  <tr key={person._id}>
                    <td>{person.name}</td>
                    <td>{person.email}</td>
                    <td>{person.phone || '—'}</td>
                    <td>{person.role}</td>
                    <td>{person.isVerified ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="btn btn-danger" type="button" onClick={() => handleDeleteUser(person._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      <div id="admin-bookings" className="admin-panel">
        <h2>Bookings</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Tour</th>
                <th>Date</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.bookings || []).map((booking) => (
                <tr key={booking._id}>
                  <td>{booking.name}</td>
                  <td>{booking.tourName || 'Custom trip'}</td>
                  <td>{new Date(booking.travelDate).toLocaleDateString()}</td>
                  <td>₹{Number(booking.totalPrice || 0).toLocaleString('en-IN')}</td>
                  <td>
                    <span className={`admin-status ${String(booking.status).toLowerCase()}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button className="btn btn-outline" type="button" onClick={() => setSelectedBooking(booking)}>Details</button>
                    {booking.status !== 'Cancelled' && (
                      <button className="btn btn-secondary" type="button" onClick={() => handleCancelBooking(booking._id)}>Cancel</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Booking Details Modal */}
      {selectedBooking && (
        <div className="modal-backdrop" onClick={() => setSelectedBooking(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Booking Details (Admin)</h2>
              <button className="modal-close" onClick={() => setSelectedBooking(null)}>✕</button>
            </div>

            <div className="modal-grid">
              <div className="modal-field">
                <label>Booking ID</label>
                <strong>{selectedBooking.bookingId || selectedBooking._id}</strong>
              </div>

              <div className="modal-field">
                <label>Status</label>
                <span className={`admin-status ${String(selectedBooking.status).toLowerCase()}`} style={{ display: 'inline-block', width: 'fit-content' }}>
                  {selectedBooking.status}
                </span>
              </div>

              <div className="modal-field modal-full">
                <label>Package / Tour</label>
                <strong>{selectedBooking.tourName || 'Custom trip'}</strong>
              </div>

              <div className="modal-field">
                <label>Travel Date</label>
                <strong>{selectedBooking.travelDate ? new Date(selectedBooking.travelDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}</strong>
              </div>

              <div className="modal-field">
                <label>Travelers</label>
                <strong>{selectedBooking.members} passenger(s)</strong>
              </div>

              <div className="modal-divider" />

              <div className="modal-field">
                <label>From</label>
                <strong>{selectedBooking.startLocation || 'N/A'}</strong>
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
                <label>Customer Name</label>
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

              <div className="modal-field modal-full">
                <label>Total Price</label>
                <strong style={{ fontSize: '1.2rem', color: '#23c4a8' }}>
                  ₹{Number(selectedBooking.totalPrice || 0).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              {selectedBooking.status !== 'Cancelled' && (
                <button className="btn btn-secondary" type="button" onClick={() => { handleCancelBooking(selectedBooking._id); setSelectedBooking(null); }}>
                  Cancel Booking
                </button>
              )}
              <button className="btn btn-primary" type="button" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
