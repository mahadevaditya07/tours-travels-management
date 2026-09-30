import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createBooking, getVehicles, getTourById, getDayCharges } from "../services/api";
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
      getTourById(tourId)
        .then((res) => {
          if (isMounted && res?.tour) {
            setTour(res.tour);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [passedTour?.id, passedTour?._id]);

  const planner = location.state?.planner || (tour ? {
    start: "Hubli",
    destination: tour.destination?.split(",")[0] || "Gokarna",
    stops: [],
    days: 2,
    members: 1,
    vehicleId: "",
    distance: 210,
    travelCost: 0,
  } : {
    start: "Dharwad",
    destination: "Gokarna",
    stops: [],
    days: 2,
    members: 1,
    vehicleId: "suv",
    distance: 310,
    travelCost: 0,
  });

  const [vehicleList, setVehicleList] = useState(mockVehicles);
  const [selectedVehicleId, setSelectedVehicleId] = useState(location.state?.planner?.vehicleId || "");
  const [days, setDays] = useState(Number(planner.days || 2));
  const [dayCharges, setDayCharges] = useState([]);

  useEffect(() => {
    let isMounted = true;
    getVehicles().then((data) => {
      if (isMounted && data && data.length > 0) {
        setVehicleList(data);
      }
    });
    getDayCharges().then((data) => {
      if (isMounted && Array.isArray(data) && data.length > 0) {
        setDayCharges(data);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const vehicle = useMemo(() => {
    if (!hasCustomPlanner && tour?.vehicle) {
      const matchTourVehicle = vehicleList.find(
        (v) => v.name === tour.vehicle || v.id === tour.vehicle || v._id === tour.vehicle
      );
      if (matchTourVehicle) return matchTourVehicle;
    }

    if (selectedVehicleId) {
      const match = vehicleList.find(
        (v) => v.id === selectedVehicleId || v._id === selectedVehicleId || v.name === selectedVehicleId
      );
      if (match) return match;
    }

    if (hasCustomPlanner && planner?.vehicleId) {
      const matchPlannerVehicle = vehicleList.find(
        (v) => v.id === planner.vehicleId || v._id === planner.vehicleId || v.name === planner.vehicleId
      );
      if (matchPlannerVehicle) return matchPlannerVehicle;
    }

    if (tour?.vehicle) {
      const matchTourVehicle = vehicleList.find(
        (v) => v.name === tour.vehicle || v.id === tour.vehicle || v._id === tour.vehicle
      );
      if (matchTourVehicle) return matchTourVehicle;
    }

    return vehicleList[0];
  }, [hasCustomPlanner, tour?.vehicle, selectedVehicleId, planner?.vehicleId, vehicleList]);

  const routeStart = tour ? "Hubli" : (typeof planner.start === "string" ? planner.start : planner.start?.name || "Hubli");
  const routeDestination = typeof planner.destination === "string" ? planner.destination : planner.destination?.name || "Gokarna";
  const routeStops = Array.isArray(planner.stops) ? planner.stops : [];

  const fullRouteText = useMemo(() => {
    if (planner.fullRoute) return planner.fullRoute;
    const parts = [routeStart];
    routeStops.forEach((s) => parts.push(typeof s === "string" ? s : s.name));
    parts.push(routeDestination);
    const last = parts[parts.length - 1];
    if (last.toLowerCase() !== "hubli") {
      parts.push("Hubli");
    }
    return parts.filter(Boolean).join(" → ");
  }, [planner.fullRoute, routeStart, routeStops, routeDestination]);

  const nights = Math.max(0, days - 1);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDateStr = tomorrow.toISOString().split("T")[0];

  const tourAvailableDates = useMemo(() => {
    if (!tour) return [];
    const todayTime = new Date().setHours(0, 0, 0, 0);
    const raw = Array.isArray(tour.dates) && tour.dates.length ? tour.dates : (Array.isArray(tour.availableDates) ? tour.availableDates : []);
    return raw.map((d) => {
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

  const [traveler, setTraveler] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [members, setMembers] = useState(Number(planner.members || 1));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Pricing calculations according to prompt specification
  const distanceVal = Number(planner.distance || 0);
  const travelCost = distanceVal ? Math.round(distanceVal * vehicle.costPerKm) : Number(planner.travelCost || planner.vehicleCost || 0);
  
  const additionalCharges = useMemo(() => {
    const match = dayCharges.find((dc) => Number(dc.days) === Number(days));
    if (match) return match.charge;
    return Math.max(0, (days - 1) * 1000);
  }, [dayCharges, days]);

  const tourBaseCost = (tour?.price || 0) * Number(members || 1);
  const total = tourBaseCost + travelCost + additionalCharges;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    const maxPassengers = Math.max(0, vehicle.capacity - 1);
    if (Number(members || 1) > maxPassengers) {
      return setError(`Selected vehicle cannot accommodate all travelers. Max passengers for ${vehicle.name} is ${maxPassengers}.`);
    }
    setSaving(true);
    try {
      const booking = await createBooking({
        traveler,
        tourId: tour?.id || null,
        tour: tour?.title || "Custom trip",
        start: routeStart,
        destination: routeDestination,
        stops: routeStops,
        fullRoute: fullRouteText,
        days,
        nights,
        date,
        members: Number(members || 1),
        vehicle: vehicle.name,
        vehicleRate: vehicle.costPerKm,
        distance: distanceVal,
        travelCost,
        basePrice: tourBaseCost,
        vehicleCost: travelCost,
        additionalCharges,
        totalPrice: total,
      });

      if (booking?.debug?.confirmationLink) {
        navigate("/my-bookings", {
          state: { success: `Booking created. Confirmation link: ${booking.debug.confirmationLink}` },
        });
      } else {
        navigate("/my-bookings", {
          state: { success: `Booking ${booking.id || booking._id} created successfully.` },
        });
      }
    } catch (err) {
      setError(err?.message || "Booking failed. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="container page-title-wrap">
        <span className="eyebrow">Secure your journey</span>
        <h1 className="section-title">Confirm your booking.</h1>
        <p className="muted">Review your route, traveler details and transparent price breakdown.</p>
      </div>

      <div className="container booking-layout">
        <form className="card booking-form" onSubmit={submit}>
          {error && <div className="notice error">{error}</div>}
          <h2>Traveler information</h2>
          <div className="form-grid">
            <div className="field">
              <label>Name</label>
              <input
                required
                value={traveler.name}
                onChange={(e) => setTraveler({ ...traveler, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Email</label>
              <input
                required
                type="email"
                value={traveler.email}
                onChange={(e) => setTraveler({ ...traveler, email: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Phone</label>
              <input
                required
                value={traveler.phone}
                onChange={(e) => setTraveler({ ...traveler, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="travel-date">
                Travel date {tourAvailableDates.length > 0 ? "(Tour available date)" : ""}
              </label>
              {tourAvailableDates.length > 0 ? (
                <select
                  id="travel-date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                >
                  {tourAvailableDates.map((d) => (
                    <option key={d} value={d}>
                      {new Date(d).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      ({d})
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
                  onChange={(e) => setDate(e.target.value)}
                  style={{ colorScheme: "dark" }}
                />
              )}
            </div>
          </div>

          <h2>Trip & Duration details</h2>
          <div className="trip-summary">
            <div>
              <span>Tour Package</span>
              <strong>{tour?.title || "Custom Trip"}</strong>
            </div>
            <div>
              <span>Tour Route</span>
              <strong style={{ color: "#60a5fa" }}>{fullRouteText}</strong>
            </div>
            <div>
              <span>Duration</span>
              <strong>
                <select
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "#0a1726", color: "#fff", fontSize: "0.9rem" }}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14].map((d) => (
                    <option key={d} value={d}>
                      {d} Day{d > 1 ? "s" : ""} / {d - 1} Night{d - 1 !== 1 ? "s" : ""}
                    </option>
                  ))}
                </select>
              </strong>
            </div>
            <div>
              <span>Travelers</span>
              <strong>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, vehicle.capacity)}
                  value={members}
                  onChange={(e) => setMembers(Number(e.target.value) || 1)}
                  style={{ width: 80, padding: "4px 8px" }}
                />
              </strong>
            </div>
            <div>
              <span>Vehicle</span>
              <select
                value={vehicle.id || vehicle._id || vehicle.name}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)", background: "#0a1726", color: "#fff", fontSize: "0.88rem" }}
              >
                {vehicleList.map((v) => (
                  <option key={v._id || v.id} value={v.id || v._id || v.name}>
                    {v.name} ({v.capacity} seats, ₹{v.costPerKm}/km)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span>Total Distance</span>
              <strong>{distanceVal} km</strong>
            </div>
          </div>

          {isAuthenticated ? (
            <button className="btn btn-primary full" disabled={saving}>
              {saving ? "Confirming booking..." : "Confirm booking →"}
            </button>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              <div className="notice">You must be signed in to confirm a booking.</div>
              <Link className="btn btn-primary full" to="/login" state={{ from: "/booking", planner: { ...planner, days, members } }}>
                Sign in to confirm →
              </Link>
            </div>
          )}
        </form>

        {/* ====================================================
            BOOKING SUMMARY & PRICE BREAKDOWN
        ===================================================== */}
        <aside className="price-card card">
          {tour && <img src={tour.image} alt={tour.title} style={{ marginBottom: 12, borderRadius: 8, height: 160, objectFit: 'cover', width: '100%' }} />}
          <div className="price-content">
            <span className="eyebrow">Booking Summary</span>
            <h2 style={{ fontSize: "1.8rem", color: "#10b981", margin: "4px 0 16px" }}>₹{total.toLocaleString("en-IN")}</h2>
            
            <div className="price-lines" style={{ display: "grid", gap: 8, fontSize: "0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tour Route:</span>
                <strong style={{ textAlign: "right", maxWidth: "60%" }}>{fullRouteText}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Duration:</span>
                <strong>{days} Day{days > 1 ? "s" : ""} / {nights} Night{nights !== 1 ? "s" : ""}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Total Distance:</span>
                <strong>{distanceVal} km</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Vehicle:</span>
                <strong>{vehicle.name}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Vehicle Rate:</span>
                <strong>₹{vehicle.costPerKm}/km</strong>
              </div>

              {tourBaseCost > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Base Package Cost:</span>
                  <strong>₹{tourBaseCost.toLocaleString("en-IN")}</strong>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Travel Cost:</span>
                <strong>₹{travelCost.toLocaleString("en-IN")}</strong>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Additional Stay/Day Charge:</span>
                <strong>₹{additionalCharges.toLocaleString("en-IN")}</strong>
              </div>
            </div>

            <div className="price-total" style={{ borderTop: "1px solid var(--border)", paddingTop: 12, marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: "1.1rem" }}>
              <span>Total Tour Price:</span>
              <strong style={{ color: "#10b981" }}>₹{total.toLocaleString("en-IN")}</strong>
            </div>

            <Link className="btn btn-secondary full" to="/map-planner" state={{ tour }} style={{ marginTop: 16 }}>
              ← Modify Route & Duration
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}