import { Link } from "react-router-dom";

export default function DestinationCard({ destination }) {
  return (
    <Link
      to={`/tours?search=${encodeURIComponent(destination.name)}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block', cursor: 'pointer' }}
    >
      <article className="destination-card fade-up">
        <img
          src={destination.image}
          alt={destination.name}
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/gokarna.svg'; }}
        />
        <div className="destination-overlay">
          <span>{destination.state}</span>
          <h3>{destination.name}</h3>
          <p>{destination.description}</p>
        </div>
      </article>
    </Link>
  );
}