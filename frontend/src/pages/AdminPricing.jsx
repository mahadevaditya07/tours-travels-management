import { useEffect, useState } from "react";
import { getAdminDashboard, updateVehiclePricing } from "../services/api";
import { useToast } from "../context/ToastContext";
import AdminNav from "../components/AdminNav";
import "./AdminDashboard.css";

export default function AdminPricing() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingVehicleId, setSavingVehicleId] = useState("");
  const toast = useToast();

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboard();
      setVehicles(data?.vehicles || []);
    } catch (err) {
      setError(err.message || "Failed to load vehicle pricing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
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
      toast?.showToast("Vehicle price updated", { type: "success" });
      await fetchPricing();
    } catch (err) {
      setError(err.message || "Failed to update price.");
      toast?.showToast(err.message || "Failed to update price", { type: "error" });
    } finally {
      setSavingVehicleId("");
    }
  };

  if (loading) return <div className="page container"><h2>Loading vehicle pricing...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">Pricing Management</span>
          <h1 className="section-title">Vehicle Rates (₹ per km)</h1>
          <p>Configure distance-based rates and passenger capacity for fleet vehicles.</p>
        </div>
        <div className="admin-pill">
          Fleet Vehicles
          <strong>{vehicles.length}</strong>
        </div>
      </div>

      <AdminNav />

      {error && <div className="notice error">{error}</div>}

      <div className="admin-panel">
        <h2>Fleet Pricing & Capacity</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Per-kilometer charges update automatically across Map Planner fare calculations and custom trip estimates.
        </p>

        <div style={{ display: 'grid', gap: 16 }}>
          {vehicles.map((vehicle) => (
            <div key={vehicle._id || vehicle.id} className="admin-price-item">
              <div className="admin-price-meta">
                <strong style={{ fontSize: '1.1rem' }}>{vehicle.name}</strong>
                <span>Passenger Capacity: <strong>{vehicle.capacity} seats</strong> (Max passengers: {vehicle.capacity - 1})</span>
                {vehicle.description && <p className="muted" style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{vehicle.description}</p>}
              </div>

              <div className="admin-price-controls">
                <label htmlFor={`price-${vehicle._id}`}>Price/km (₹)</label>
                <input
                  key={`${vehicle._id}-${vehicle.costPerKm}`}
                  id={`price-${vehicle._id}`}
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={vehicle.costPerKm}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handlePriceUpdate(vehicle._id)}
                  disabled={savingVehicleId === vehicle._id}
                >
                  {savingVehicleId === vehicle._id ? 'Saving...' : 'Update Price'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
