import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./pages.css";

export default function SavedExperiences(){
  const { user, saveExperience } = useAuth();
  const toast = useToast();
  const saved = user?.savedTours || [];

  const handleRemove = async (tour) => {
    try {
      await saveExperience(tour.id || tour._id, tour);
      toast?.showToast('Removed from saved experiences', { type: 'info' });
    } catch (e) {
      toast?.showToast(e.message || 'Failed to remove', { type: 'error' });
    }
  };

  return (
    <div className="page">
      <div className="container page-title-wrap">
        <span className="eyebrow">Your collection</span>
        <h1 className="section-title">Saved experiences</h1>
        <p className="muted">Trips you've saved to review later.</p>
      </div>
      <div className="container">
        {(!saved || saved.length === 0) ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <h3>No saved experiences yet</h3>
            <p className="muted" style={{ marginBottom: 20 }}>Explore tours and save the ones you'd like to keep.</p>
            <Link to="/tours" className="btn btn-primary">Browse tours →</Link>
          </div>
        ) : (
          <div className="grid two-col">
            {saved.map(s => {
              const tourId = s.id || s._id;
              return (
                <div className="card" key={tourId || s.title} style={{display:'flex', gap:16, alignItems:'center', justifyContent:'space-between'}}>
                  <div style={{display:'flex', gap:16, alignItems:'center', flex: 1}}>
                    <img 
                      src={s.image || "/images/gokarna.jpg"} 
                      alt={s.title || "Tour"} 
                      style={{width:120, height:80, objectFit:'cover', borderRadius:8, flexShrink:0}} 
                    />
                    <div>
                      <h3 style={{margin:'0 0 4px', fontSize:'1.1rem'}}>{s.title}</h3>
                      <p className="muted" style={{margin:'0 0 6px', fontSize:'0.9rem'}}>{s.destination}</p>
                      <strong style={{color:'var(--primary, #007bff)'}}>₹{(s.price||0).toLocaleString('en-IN')}</strong>
                    </div>
                  </div>
                  <div style={{display:'flex', flexDirection:'column', gap:8, alignItems:'flex-end'}}>
                    {tourId && (
                      <Link to={`/tours/${tourId}`} className="btn btn-secondary" style={{padding:'6px 14px', fontSize:'0.85rem'}}>
                        View →
                      </Link>
                    )}
                    <button 
                      onClick={() => handleRemove(s)} 
                      className="btn" 
                      style={{padding:'4px 8px', fontSize:'0.8rem', color:'#ef4444', background:'transparent', border:'none', cursor:'pointer'}}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
