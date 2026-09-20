import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking, getVehicles, getTourById } from "../services/api";
import { tours, vehicles as mockVehicles } from "../data/mockData";
import "./Booking.css";

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const passedTour = location.state?.tour || null;
  const [tour, setTour] = useState(passedTour);
  const hasCustomPlanner = Boolean(location.state?.planner);

  useEffect(() => {
    let isMounted = true;
    const tourId = passedTour?.id || passedTour?._id;
    if (tourId) {
      getTourById(tourId).then(res => {
        if (isMounted && res?.tour) {
          setTour(res.tour);
        }
      }).catch(() => {});
    }
    return () => { isMounted = false; };
  }, [passedTour?.id, passedTour?._id]);

  const planner = location.state?.planner || (tour ? {
    start: "Hubli",
    destination: tour.destination?.split(",")[0] || "Gokarna",
    stops: [],
    members: 1,
    vehicleId: "",
    distance: 0,
    vehicleCost: 0
  } : {
    start: "Hubli",
    destination: "Gokarna",
    stops: [],
    members: 1,
    vehicleId: "suv",
    distance: 210,
    vehicleCost: 0
  });

  const [vehicleList, setVehicleList] = useState(mockVehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState(location.state?.planner?.vehicleId || "");

  useEffect(() => {
    let isMounted = true;
    getVehicles().then(data => {
      if (isMounted && data && data.length > 0) {
        setVehicleList(data);
      }
    });
    return () => { isMounted = false; };
  }, []);

  const vehicle = useMemo(() => {
    // 1. For fixed tour package bookings, prioritize tour.vehicle assigned by Admin
    if (!hasCustomPlanner && tour?.vehicle) {
      const matchTourVehicle = vehicleList.find(
        v => v.name === tour.vehicle || v.id === tour.vehicle || v._id === tour.vehicle
      );
      if (matchTourVehicle) return matchTourVehicle;
    }

    // 2. If user selected a vehicle (e.g. from Map Planner or custom selection)
    if (selectedVehicleId) {
      const match = vehicleList.find(
        v => v.id === selectedVehicleId || v._id === selectedVehicleId || v.name === selectedVehicleId
      );
      if (match) return match;
    }

    // 3. Fallback for custom planner
    if (hasCustomPlanner && planner?.vehicleId) {
      const matchPlannerVehicle = vehicleList.find(
        v => v.id === planner.vehicleId || v._id === planner.vehicleId || v.name === planner.vehicleId
      );
      if (matchPlannerVehicle) return matchPlannerVehicle;
    }

    // 4. Default to matching tour.vehicle or first vehicle
    if (tour?.vehicle) {
      const matchTourVehicle = vehicleList.find(
        v => v.name === tour.vehicle || v.id === tour.vehicle || v._id === tour.vehicle
      );
      if (matchTourVehicle) return matchTourVehicle;
    }

    return vehicleList[0];
  }, [hasCustomPlanner, tour?.vehicle, selectedVehicleId, planner?.vehicleId, vehicleList]);
  const routeStart = tour ? "Hubli" : (typeof planner.start === "string" ? planner.start : planner.start?.name || "Hubli");
  const routeDestination = typeof planner.destination === "string" ? planner.destination : planner.destination?.name || "Gokarna";
  const routeStops = Array.isArray(planner.stops) ? planner.stops : [];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  const tourAvailableDates = useMemo(() => {
    if (!tour) return [];
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const raw = Array.isArray(tour.dates) && tour.dates.length ? tour.dates : (Array.isArray(tour.availableDates) ? tour.availableDates : []);
    return raw.map(d => {
      try {
        const parsed = new Date(d);
        if (isNaN(parsed.getTime())) return null;
        const check = new Date(parsed);
        check.setHours(0, 0, 0, 0);
        if (check.getTime() <= todayTime) return null;
        return parsed.toISOString().split("T")[0];
      } catch {
        return null;
      }
    }).filter(Boolean);
  }, [tour]);

  const [date, setDate] = useState(() => {
    if (tourAvailableDates.length > 0) {
      return tourAvailableDates[0];
    }
    return minDateStr;
  });
  const [traveler,setTraveler] = useState({ name:user?.name || "", email:user?.email || "", phone:user?.phone || "" });
  const [members, setMembers] = useState(Number(planner.members || 1));
  const [error,setError] = useState(""); const [saving,setSaving] = useState(false);

  // recalculate vehicleCost based on live vehicle costPerKm if custom distance is available
  const distanceVal = Number(planner.distance || 0);
  const vehicleCost = distanceVal ? Math.round(distanceVal * vehicle.costPerKm) : (Number(planner.vehicleCost || 0));
  const additional = hasCustomPlanner ? 500 : 0;
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
        navigate("/my-bookings", { state:{success:`Booking ${booking.id || booking._id} created successfully.`} });
      }
    } catch (err) { setError(err?.message || "Booking failed. Please try again."); } finally { setSaving(false); }
  };

  return <div className="page"><div className="container page-title-wrap"><span className="eyebrow">Secure your journey</span><h1 className="section-title">Confirm your booking.</h1><p className="muted">Review your route, traveler details and estimated price.</p></div>
    <div className="container booking-layout"><form className="card booking-form" onSubmit={submit}>
      {error && <div className="notice error">{error}</div>}<h2>Traveler information</h2><div className="form-grid">
        <div className="field"><label>Name</label><input required value={traveler.name} onChange={e=>setTraveler({...traveler,name:e.target.value})}/></div>
        <div className="field"><label>Email</label><input required type="email" value={traveler.email} onChange={e=>setTraveler({...traveler,email:e.target.value})}/></div>
        <div className="field"><label>Phone</label><input required value={traveler.phone} onChange={e=>setTraveler({...traveler,phone:e.target.value})}/></div>
        <div className="field">
          <label htmlFor="travel-date">Travel date {tourAvailableDates.length > 0 ? '(Tour available date)' : ''}</label>
          {tourAvailableDates.length > 0 ? (
            <select
              id="travel-date"
              required
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            >
              {tourAvailableDates.map(d => (
                <option key={d} value={d}>
                  {new Date(d).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })} ({d})
                </option>
              ))}
            </select>
          ) : (
            <input
              id="travel-date"
              required
              type="date"
              min={minDateStr}
              value={date}
              onChange={e => setDate(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
          )}
        </div>
      </div>
      <h2>Trip information</h2>
      <div className="trip-summary">
        <div><span>Tour</span><strong>{tour?.title || "Custom trip"}</strong></div>
        <div><span>Route</span><strong>{routeStart} → {routeDestination} {tour ? '(Hubli Departure)' : ''}</strong></div>
        <div><span>Stops</span><strong>{routeStops.length ? routeStops.map(s=>typeof s === "string" ? s : s.name).join(", ") : "No extra stops"}</strong></div>
        <div><span>Travelers</span><strong>
            <input type="number" min={1} max={Math.max(1, vehicle.capacity)} value={members} onChange={e=>setMembers(Number(e.target.value) || 1)} style={{width:80}} />
          </strong></div>
        <div>
          <span>Vehicle</span>
          {hasCustomPlanner ? (
            <select
              value={vehicle.id || vehicle._id || vehicle.name}
              onChange={e => setSelectedVehicleId(e.target.value)}
              style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border)', background: '#0a1726', color: '#fff', fontSize: '0.88rem' }}
            >
              {vehicleList.map(v => (
                <option key={v._id || v.id} value={v.id || v._id || v.name}>
                  {v.name} ({v.capacity} seats, ₹{v.costPerKm}/km)
                </option>
              ))}
            </select>
          ) : (
            <strong>{vehicle.name}</strong>
          )}
        </div>
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
      <aside className="price-card card"><img src={tour.image} alt={tour.title}/><div className="price-content"><span className="eyebrow">Estimated total</span><h2>₹{total.toLocaleString("en-IN")}</h2><div className="price-lines"><div><span>Base tour ({members} {members > 1 ? 'persons' : 'person'})</span><strong>₹{((tour.price||0)*Number(members || 1)).toLocaleString("en-IN")}</strong></div>{vehicleCost > 0 && <div><span>Vehicle</span><strong>₹{vehicleCost.toLocaleString("en-IN")}</strong></div>}{additional > 0 && <div><span>Additional charges</span><strong>₹{additional.toLocaleString("en-IN")}</strong></div>}</div><div className="price-total"><span>Total estimate</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><Link className="btn btn-secondary full" to="/map-planner" state={{tour}}>Customize route</Link></div></aside>
    ) : (
      <aside className="price-card card"><div className="price-content"><span className="eyebrow">Estimated total</span><h2>₹{total.toLocaleString("en-IN")}</h2><div className="price-lines"><div><span>Base tour</span><strong>₹{0}</strong></div><div><span>Vehicle</span><strong>₹{vehicleCost.toLocaleString("en-IN")}</strong></div><div><span>Additional charges</span><strong>₹{additional.toLocaleString("en-IN")}</strong></div></div><div className="price-total"><span>Total estimate</span><strong>₹{total.toLocaleString("en-IN")}</strong></div><Link className="btn btn-secondary full" to="/map-planner">← Edit route</Link></div></aside>
    )}
    </div>
  </div>;
}