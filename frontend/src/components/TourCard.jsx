import { Link } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { updateTour } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function TourCard({ tour }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [editing, setEditing] = useState(false);
  const [localPrice, setLocalPrice] = useState(tour.price);
  const [inputPrice, setInputPrice] = useState(tour.price);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const onSavePrice = async () => {
    const value = Number(inputPrice);
    if (!Number.isFinite(value) || value <= 0) return alert('Enter a valid price.');
    try {
      setSaving(true);
      // attempt backend update
      try {
        await updateTour(tour.id || tour._id, { price: value });
        toast?.showToast('Tour price updated', { type: 'success' });
      } catch (e) {
        toast?.showToast('Saved locally — backend failed', { type: 'error' });
      }
      setLocalPrice(value);
      setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <article className="tour-card card fade-up">
      <div className="tour-image-wrap">
        <img src={tour.image} alt={tour.title} />
        <span className="tour-category">{tour.category}</span>
        <span className="tour-rating">★ {tour.rating}</span>
      </div>
      <div className="tour-content">
        <p className="tour-location">{tour.destination}</p>
        <h3>{tour.title}</h3>
        <p className="muted tour-desc">{tour.description}</p>
        <div className="tour-meta">
          <span>◷ {tour.duration}</span>
          <strong>
            ₹{(localPrice || 0).toLocaleString("en-IN")}
          </strong>
        </div>

        {isAdmin && (
          <div style={{ margin: '10px 0 12px', display: 'flex', gap: 8, alignItems: 'center' }}>
            {editing ? (
              <>
                <input type="number" value={inputPrice} onChange={e=>setInputPrice(e.target.value)} style={{width:120,padding:8,borderRadius:8,border:'1px solid var(--border)'}} />
                <button className="btn btn-primary" onClick={onSavePrice} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                <button className="btn" onClick={()=>{ setEditing(false); setInputPrice(localPrice); }}>Cancel</button>
              </>
            ) : (
              <button className="btn btn-outline" onClick={()=>setEditing(true)}>Edit price</button>
            )}
          </div>
        )}

        <Link className="btn btn-secondary tour-btn" to={`/tours/${tour.id || tour._id}`}>View Details →</Link>
      </div>
    </article>
  );
}