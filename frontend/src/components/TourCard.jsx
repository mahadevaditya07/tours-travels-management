import { Link } from "react-router-dom";

export default function TourCard({ tour }) {
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
        <div className="tour-meta"><span>◷ {tour.duration}</span><strong>₹{tour.price.toLocaleString("en-IN")}</strong></div>
        <Link className="btn btn-secondary tour-btn" to={`/tours/${tour.id}`}>View Details →</Link>
      </div>
    </article>
  );
}