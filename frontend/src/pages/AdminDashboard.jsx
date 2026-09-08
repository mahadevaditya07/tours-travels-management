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
                  <td>
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
    </div>
  );
}
