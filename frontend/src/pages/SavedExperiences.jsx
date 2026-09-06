import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./pages.css";

export default function SavedExperiences(){
  const { user } = useAuth();
  const saved = user?.savedTours || [];

  return (
    <div className="page">
      <div className="container page-title-wrap">
        <span className="eyebrow">Your collection</span>
        <h1 className="section-title">Saved experiences</h1>
        <p className="muted">Trips you've saved to review later.</p>
      </div>
      <div className="container">
        {(!saved || saved.length === 0) ? (
          <div className="card">
            <h3>No saved experiences yet</h3>
            <p className="muted">Explore tours and save the ones you'd like to keep.</p>
            <Link to="/tours" className="btn btn-primary">Browse tours →</Link>
          </div>
        ) : (
          <div className="grid two-col">
            {saved.map(s => (
              <div className="card" key={s.id || s._id} style={{display:'flex',gap:12}}>
                <img src={s.image} alt={s.title} style={{width:120,height:80,objectFit:'cover',borderRadius:8}} />
                <div>
                  <h3>{s.title}</h3>
                  <p className="muted">{s.destination}</p>
                  <strong>₹{(s.price||0).toLocaleString('en-IN')}</strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
