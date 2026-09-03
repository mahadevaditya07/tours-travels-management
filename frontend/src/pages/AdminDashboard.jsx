import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAdminDashboard, updateVehiclePricing, cancelBookingAdmin } from "../services/api";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingVehicleId, setSavingVehicleId] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboard();
      setDashboard(data);
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

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
    } catch (err) {
      setError(err.message || "Failed to update price.");
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
                <input id={`price-${vehicle._id}`} type="number" min="1" step="1" defaultValue={vehicle.costPerKm} />
                <button className="btn btn-primary" type="button" onClick={() => handlePriceUpdate(vehicle._id)} disabled={savingVehicleId === vehicle._id}>
                  {savingVehicleId === vehicle._id ? 'Saving...' : 'Update'}
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
