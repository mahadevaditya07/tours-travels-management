import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking, getVehicles } from "../services/api";
import { tours, vehicles as mockVehicles } from "../data/mockData";
import "./Booking.css";

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const planner = location.state?.planner || { start:"Hubli", destination:"Gokarna", stops:[], members:2, vehicleId:"suv", distance:210, fuelCost:1500 };
  const tour = location.state?.tour || null;

  const [vehicleList, setVehicleList] = useState(mockVehicles);

  useEffect(() => {
    let isMounted = true;
    getVehicles().then(data => {
      if (isMounted && data && data.length > 0) {
        setVehicleList(data);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const vehicle = vehicleList.find(v => v.id === planner.vehicleId || v._id === planner.vehicleId) || vehicleList[1] || vehicleList[0];
  const routeStart = typeof planner.start === "string" ? planner.start : planner.start?.name || "Hubli";
  const routeDestination = typeof planner.destination === "string" ? planner.destination : planner.destination?.name || "Gokarna";
  const routeStops = Array.isArray(planner.stops) ? planner.stops : [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState(() => {
    if (tour?.dates?.length) {
      const upcoming = tour.dates.find(d => d >= minDateStr);
      if (upcoming) return upcoming;
    }
    return minDateStr;
  });
  const [traveler,setTraveler] = useState({ name:user?.name || "", email:user?.email || "", phone:user?.phone || "" });
  const [members, setMembers] = useState(Number(planner.members || 1));
  const [error,setError] = useState(""); const [saving,setSaving] = useState(false);

  // recalculate vehicleCost based on live vehicle costPerKm if distance available
  const distanceVal = Number(planner.distance || 0);
  const vehicleCost = distanceVal ? Math.round(distanceVal * vehicle.costPerKm) : (Number(planner.vehicleCost || 0));
  const additional = 500;
  const total = (tour?.price || 0) * Number(members || 1) + vehicleCost + additional;

  const submit = async e => {
    e.preventDefault(); setError("");
    const maxPassengers = Math.max(0, vehicle.capacity - 1);
    if (Number(members || 1) > maxPassengers) return setError(`Selected vehicle cannot accommodate all travelers. Max passengers for ${vehicle.name} is ${maxPassengers}.`);
    setSaving(true);
    try {
      const booking = await createBooking({ traveler, tourId: tour?.id || null, tour: tour?.title || "Custom trip", start:routeStart, destination:routeDestination, stops:routeStops, date, members:Number(members || 1), vehicle:vehicle.name, distance:Number(planner.distance || 0), basePrice:(planner.basePrice !== undefined ? planner.basePrice : (tour?.price || 0) * Number(members || 1)), vehicleCost, additional, total });
      // If backend returned a debug confirmation link (dev mode), show it to the user via state
      if (booking?.debug?.confirmationLink) {
        navigate('/my-bookings', { state: { success: `Booking created. Confirmation link: ${booking.debug.confirmationLink}` } });
      } else {
        navigate("/my-bookings", { state:{success:`Booking ${booking.id} created successfully.`} });
      }
    } catch (err) { setError(err?.message || "Booking failed. Please try again."); } finally { setSaving(false); }
  };

  return <div className="page"><div className="container page-title-wrap"><span className="eyebrow">Secure your journey</span><h1 className="section-title">Confirm your booking.</h1><p className="muted">Review your route, traveler details and estimated price.</p></div>
    <div className="container booking-layout"><form className="card booking-form" onSubmit={submit}>
      {error && <div className="notice error">{error}</div>}<h2>Traveler information</h2><div className="form-grid">
        <div className="field"><label>Name</label><input required value={traveler.name} onChange={e=>setTraveler({...traveler,name:e.target.value})}/></div>
        <div className="field"><label>Email</label><input required type="email" value={traveler.email} onChange={e=>setTraveler({...traveler,email:e.target.value})}/></div>
        <div className="field"><label>Phone</label><input required value={traveler.phone} onChange={e=>setTraveler({...traveler,phone:e.target.value})}/></div>
        <div className="field"><label htmlFor="travel-date">Travel date</label><input id="travel-date" required type="date" min={minDateStr} value={date} onChange={e=>setDate(e.target.value)} style={{colorScheme:'dark'}}/></div>
      </div>
      <h2>Trip information</h2>
      <div className="trip-summary">
        <div><span>Tour</span><strong>{tour?.title || "Custom trip"}</strong></div>
        <div><span>Route</span><strong>{routeStart} → {routeDestination}</strong></div>
        <div><span>Stops</span><strong>{routeStops.length ? routeStops.map(s=>typeof s === "string" ? s : s.name).join(", ") : "No extra stops"}</strong></div>
        <div><span>Travelers</span><strong>
            <input type="number" min={1} max={Math.max(1, vehicle.capacity)} value={members} onChange={e=>setMembers(Number(e.target.value) || 1)} style={{width:80}} />
          </strong></div>
        <div><span>Vehicle</span><strong>{vehicle.name}</strong></div>
        <div><span>Distance</span><strong>{Number(planner.distance || 0)} km</strong></div>
      </div>
      {isAuthenticated ? (
        <button className="btn btn-primary full" disabled={saving}>{saving ? "Confirming booking..." : "Confirm booking →"}</button>
      ) : (
        <div style={{display:'grid',gap:8}}>
          <div className="notice">You must be signed in to confirm a booking.</div>
          <Link className="btn btn-primary full" to="/login" state={{ from: '/booking', planner: { ...planner, members } }}>Sign in to confirm →</Link>
        </div>
      )}
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