import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { attractions, locations, vehicles } from "../data/mockData";
import { buildRoutePoints, ensureStop, getRouteDistance } from "./mapPlannerUtils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

function AutoCenterMap({ route }) {
  const map = useMap();

  useEffect(() => {
    if (!route || route.length < 2) return;

    const bounds = L.latLngBounds(route);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
  }, [map, route]);

  return null;
}

const geocodePlace = async (rawValue) => {
  const query = (rawValue || "").trim();
  if (!query) return null;

  if (locations[query]) {
    return { name: query, coords: locations[query] };
  }

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/json" }
    });

    if (!response.ok) return null;
    const results = await response.json();
    const place = results?.[0];
    if (!place) return null;

    return {
      name: place.display_name?.split(",")[0]?.trim() || query,
      coords: [Number(place.lat), Number(place.lon)]
    };
  } catch {
    return null;
  }
};

export default function MapPlanner() {
  const location = useLocation();
  const passedTour = location.state?.tour;
  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(null);
  const [startInput, setStartInput] = useState("");
  const [destinationInput, setDestinationInput] = useState("");
  const [stops, setStops] = useState([]);
  const [newStopName, setNewStopName] = useState("");
  const [members, setMembers] = useState(2);
  const [vehicleId, setVehicleId] = useState("suv");
  const [isFindingPlace, setIsFindingPlace] = useState(false);

  const displayName = (v, fallback) => (typeof v === "string" ? v : v?.name || fallback || "—");
  const routeNames = [displayName(start, "Start"), ...stops.map((s) => s.name), displayName(destination, "Destination")];
  const route = useMemo(() => {
    if (!start || !destination) return [];
    return buildRoutePoints(start, destination, stops);
  }, [start, destination, stops]);
  const totalDistance = useMemo(() => getRouteDistance(route), [route]);
  const vehicle = vehicles.find((v) => v.id === vehicleId) || vehicles[1];
  const fuelCost = totalDistance ? Math.ceil(totalDistance / vehicle.mileage) * 100 : 0;
  const destKey = typeof destination === "string" ? destination : (passedTour?.destination?.split(",")[0] || "Gokarna");
  const nearby = attractions[destKey] || attractions.Gokarna || [];
  const plannerStart = typeof start === "string" ? start : start?.name || "Start";
  const plannerDestination = typeof destination === "string" ? destination : destination?.name || "Destination";
  const passedTourCity = passedTour?.destination?.split(",")[0];
  const passTour = passedTour && passedTourCity && plannerDestination && (plannerDestination.toLowerCase() === passedTourCity.toLowerCase());

  const resolvePlace = async (type, value) => {
    const query = (value || "").trim();
    if (!query) {
      if (type === "start") setStart(null);
      if (type === "destination") setDestination(null);
      return;
    }

    setIsFindingPlace(true);
    const resolved = await geocodePlace(query);
    setIsFindingPlace(false);
    if (!resolved) return;

    if (type === "start") {
      setStart({ id: `start-${Date.now()}`, name: resolved.name, coords: resolved.coords });
      setStartInput(resolved.name);
    }

    if (type === "destination") {
      setDestination({ id: `destination-${Date.now()}`, name: resolved.name, coords: resolved.coords });
      setDestinationInput(resolved.name);
    }
  };

  const addStop = async (place) => {
    const candidate = typeof place === "string" ? place : place?.name;
    const query = (candidate || "").trim();
    if (!query) return;

    let nextStop = typeof place === "string"
      ? ensureStop(place, stops.length, { start, destination })
      : ensureStop(place, stops.length, { start, destination });

    if (!nextStop || !nextStop.name) return;

    if (!nextStop.coords) {
      const resolved = await geocodePlace(query);
      if (resolved) {
        nextStop = { ...nextStop, name: resolved.name, coords: resolved.coords };
      }
    }

    setStops((current) => {
      if (current.some((s) => s.name.toLowerCase() === nextStop.name.toLowerCase())) return current;
      return [...current, nextStop];
    });
    setNewStopName("");
  };

  const handleRouteKeyDown = (type, event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (type === "start") resolvePlace("start", startInput);
      if (type === "destination") resolvePlace("destination", destinationInput);
    }
  };

  const clearRoute = () => {
    setStart(null);
    setDestination(null);
    setStartInput("");
    setDestinationInput("");
    setStops([]);
    setNewStopName("");
  };

  return <div className="page planner-page"><div className="container page-title-wrap"><span className="eyebrow">Smart route planner</span><h1 className="section-title">Build the journey your way.</h1><p className="muted">Type your start, destination and stops to place them on the map.</p></div>
    <div className="container planner-grid">
      <aside className="planner-controls card">
        <div className="planner-step"><span>01</span><div><h3>Route</h3><div className="form-grid">
          <div className="field"><label>Starting location</label><input type="text" value={startInput} onChange={(e) => setStartInput(e.target.value)} onBlur={() => resolvePlace("start", startInput)} onKeyDown={(e) => handleRouteKeyDown("start", e)} placeholder="e.g. Hubli" /></div>
          <div className="field"><label>Destination</label><input type="text" value={destinationInput} onChange={(e) => setDestinationInput(e.target.value)} onBlur={() => resolvePlace("destination", destinationInput)} onKeyDown={(e) => handleRouteKeyDown("destination", e)} placeholder="e.g. Gokarna" /></div>
        </div>
        {isFindingPlace && <p className="muted tiny" style={{ marginTop: 8 }}>Finding location on map...</p>}</div></div>
        <div className="planner-step"><span>02</span><div><h3>Stops</h3><div className="field stop-input-group"><label>Add a place or stop name</label><div className="stop-input-row"><input type="text" value={newStopName} onChange={(e) => setNewStopName(e.target.value)} placeholder="e.g. Om Beach / Yana Caves" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addStop(newStopName); } }}/><button type="button" className="btn btn-secondary" onClick={() => addStop(newStopName)}>Add</button></div></div><div className="stop-list">{stops.length ? stops.map((s, idx) => {
            const item = typeof s === "string" ? { id: s, name: s } : s;
            return (
              <div className="stop-item" key={item.id}>
                <span>{item.name}</span>
                <div className="stop-actions">
                  <button className="btn" onClick={() => {
                    if (idx === 0) return;
                    const copy = [...stops];
                    const tmp = copy[idx - 1]; copy[idx - 1] = copy[idx]; copy[idx] = tmp;
                    setStops(copy);
                  }} disabled={idx === 0}>↑</button>
                  <button className="btn" onClick={() => {
                    if (idx === stops.length - 1) return;
                    const copy = [...stops];
                    const tmp = copy[idx + 1]; copy[idx + 1] = copy[idx]; copy[idx] = tmp;
                    setStops(copy);
                  }} disabled={idx === stops.length - 1}>↓</button>
                  <button className="btn" onClick={() => {
                    const name = window.prompt("Edit stop name", item.name);
                    if (!name) return;
                    const copy = [...stops];
                    copy[idx] = { ...(copy[idx] || {}), name };
                    setStops(copy);
                  }}>Edit</button>
                  <button className="btn btn-danger" onClick={() => setStops(stops.filter((_, i) => i !== idx))}>×</button>
                </div>
              </div>
            );
          }) : <p className="muted">No extra stops yet. Add a place name to place stops on the map.</p>}</div></div></div>
        <div className="planner-step"><span>03</span><div><h3>Travelers & vehicle</h3><div className="form-grid"><div className="field"><label>Members</label><input type="number" min="1" max="25" value={members} onChange={(e) => setMembers(Number(e.target.value))}/></div><div className="field"><label>Vehicle</label><select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>{vehicles.map(v => <option key={v.id} value={v.id}>{v.name} · {v.capacity} seats</option>)}</select></div></div>{members > vehicle.capacity && <div className="notice error">This vehicle cannot accommodate {members} travelers. Choose a larger vehicle.</div>}</div></div>
        <div className="planner-summary" style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div><span>Route</span><strong>{plannerStart} → {plannerDestination}</strong></div>
            <div><span>Stops</span><strong>{stops.length ? stops.length : 0}</strong></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div><span>Distance</span><strong>{Math.round(totalDistance)} km</strong></div>
            <div><span>Time</span><strong>{Math.max(1, Math.round(totalDistance / 50))} hrs</strong></div>
            <div><span>Fuel</span><strong>₹{fuelCost.toLocaleString("en-IN")}</strong></div>
          </div>
        </div>
        <button type="button" className="btn btn-secondary full" onClick={clearRoute}>Clear route</button>
        <Link className={`btn btn-primary full ${members > vehicle.capacity ? "disabled" : ""}`} to={members <= vehicle.capacity ? "/booking" : "#"} state={{ planner: { start: plannerStart, destination: plannerDestination, stops, members, vehicleId, distance: Math.round(totalDistance), fuelCost }, tour: passTour ? passedTour : undefined }}>Continue to booking →</Link>
      </aside>
      <section className="map-area">
        <div className="map-card card"><MapContainer center={route[0] || locations.Hubli} zoom={7} scrollWheelZoom className="map"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <AutoCenterMap route={route} />
            {start && <Marker position={start.coords}><Popup>{start.name}</Popup></Marker>}
            {destination && <Marker position={destination.coords}><Popup>{destination.name}</Popup></Marker>}
            {stops.map((stop) => stop.coords ? <Marker position={stop.coords} key={stop.id}><Popup>{stop.name}</Popup></Marker> : null)}
            {route.length > 1 && <><Polyline positions={route} pathOptions={{ color: '#fff', weight: 12, opacity: 0.8, lineCap: 'round', lineJoin: 'round' }} /><Polyline positions={route} pathOptions={{ color: '#1a73e8', weight: 7, opacity: 1, lineCap: 'round', lineJoin: 'round' }} /></>}
        </MapContainer><div className="route-pill">● {routeNames.join("  →  ")}</div></div>
        <div className="nearby-section"><div className="section-head"><div><span className="eyebrow">Around your destination</span><h2>Nearby places</h2></div></div><div className="nearby-grid">{nearby.map((place) => <div className="nearby-card card" key={place.id}><img src={place.image} alt={place.name}/><div><span>{place.type} · {place.distance} km</span><h3>{place.name}</h3><p className="muted">{place.description}</p><button className="btn btn-secondary" onClick={() => addStop(place)}>+ Add stop</button></div></div>)}</div></div>
      </section>
    </div>
  </div>;
}