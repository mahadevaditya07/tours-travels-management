import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { attractions, locations, vehicles } from "../data/mockData";
import { buildRoutePoints, ensureStop, getRouteDistance } from "./mapPlannerUtils";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

export default function MapPlanner() {
  const location = useLocation();
  const passedTour = location.state?.tour;
  const [start, setStart] = useState(null);
  const [destination, setDestination] = useState(passedTour?.destination?.split(",")[0] || null);
  const [stops, setStops] = useState([]);
  const [newStopName, setNewStopName] = useState("");
  const [members, setMembers] = useState(2);
  const [vehicleId, setVehicleId] = useState("suv");
  const [clickMode, setClickMode] = useState('addStop'); // 'addStop' | 'setStart' | 'setDestination'

  const displayName = (v, fallback) => (typeof v === 'string' ? v : v?.name || fallback || '—');
  const routeNames = [displayName(start, 'Start'), ...stops.map(s => s.name), displayName(destination, 'Destination')];
  const route = useMemo(() => buildRoutePoints(start, destination, stops), [start, destination, stops]);
  const totalDistance = useMemo(() => getRouteDistance(route), [route]);
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const fuelCost = totalDistance ? Math.ceil(totalDistance / vehicle.mileage) * 100 : 0;
  const destKey = typeof destination === 'string' ? destination : (passedTour?.destination?.split(",")[0] || 'Gokarna');
  const nearby = attractions[destKey] || attractions.Gokarna || [];

  const addStop = (place) => {
    const nextStop = typeof place === "string"
      ? ensureStop(place, stops.length, { start, destination })
      : ensureStop(place, stops.length, { start, destination });

    if (!nextStop || !nextStop.name) return;
    setStops((current) => {
      if (current.some((s) => s.name.toLowerCase() === nextStop.name.toLowerCase())) return current;
      return [...current, nextStop];
    });
    setNewStopName("");
  };

  // Add stop by clicking on map: prompt for a name and use clicked coordinates
  function ClickHandler() {
    useMapEvents({
      click(e) {
        const lat = e.latlng.lat, lng = e.latlng.lng;
        if (clickMode === 'setStart') {
          const name = window.prompt('Name this start location (optional)');
          const id = `start-${Date.now()}`;
          setStart({ id, name: name || `Start ${lat.toFixed(3)},${lng.toFixed(3)}`, coords: [lat, lng] });
          return;
        }
        if (clickMode === 'setDestination') {
          const name = window.prompt('Name this destination (optional)');
          const id = `dest-${Date.now()}`;
          setDestination({ id, name: name || `Destination ${lat.toFixed(3)},${lng.toFixed(3)}`, coords: [lat, lng] });
          return;
        }
        // default: add stop
        const name = window.prompt('Enter a name for this stop (leave blank to cancel)');
        if (!name) return;
        const id = `custom-${Date.now()}`;
        const place = { id, name, coords: [lat, lng] };
        addStop(place);
      }
    });
    return null;
  }

  return <div className="page planner-page"><div className="container page-title-wrap"><span className="eyebrow">Smart route planner</span><h1 className="section-title">Build the journey your way.</h1><p className="muted">Choose your route, add memorable stops and estimate travel cost before booking.</p></div>
    <div className="container planner-grid">
      <aside className="planner-controls card">
        <div className="planner-step"><span>01</span><div><h3>Route</h3><div className="form-grid">
          <div className="field"><label>Starting location</label><input type="text" value={typeof start === 'string' ? start : (start?.name || '')} onChange={e=>setStart(e.target.value || null)} placeholder="Type a place or click map to set"/></div>
          <div className="field"><label>Destination</label><input type="text" value={typeof destination === 'string' ? destination : (destination?.name || '')} onChange={e=>setDestination(e.target.value || null)} placeholder="Type a place or click map to set"/></div>
        </div>
        <div style={{marginTop:12}} className="form-grid"><div className="field"><label>Map click mode</label><div style={{display:'flex',gap:8}}>
          <button className={`btn ${clickMode==='addStop'?'btn-primary':''}`} onClick={() => setClickMode('addStop')}>Add stop</button>
          <button className={`btn ${clickMode==='setStart'?'btn-primary':''}`} onClick={() => setClickMode('setStart')}>Set start</button>
          <button className={`btn ${clickMode==='setDestination'?'btn-primary':''}`} onClick={() => setClickMode('setDestination')}>Set destination</button>
        </div></div></div></div></div>
        <div className="planner-step"><span>02</span><div><h3>Stops</h3><div className="field stop-input-group"><label>Add a place or stop name</label><div className="stop-input-row"><input type="text" value={newStopName} onChange={e => setNewStopName(e.target.value)} placeholder="e.g. Om Beach / Yana Caves" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addStop(newStopName); } }}/><button type="button" className="btn btn-secondary" onClick={() => addStop(newStopName)}>Add</button></div></div><div className="stop-list">{stops.length ? stops.map((s, idx) => {
            const item = typeof s === 'string' ? { id: s, name: s } : s;
            return (
              <div className="stop-item" key={item.id}>
                <span>{item.name}</span>
                <div className="stop-actions">
                  <button className="btn" onClick={() => {
                    if (idx === 0) return;
                    const copy = [...stops];
                    const tmp = copy[idx-1]; copy[idx-1] = copy[idx]; copy[idx] = tmp;
                    setStops(copy);
                  }} disabled={idx===0}>↑</button>
                  <button className="btn" onClick={() => {
                    if (idx === stops.length - 1) return;
                    const copy = [...stops];
                    const tmp = copy[idx+1]; copy[idx+1] = copy[idx]; copy[idx] = tmp;
                    setStops(copy);
                  }} disabled={idx===stops.length-1}>↓</button>
                  <button className="btn" onClick={() => {
                    const name = window.prompt('Edit stop name', item.name);
                    if (!name) return;
                    const copy = [...stops];
                    copy[idx] = { ...(copy[idx] || {}), name };
                    setStops(copy);
                  }}>Edit</button>
                  <button className="btn btn-danger" onClick={() => setStops(stops.filter((_, i) => i !== idx))}>×</button>
                </div>
              </div>
            );
          }) : <p className="muted">No extra stops yet. Add a place name or choose from nearby recommendations.</p>}</div></div></div>
        <div className="planner-step"><span>03</span><div><h3>Travelers & vehicle</h3><div className="form-grid"><div className="field"><label>Members</label><input type="number" min="1" max="25" value={members} onChange={e=>setMembers(Number(e.target.value))}/></div><div className="field"><label>Vehicle</label><select value={vehicleId} onChange={e=>setVehicleId(e.target.value)}>{vehicles.map(v=><option key={v.id} value={v.id}>{v.name} · {v.capacity} seats</option>)}</select></div></div>{members > vehicle.capacity && <div className="notice error">This vehicle cannot accommodate {members} travelers. Choose a larger vehicle.</div>}</div></div>
        <div className="planner-summary"><div><span>Distance</span><strong>{Math.round(totalDistance)} km</strong></div><div><span>Travel time</span><strong>{Math.max(1,Math.round(totalDistance/50))} hrs</strong></div><div><span>Fuel estimate</span><strong>₹{fuelCost.toLocaleString("en-IN")}</strong></div></div>
        <Link className={`btn btn-primary full ${members > vehicle.capacity ? "disabled" : ""}`} to={members <= vehicle.capacity ? "/booking" : "#"} state={{planner:{start,destination,stops,members,vehicleId,distance:Math.round(totalDistance),fuelCost},tour:passedTour}}>Continue to booking →</Link>
      </aside>
      <section className="map-area">
        <div className="map-card card"><MapContainer center={route[0] || locations.Hubli} zoom={7} scrollWheelZoom className="map"><TileLayer attribution='&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
            <ClickHandler />
            {route.map((point,i)=>(<Marker position={point} key={`${point[0]}-${point[1]}-${i}`}><Popup>{routeNames[i]}</Popup></Marker>))}
            {/* Show custom stops with coords */}
            {stops.map(s => s.coords ? <Marker position={s.coords} key={s.id}><Popup><div><strong>{s.name}</strong><div><button onClick={() => addStop(s)}>Add stop</button></div></div></Popup></Marker> : null)}
            {/* Nearby attractions markers (approximate positions around destination) */}
            {nearby.map((place, idx) => {
              const destCoord = (typeof destination === 'string' ? locations[destination] : destination?.coords) || locations.Gokarna;
              // approximate offset in degrees (~ distance/111 km)
              const offset = (place.distance || 2) / 111;
              const angle = (idx / nearby.length) * Math.PI * 2;
              const lat = destCoord[0] + Math.cos(angle) * offset;
              const lng = destCoord[1] + Math.sin(angle) * offset;
              return (
                <Marker position={[lat, lng]} key={place.id}>
                  <Popup><div><strong style={{cursor:'pointer'}} onClick={() => addStop({ id: place.id, name: place.name, coords: [lat, lng] })}>{place.name}</strong><p className="muted">{place.type} · {place.distance} km</p></div></Popup>
                </Marker>
              );
            })}
            <Polyline positions={route} />
        </MapContainer><div className="route-pill">● {routeNames.join("  →  ")}</div></div>
        <div className="nearby-section"><div className="section-head"><div><span className="eyebrow">Around your destination</span><h2>Nearby places</h2></div></div><div className="nearby-grid">{nearby.map(place=><div className="nearby-card card" key={place.id}><img src={place.image} alt={place.name}/><div><span>{place.type} · {place.distance} km</span><h3>{place.name}</h3><p className="muted">{place.description}</p><button className="btn btn-secondary" onClick={()=>addStop(place)}>+ Add stop</button></div></div>)}</div></div>
      </section>
    </div>
  </div>;
}