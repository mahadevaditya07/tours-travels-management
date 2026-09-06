import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { tours } from "../data/mockData";
import "./TourDetails.css";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function TourDetails() {
  const { id } = useParams();
  const tour = useMemo(() => tours.find(t => t.id === id), [id]);
  if (!tour) return <div className="container page-title-wrap"><h1>Tour not found</h1><Link className="btn btn-primary" to="/tours">Back to tours</Link></div>;

  return <div className="page detail-page"><div className="container detail-hero"><img src={tour.image} alt={tour.title}/><div className="detail-hero-overlay"><span className="eyebrow">{tour.category} · {tour.destination}</span><h1 className="display-title">{tour.title}</h1><p>{tour.description}</p></div></div>
    <div className="container detail-grid"><main>
      <div className="card detail-panel"><div className="detail-stats"><div><span>Duration</span><strong>{tour.duration}</strong></div><div><span>Rating</span><strong>★ {tour.rating}</strong></div><div><span>Starting from</span><strong>₹{tour.price.toLocaleString("en-IN")}</strong></div></div><h2>About this journey</h2><p className="muted">{tour.description} Discover thoughtfully selected highlights with a flexible route-planning experience.</p><h2>Places covered</h2><div className="chips">{tour.places.map(p=><span key={p}>{p}</span>)}</div><div className="included-grid"><div><h3>Included</h3>{tour.included.map(x=><p key={x}>✓ {x}</p>)}</div><div><h3>Not included</h3>{tour.excluded.map(x=><p key={x}>× {x}</p>)}</div></div><h2>Available dates</h2><div className="date-list">{tour.dates.map(d=><span key={d}>{new Date(d).toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"})}</span>)}</div></div>
    </main><aside className="booking-card card"><span className="eyebrow">Plan this experience</span><h2>₹{tour.price.toLocaleString("en-IN")} <small>/ person</small></h2><p className="muted">Build a route around this tour or continue directly to booking.</p><Link className="btn btn-primary full" to="/booking" state={{tour}}>Book now →</Link><Link className="btn btn-secondary full" to="/map-planner" state={{tour}}>Plan route</Link>
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