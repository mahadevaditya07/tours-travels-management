import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking } from "../services/api";
import { tours, vehicles } from "../data/mockData";
import "./Booking.css";

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const planner = location.state?.planner || { start:"Hubli", destination:"Gokarna", stops:[], members:2, vehicleId:"suv", distance:210, fuelCost:1500 };
  const tour = location.state?.tour || null;
  const vehicle = vehicles.find(v=>v.id===planner.vehicleId) || vehicles[1];
  const routeStart = typeof planner.start === "string" ? planner.start : planner.start?.name || "Hubli";
  const routeDestination = typeof planner.destination === "string" ? planner.destination : planner.destination?.name || "Gokarna";
  const routeStops = Array.isArray(planner.stops) ? planner.stops : [];
  const [date,setDate] = useState(tour?.dates?.[0] || "");
  const [traveler,setTraveler] = useState({ name:user?.name || "", email:user?.email || "", phone:user?.phone || "" });
  const [error,setError] = useState(""); const [saving,setSaving] = useState(false);

  // prefer cost calculated by planner (fuelCost or vehicleCost) if available
  const vehicleCost = Number(planner.vehicleCost || planner.fuelCost || 0) || Number(planner.distance || 0) * vehicle.costPerKm;
  const additional = 500;
  const total = (tour?.price || 0) * Number(planner.members || 1) + vehicleCost + additional;

  const submit = async e => {
    e.preventDefault(); setError("");
    if (Number(planner.members || 1) > vehicle.capacity) return setError("Selected vehicle cannot accommodate all travelers.");
    setSaving(true);
    try {
      const booking = await createBooking({ traveler, tourId: tour?.id || null, tour: tour?.title || "Custom trip", start:routeStart, destination:routeDestination, stops:routeStops, date, members:Number(planner.members || 1), vehicle:vehicle.name, distance:Number(planner.distance || 0), basePrice:(planner.basePrice !== undefined ? planner.basePrice : (tour?.price || 0) * Number(planner.members || 1)), vehicleCost, additional, total });
      navigate("/my-bookings", { state:{success:`Booking ${booking.id} confirmed successfully.`} });
    } catch { setError("Booking failed. Please try again."); } finally { setSaving(false); }
  };

  return <div className="page"><div className="container page-title-wrap"><span className="eyebrow">Secure your journey</span><h1 className="section-title">Confirm your booking.</h1><p className="muted">Review your route, traveler details and estimated price.</p></div>
    <div className="container booking-layout"><form className="card booking-form" onSubmit={submit}>
      {error && <div className="notice error">{error}</div>}<h2>Traveler information</h2><div className="form-grid">
        <div className="field"><label>Name</label><input required value={traveler.name} onChange={e=>setTraveler({...traveler,name:e.target.value})}/></div>
        <div className="field"><label>Email</label><input required type="email" value={traveler.email} onChange={e=>setTraveler({...traveler,email:e.target.value})}/></div>
        <div className="field"><label>Phone</label><input required value={traveler.phone} onChange={e=>setTraveler({...traveler,phone:e.target.value})}/></div>
        <div className="field"><label>Travel date</label>{tour ? <select required value={date} onChange={e=>setDate(e.target.value)}>{(tour.dates || []).map(d=><option key={d} value={d}>{new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})}</option>)}</select> : <input required type="date" value={date} onChange={e=>setDate(e.target.value)} />}</div>
      </div>
      <h2>Trip information</h2>
      <div className="trip-summary">
        <div><span>Tour</span><strong>{tour?.title || "Custom trip"}</strong></div>
        <div><span>Route</span><strong>{routeStart} → {routeDestination}</strong></div>
        <div><span>Stops</span><strong>{routeStops.length ? routeStops.map(s=>typeof s === "string" ? s : s.name).join(", ") : "No extra stops"}</strong></div>
        <div><span>Travelers</span><strong>{planner.members || 1}</strong></div>
        <div><span>Vehicle</span><strong>{vehicle.name}</strong></div>
        <div><span>Distance</span><strong>{Number(planner.distance || 0)} km</strong></div>
      </div>
      <button className="btn btn-primary full" disabled={saving}>{saving ? "Confirming booking..." : "Confirm booking →"}</button>
      <p className="muted tiny">By confirming, this frontend creates a development booking. Final pricing and availability should be verified by the backend.</p>
    </form>
    {tour ? (
      <aside className="price-card card"><img src={tour.image} alt={tour.title}/><div className="price-content"><span className="eyebrow">Estimated total</span><h2>₹{total.toLocaleString("en-IN")}</h2><div className="price-lines"><div><span>Base tour</span><strong>₹{((tour.price||0)*planner.members).toLocaleString("en-IN")}</strong></div><div><span>Vehicle</span><strong>₹{vehicleCost.toLocaleString("en-IN")}</strong></div><div><span>Additional charges</span><strong>₹{additional.toLocaleString("en-IN")}</strong></div></div><div className="price-total"><span>Total estimate</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><Link className="btn btn-secondary full" to="/map-planner">← Edit route</Link></div></aside>
    ) : (
      <aside className="price-card card"><div className="price-content"><span className="eyebrow">Estimated total</span><h2>₹{total.toLocaleString("en-IN")}</h2><div className="price-lines"><div><span>Base tour</span><strong>₹{0}</strong></div><div><span>Vehicle</span><strong>₹{vehicleCost.toLocaleString("en-IN")}</strong></div><div><span>Additional charges</span><strong>₹{additional.toLocaleString("en-IN")}</strong></div></div><div className="price-total"><span>Total estimate</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><Link className="btn btn-secondary full" to="/map-planner">← Edit route</Link></div></aside>
    )}
    </div>
  </div>;
}