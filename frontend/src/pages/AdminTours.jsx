import { useEffect, useState } from "react";
import { getTours, getVehicles, updateTour } from "../services/api";
import { useToast } from "../context/ToastContext";
import AdminNav from "../components/AdminNav";
import "./AdminDashboard.css";

export default function AdminTours() {
  const [toursList, setToursList] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingTourId, setSavingTourId] = useState("");
  const toast = useToast();

  const fetchToursData = async () => {
    try {
      setLoading(true);
      const [toursRes, vehiclesRes] = await Promise.all([
        getTours(),
        getVehicles()
      ]);
      const list = Array.isArray(toursRes) ? toursRes : (toursRes?.tours || []);
      setToursList(list);
      setVehicles(vehiclesRes || []);
    } catch (err) {
      setError(err.message || "Failed to load tour packages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToursData();
  }, []);

  const handleTourPriceUpdate = async (tourId) => {
    const input = document.getElementById(`tour-price-${tourId}`);
    const value = Number(input?.value);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter a valid tour price.");
      return;
    }

    try {
      setSavingTourId(tourId);
      setError("");
      await updateTour(tourId, { price: value });
      setToursList(prev => prev.map(t => (t._id === tourId || t.id === tourId) ? { ...t, price: value } : t));
      toast?.showToast("Tour price updated", { type: "success" });
    } catch (err) {
      setError(err.message || "Failed to update tour price.");
      toast?.showToast(err.message || "Failed to update tour price", { type: "error" });
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
      setToursList(prev => prev.map(t => (t._id === tourId || t.id === tourId) ? { ...t, pricePerPerson: value } : t));
      toast?.showToast("Tour per-person price updated", { type: "success" });
    } catch (err) {
      setError(err.message || "Failed to update per-person price.");
      toast?.showToast(err.message || "Failed to update per-person price", { type: "error" });
    } finally {
      setSavingTourId("");
    }
  };

  const handleTourVehicleUpdate = async (tourId) => {
    const select = document.getElementById(`tour-vehicle-${tourId}`);
    const vehicleName = select?.value;
    if (!vehicleName) {
      setError("Select a valid vehicle.");
      return;
    }
    try {
      setSavingTourId(tourId);
      setError("");
      const res = await updateTour(tourId, { vehicle: vehicleName });
      const updatedTour = res?.tour || { vehicle: vehicleName };
      setToursList(prev => prev.map(t => (t._id === tourId || t.id === tourId) ? { ...t, ...updatedTour, vehicle: vehicleName } : t));
      toast?.showToast("Tour vehicle updated", { type: "success" });
    } catch (err) {
      setError(err.message || "Failed to update tour vehicle.");
      toast?.showToast(err.message || "Failed to update tour vehicle", { type: "error" });
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
      toast?.showToast("Tour available dates updated", { type: "success" });
    } catch (err) {
      setError(err.message || "Failed to update tour dates.");
      toast?.showToast(err.message || "Failed to update tour dates", { type: "error" });
    } finally {
      setSavingTourId("");
    }
  };

  if (loading) return <div className="page container"><h2>Loading tour packages...</h2></div>;

  return (
    <div className="page container admin-page">
      <div className="admin-header">
        <div className="admin-header-content">
          <span className="admin-badge">Tour Package Management</span>
          <h1 className="section-title">Manage Tour Packages</h1>
          <p>Modify tour prices, update per-person rates, add travel dates, and assign vehicles.</p>
        </div>
        <div className="admin-pill">
          Active Packages
          <strong>{toursList.length}</strong>
        </div>
      </div>

      <AdminNav />

      {error && <div className="notice error">{error}</div>}

      <div className="admin-panel">
        <h2>Curated Experiences & Packages</h2>
        <div style={{ display: 'grid', gap: 16 }}>
          {toursList.map((t) => (
            <div key={t._id || t.id} className="admin-price-item">
              <div className="admin-price-meta">
                <strong style={{ fontSize: '1.1rem' }}>{t.title}</strong>
                <span>{t.destination} · {t.duration}</span>
                {t.vehicle && (
                  <span style={{ display: 'block', marginTop: 4, color: '#62e6d0', fontSize: '0.88rem' }}>
                    Assigned vehicle: <strong>{t.vehicle}</strong>
                  </span>
                )}
              </div>

              <div className="admin-price-controls">
                <label htmlFor={`tour-price-${t._id || t.id}`}>Package Price (₹)</label>
                <input
                  key={`price-${t._id || t.id}-${t.price}`}
                  id={`tour-price-${t._id || t.id}`}
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={t.price}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={() => handleTourPriceUpdate(t._id || t.id)}
                  disabled={savingTourId === (t._id || t.id)}
                >
                  {savingTourId === (t._id || t.id) ? 'Saving...' : 'Update'}
                </button>

                <label htmlFor={`tour-perperson-${t._id || t.id}`}>Price / person (₹)</label>
                <input
                  key={`perperson-${t._id || t.id}-${t.pricePerPerson ?? t.price}`}
                  id={`tour-perperson-${t._id || t.id}`}
                  type="number"
                  min="1"
                  step="1"
                  defaultValue={t.pricePerPerson ?? t.price}
                />
                <button
                  className="btn btn-secondary"
                  type="button"
                  onClick={() => handleTourPerPersonUpdate(t._id || t.id)}
                  disabled={savingTourId === (t._id || t.id)}
                >
                  {savingTourId === (t._id || t.id) ? 'Saving...' : 'Update per-person'}
                </button>
              </div>

              {/* Assign Vehicle Section */}
              <div style={{ gridColumn: '1 / -1', marginTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--primary-2, #62e6d0)' }}>Assign Tour Vehicle</strong>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    id={`tour-vehicle-${t._id || t.id}`}
                    defaultValue={t.vehicle || ''}
                    style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border)', background: '#0a1726', color: '#fff', minWidth: 200 }}
                  >
                    <option value="">— Select vehicle —</option>
                    {vehicles.map(v => (
                      <option key={v._id || v.id} value={v.name}>
                        {v.name} (Cap: {v.capacity} seats, ₹{v.costPerKm}/km)
                      </option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={() => handleTourVehicleUpdate(t._id || t.id)}
                    disabled={savingTourId === (t._id || t.id)}
                    style={{ padding: '8px 14px', fontSize: '0.85rem' }}
                  >
                    {savingTourId === (t._id || t.id) ? 'Saving...' : 'Update Vehicle'}
                  </button>
                </div>
              </div>

              {/* Dates Management Section */}
              <div style={{ gridColumn: '1 / -1', marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: '0.88rem', color: 'var(--primary-2, #62e6d0)' }}>Available Dates</strong>
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
                    const formattedList = futureList.map(dStr => new Date(dStr).toISOString().split('T')[0]);

                    if (formattedList.length === 0) {
                      return <span style={{ fontSize: '0.85rem', color: '#f87171' }}>No upcoming dates scheduled.</span>;
                    }

                    return formattedList.map(dStr => (
                      <span
                        key={dStr}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(98, 230, 208, 0.12)', border: '1px solid rgba(98, 230, 208, 0.3)', color: '#62e6d0', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem' }}
                      >
                        {new Date(dStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        <button
                          type="button"
                          onClick={() => {
                            const nextList = formattedList.filter(x => x !== dStr);
                            handleTourDatesUpdate(t._id || t.id, nextList);
                          }}
                          style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontWeight: 'bold', padding: 0 }}
                        >
                          ✕
                        </button>
                      </span>
                    ));
                  })()}
                </div>

                {/* Add Date Input */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <input
                    type="date"
                    id={`add-date-${t._id || t.id}`}
                    min={new Date().toISOString().split('T')[0]}
                    style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#0a1726', color: '#fff', fontSize: '0.85rem' }}
                  />
                  <button
                    className="btn btn-secondary"
                    type="button"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                    onClick={() => {
                      const input = document.getElementById(`add-date-${t._id || t.id}`);
                      const val = input?.value;
                      if (!val) return alert('Select a date.');
                      const currentList = Array.isArray(t.availableDates) && t.availableDates.length ? t.availableDates : (Array.isArray(t.dates) ? t.dates : []);
                      const formattedList = currentList.map(dStr => new Date(dStr).toISOString().split('T')[0]);
                      if (formattedList.includes(val)) return alert('Date already added.');
                      const nextList = [...formattedList, val];
                      handleTourDatesUpdate(t._id || t.id, nextList);
                      if (input) input.value = '';
                    }}
                  >
                    + Add Date
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
