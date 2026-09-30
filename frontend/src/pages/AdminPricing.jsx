import { useEffect, useState } from "react";
import { getAdminDashboard, updateVehiclePricing, getDayCharges, createDayCharge, updateDayCharge, deleteDayCharge } from "../services/api";
import { useToast } from "../context/ToastContext";
import AdminNav from "../components/AdminNav";
import "./AdminDashboard.css";

export default function AdminPricing() {
  const [vehicles, setVehicles] = useState([]);
  const [dayCharges, setDayCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingVehicleId, setSavingVehicleId] = useState("");
  const [savingDayId, setSavingDayId] = useState("");
  
  // New day charge form state
  const [newDays, setNewDays] = useState("");
  const [newCharge, setNewCharge] = useState("");
  const [isAddingDay, setIsAddingDay] = useState(false);

  const toast = useToast();

  const fetchPricing = async () => {
    try {
      setLoading(true);
      const data = await getAdminDashboard();
      setVehicles(data?.vehicles || []);
      if (data?.dayCharges) {
        setDayCharges(data.dayCharges);
      } else {
        const charges = await getDayCharges();
        setDayCharges(charges || []);
      }
    } catch (err) {
      setError(err.message || "Failed to load pricing data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleVehiclePriceUpdate = async (vehicleId) => {
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
      setError(err.message || "Failed to update vehicle price.");
      toast?.showToast(err.message || "Failed to update price", { type: "error" });
    } finally {
      setSavingVehicleId("");
    }
  };

  const handleDayChargeUpdate = async (dayChargeId) => {
    const input = document.getElementById(`day-charge-${dayChargeId}`);
    const chargeVal = Number(input?.value);
    if (!Number.isFinite(chargeVal) || chargeVal < 0) {
      setError("Enter a valid non-negative charge amount.");
      return;
    }

    try {
      setSavingDayId(dayChargeId);
      setError("");
      await updateDayCharge(dayChargeId, { charge: chargeVal });
      toast?.showToast("Day charge updated successfully", { type: "success" });
      await fetchPricing();
    } catch (err) {
      setError(err.message || "Failed to update day charge.");
      toast?.showToast(err.message || "Failed to update day charge", { type: "error" });
    } finally {
      setSavingDayId("");
    }
  };

  const handleAddDayCharge = async (e) => {
    e.preventDefault();
    const daysNum = Number(newDays);
    const chargeNum = Number(newCharge);

    if (!Number.isFinite(daysNum) || daysNum <= 0) {
      setError("Please enter a valid number of days.");
      return;
    }
    if (!Number.isFinite(chargeNum) || chargeNum < 0) {
      setError("Please enter a valid non-negative charge amount.");
      return;
    }

    try {
      setIsAddingDay(true);
      setError("");
      await createDayCharge(daysNum, chargeNum);
      toast?.showToast(`Added charge for ${daysNum} Days`, { type: "success" });
      setNewDays("");
      setNewCharge("");
      await fetchPricing();
    } catch (err) {
      setError(err.message || "Failed to add day charge.");
      toast?.showToast(err.message || "Failed to add day charge", { type: "error" });
    } finally {
      setIsAddingDay(false);
    }
  };

  const handleDeleteDayCharge = async (dayChargeId, daysLabel) => {
    if (!window.confirm(`Are you sure you want to delete the pricing rule for ${daysLabel}?`)) {
      return;
    }

    try {
      setError("");
      await deleteDayCharge(dayChargeId);
      toast?.showToast("Day charge rule deleted", { type: "info" });
      await fetchPricing();
    } catch (err) {
      setError(err.message || "Failed to delete day charge.");
      toast?.showToast(err.message || "Failed to delete day charge", { type: "error" });
    }
  };

  if (loading) return <div className="page container"><h2>Loading pricing settings...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">Pricing Management</span>
          <h1 className="section-title">Rates & Additional Day Charges</h1>
          <p>Configure distance-based vehicle rates and admin day-stay charges stored in the database.</p>
        </div>
        <div className="admin-pill">
          Fleet Vehicles: <strong>{vehicles.length}</strong> | Day Rules: <strong>{dayCharges.length}</strong>
        </div>
      </div>

      <AdminNav />

      {error && <div className="notice error">{error}</div>}

      {/* =========================================================
          PANEL 1: DAY-BASED STAY & ADDITIONAL CHARGES
      ========================================================== */}
      <div className="admin-panel" style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h2>Day-Based Stay & Additional Charges</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Configure extra charges based on tour duration (Days & Nights). Saved directly to database.
            </p>
          </div>
        </div>

        {/* Existing Day Charges List */}
        <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
          {dayCharges.map((dc) => (
            <div key={dc._id || dc.days} className="admin-price-item">
              <div className="admin-price-meta">
                <strong style={{ fontSize: '1.1rem', color: '#60a5fa' }}>
                  {dc.days} Day{dc.days > 1 ? 's' : ''} / {Math.max(0, dc.days - 1)} Night{dc.days - 1 !== 1 ? 's' : ''}
                </strong>
                <span className="muted" style={{ fontSize: '0.85rem' }}>
                  {dc.description || `${dc.days} Days / ${dc.nights} Nights`}
                </span>
              </div>

              <div className="admin-price-controls">
                <label htmlFor={`day-charge-${dc._id}`}>Charge (₹)</label>
                <input
                  key={`${dc._id}-${dc.charge}`}
                  id={`day-charge-${dc._id}`}
                  type="number"
                  min="0"
                  step="100"
                  defaultValue={dc.charge}
                  style={{ width: 120 }}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleDayChargeUpdate(dc._id)}
                  disabled={savingDayId === dc._id}
                >
                  {savingDayId === dc._id ? 'Saving...' : 'Update Charge'}
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => handleDeleteDayCharge(dc._id, `${dc.days} Days`)}
                  title="Delete this charge setting"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form to Add New Day Charge */}
        <form className="card" onSubmit={handleAddDayCharge} style={{ padding: 16, background: '#091523', border: '1px dashed var(--border)' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '1rem' }}>+ Add New Duration Charge Option</h3>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label>Number of Days</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 5"
                value={newDays}
                onChange={(e) => setNewDays(e.target.value)}
                required
              />
            </div>
            <div className="field" style={{ flex: 1, minWidth: 140 }}>
              <label>Additional Charge (₹)</label>
              <input
                type="number"
                min="0"
                step="100"
                placeholder="e.g. 4000"
                value={newCharge}
                onChange={(e) => setNewCharge(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={isAddingDay}>
              {isAddingDay ? 'Adding...' : '+ Add Charge Setting'}
            </button>
          </div>
        </form>
      </div>

      {/* =========================================================
          PANEL 2: FLEET VEHICLE PER-KM PRICING
      ========================================================== */}
      <div className="admin-panel">
        <h2>Fleet Vehicle Rates (₹ per km)</h2>
        <p className="muted" style={{ marginBottom: 20 }}>
          Per-kilometer rates update automatically across Map Planner fare calculations and custom trip estimates.
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
                  style={{ width: 120 }}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleVehiclePriceUpdate(vehicle._id)}
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
