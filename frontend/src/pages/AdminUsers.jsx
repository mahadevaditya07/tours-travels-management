import { useEffect, useState } from "react";
import { getAdminUsers, deleteAdminUser } from "../services/api";
import { useToast } from "../context/ToastContext";
import AdminNav from "../components/AdminNav";
import "./AdminDashboard.css";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const toast = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await getAdminUsers();
      setUsers(res?.users || []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (!confirm("Delete user? This action cannot be undone.")) return;
    try {
      setError("");
      await deleteAdminUser(userId);
      toast?.showToast("User deleted successfully", { type: "success" });
      await fetchUsers();
    } catch (err) {
      setError(err.message || "Failed to delete user.");
      toast?.showToast(err.message || "Failed to delete user", { type: "error" });
    }
  };

  const filteredUsers = users.filter(u =>
    `${u.name} ${u.email} ${u.phone} ${u.role}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="page container"><h2>Loading registered users...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">User Administration</span>
          <h1 className="section-title">Registered Users</h1>
          <p>View user accounts, verify account status, and manage active system users.</p>
        </div>
        <div className="admin-pill">
          Total Users
          <strong>{users.length}</strong>
        </div>
      </div>

      <AdminNav />

      {error && <div className="notice error">{error}</div>}

      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <h2>Users ({filteredUsers.length})</h2>
          <input
            type="text"
            placeholder="Search users by name, email, phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.3)', background: 'rgba(15,23,42,0.7)', color: '#fff', minWidth: 260 }}
          />
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length ? (
                filteredUsers.map(u => (
                  <tr key={u._id || u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td>{u.email}</td>
                    <td>{u.phone || 'N/A'}</td>
                    <td>
                      <span className={`admin-status ${u.role === 'admin' ? 'confirmed' : 'pending'}`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td>{u.isVerified ? '✓ Verified' : '✕ Unverified'}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className="btn btn-danger" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleDeleteUser(u._id || u.id)}>
                          Delete User
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: 24, color: '#a5b4cf' }}>
                    No users match your search query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
