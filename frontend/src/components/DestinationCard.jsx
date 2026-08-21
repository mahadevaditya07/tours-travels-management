export default function DestinationCard({ destination }) {
  return (
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
  );
}