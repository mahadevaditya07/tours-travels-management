import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminDashboard } from "../services/api";
import AdminNav from "../components/AdminNav";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <div className="page container"><h2>Loading admin dashboard...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">Admin Workspace</span>
          <h1 className="section-title">Welcome, {user?.name || 'Admin'}.</h1>
          <p>System overview and quick controls for tours, bookings, pricing, and users.</p>
        </div>
        <div className="admin-pill">
          Total Users
          <strong>{dashboard?.summary?.totalUsers ?? 0}</strong>
        </div>
      </div>

      <AdminNav />

      {error && <div className="notice error">{error}</div>}

      <div className="admin-grid">
        <div className="admin-stat-card"><span>Total Users</span><strong>{dashboard?.summary?.totalUsers ?? 0}</strong><small>Registered Accounts</small></div>
        <div className="admin-stat-card"><span>Total Bookings</span><strong>{dashboard?.summary?.totalBookings ?? 0}</strong><small>All Time</small></div>
        <div className="admin-stat-card"><span>Pending Bookings</span><strong>{dashboard?.summary?.pendingBookings ?? 0}</strong><small>Need Review</small></div>
        <div className="admin-stat-card"><span>Cancelled</span><strong>{dashboard?.summary?.cancelledBookings ?? 0}</strong><small>Cancelled Bookings</small></div>
      </div>

      {/* Quick Navigation Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, marginBottom: 28 }}>
        <Link to="/admin/bookings" style={{ textDecoration: 'none' }}>
          <div className="admin-panel" style={{ cursor: 'pointer', height: '100%', marginBottom: 0 }}>
            <h3>📅 Bookings Management</h3>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: '0.9rem' }}>
              View, review, filter, and manage customer bookings ({dashboard?.summary?.totalBookings ?? 0} total).
            </p>
            <span style={{ color: '#62e6d0', fontWeight: 600, fontSize: '0.9rem' }}>Open Bookings →</span>
          </div>
        </Link>

        <Link to="/admin/pricing" style={{ textDecoration: 'none' }}>
          <div className="admin-panel" style={{ cursor: 'pointer', height: '100%', marginBottom: 0 }}>
            <h3>🏷️ Vehicle Pricing</h3>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: '0.9rem' }}>
              Update per-km rates for Sedan, SUV, Traveller, Swift, Innova, and Mini Bus.
            </p>
            <span style={{ color: '#62e6d0', fontWeight: 600, fontSize: '0.9rem' }}>Manage Pricing →</span>
          </div>
        </Link>

        <Link to="/admin/tours" style={{ textDecoration: 'none' }}>
          <div className="admin-panel" style={{ cursor: 'pointer', height: '100%', marginBottom: 0 }}>
            <h3>🗺️ Tour Packages</h3>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: '0.9rem' }}>
              Manage package prices, per-person rates, available dates, and assigned vehicles.
            </p>
            <span style={{ color: '#62e6d0', fontWeight: 600, fontSize: '0.9rem' }}>Manage Tours →</span>
          </div>
        </Link>

        <Link to="/admin/users" style={{ textDecoration: 'none' }}>
          <div className="admin-panel" style={{ cursor: 'pointer', height: '100%', marginBottom: 0 }}>
            <h3>👥 User Management</h3>
            <p className="muted" style={{ margin: '8px 0 12px', fontSize: '0.9rem' }}>
              Inspect registered user accounts, contact details, and account management ({dashboard?.summary?.totalUsers ?? 0} users).
            </p>
            <span style={{ color: '#62e6d0', fontWeight: 600, fontSize: '0.9rem' }}>Manage Users →</span>
          </div>
        </Link>
      </div>

      {/* Recent Bookings Overview */}
      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2>Recent Bookings</h2>
          <Link to="/admin/bookings" className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>View All Bookings →</Link>
        </div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer</th>
                <th>Tour / Route</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard?.bookings || []).slice(0, 6).map(b => (
                <tr key={b._id || b.id}>
                  <td><strong>{b.bookingId || b.id || b._id}</strong></td>
                  <td>{b.name} <small style={{ display: 'block', color: '#a5b4cf' }}>{b.email}</small></td>
                  <td>{b.tourName || b.tour} ({b.startLocation || b.start} → {b.destination})</td>
                  <td>
                    <span className={`admin-status ${String(b.status).toLowerCase()}`}>
                      {b.status}
                    </span>
                  </td>
                  <td><strong>₹{Number(b.totalPrice || b.total || 0).toLocaleString('en-IN')}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
