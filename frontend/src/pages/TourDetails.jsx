import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { tours as mockTours } from "../data/mockData";
import { getTourById, getTours } from "../services/api";
import "./TourDetails.css";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function TourDetails() {
  const { id } = useParams();
  const [tour, setTour] = useState(() => mockTours.find(t => t.id === id || t._id === id) || null);

  useEffect(() => {
    let isMounted = true;
    getTourById(id).then(res => {
      if (isMounted && res?.tour) {
        setTour(res.tour);
      }
    }).catch(() => {
      getTours().then(res => {
        const list = Array.isArray(res) ? res : (res?.tours || []);
        const found = list.find(t => t.id === id || t._id === id);
        if (isMounted && found) setTour(found);
      }).catch(() => {});
    });
    return () => { isMounted = false; };
  }, [id]);

  if (!tour) return <div className="container page-title-wrap"><h1>Tour not found</h1><Link className="btn btn-primary" to="/tours">Back to tours</Link></div>;

  const places = Array.isArray(tour.places) ? tour.places : [];
  const included = Array.isArray(tour.included) && tour.included.length ? tour.included : ["Hotel stay", "Local sightseeing", "Breakfast"];
  const excluded = Array.isArray(tour.excluded) && tour.excluded.length ? tour.excluded : ["Personal expenses", "Adventure activities"];
  const todayTime = new Date().setHours(0, 0, 0, 0);
  const rawDates = Array.isArray(tour.dates) && tour.dates.length ? tour.dates : (Array.isArray(tour.availableDates) && tour.availableDates.length ? tour.availableDates : []);
  const dates = rawDates.filter(d => {
    try {
      const parsed = new Date(d);
      if (isNaN(parsed.getTime())) return false;
      parsed.setHours(0, 0, 0, 0);
      return parsed.getTime() > todayTime;
    } catch {
      return false;
    }
  });
  const priceVal = Number(tour.price || 0);

  return <div className="page detail-page"><div className="container detail-hero"><img src={tour.image || "/images/gokarna.jpg"} alt={tour.title || "Tour"}/><div className="detail-hero-overlay"><span className="eyebrow">{tour.category || "Tour"} · {tour.destination}</span><h1 className="display-title">{tour.title}</h1><p>{tour.description}</p></div></div>
    <div className="container detail-grid"><main>
      <div className="card detail-panel"><div className="detail-stats"><div><span>Departure</span><strong>Hubli, KA</strong></div><div><span>Duration</span><strong>{tour.duration || "N/A"}</strong></div><div><span>Rating</span><strong>★ {tour.rating || "4.5"}</strong></div><div><span>Starting from</span><strong>₹{priceVal.toLocaleString("en-IN")}</strong></div></div><h2>About this journey</h2><p className="muted">{tour.description} Departs from Hubli with thoughtfully selected highlights.</p>{places.length > 0 && (<><h2>Places covered</h2><div className="chips">{places.map(p=><span key={p}>{p}</span>)}</div></>)}<div className="included-grid"><div><h3>Included</h3>{included.map(x=><p key={x}>✓ {x}</p>)}</div><div><h3>Not included</h3>{excluded.map(x=><p key={x}>× {x}</p>)}</div></div><h2>Available dates</h2><div className="date-list">{dates.map(d=><span key={typeof d === "string" ? d : d?.toString()}>{new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>)}</div></div>
    </main><aside className="booking-card card"><span className="eyebrow">Plan this experience</span><h2>₹{priceVal.toLocaleString("en-IN")} <small>/ person</small></h2><p className="muted">Build a route around this tour or continue directly to booking.</p><Link className="btn btn-primary full" to="/booking" state={{tour}}>Book now →</Link><Link className="btn btn-secondary full" to="/map-planner" state={{tour}}>Plan route</Link>
      <AuthSave />
      <div className="secure-note">● Estimated pricing · final price confirmed by backend</div></aside></div>
  </div>;
}

function AuthSave(){
  const { saveExperience } = useAuth();
  const toast = useToast();
  const onSave = async () => {
    try {
      await saveExperience();
      toast?.showToast('Saved experience', { type: 'success' });
    } catch (e) {
      toast?.showToast(e.message || 'Save failed.', { type: 'error' });
    }
  };
  return <button className="btn btn-outline full" onClick={onSave} style={{marginTop:12}}>Save experience</button>;
}