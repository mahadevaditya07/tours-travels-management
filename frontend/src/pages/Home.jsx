import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DestinationCard from "../components/DestinationCard";
import TourCard from "../components/TourCard";
import { destinations, tours as mockTours } from "../data/mockData";
import { getTours } from "../services/api";
import "./Home.css";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [toursList, setToursList] = useState(mockTours);

  useEffect(() => {
    let isMounted = true;
    getTours().then(data => {
      const list = Array.isArray(data) ? data : (data?.tours || []);
      if (isMounted && list.length > 0) {
        setToursList(list);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);
  return (
    <>
      <section className="hero">
        <div className="hero-glow one" /><div className="hero-glow two" />
        <div className="container hero-grid">
          <div className="hero-copy fade-up">
            <span className="eyebrow">Travel smarter · live better</span>
            <h1 className="display-title">Your next great journey starts <em>here.</em></h1>
            <p className="hero-text">Discover curated destinations, build custom routes and manage your complete trip from one intelligent travel workspace.</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/tours">Explore Tours →</Link>
              <Link className="btn btn-secondary" to="/map-planner">Plan a Trip</Link>
            </div>
            <div className="hero-trust"><span>4.9/5 traveler rating</span><span>•</span><span>500+ curated experiences</span></div>
          </div>
          <div className="hero-visual fade-up">
            <div className="hero-photo">
              <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1100&q=85" alt="Mountain travel" />
              <div className="floating-card route-card"><span>✦</span><div><strong>Perfect route found</strong><small>Hubli → Gokarna → Mangalore</small></div></div>
              <div className="floating-card stat-card"><strong>₹8,700</strong><small>estimated trip cost</small></div>
            </div>
          </div>
        </div>
      </section>

      <section className="search-strip">
        <div className="container planner-search">
          <div><span className="eyebrow">Start planning</span><h3>Where do you want to go?</h3></div>
          <Link className="btn btn-primary" to="/tours">Find my journey →</Link>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Handpicked for you</span><h2 className="section-title">Popular destinations</h2></div><Link className="btn btn-secondary" to="/tours">View all →</Link></div>
          <div className="grid four-col">{destinations.map(d => <DestinationCard key={d.id} destination={d} />)}</div>
        </div>
      </section>

      <section className="section tours-section">
        <div className="container">
          <div className="section-head"><div><span className="eyebrow">Curated escapes</span><h2 className="section-title">Made for memorable trips</h2></div><Link className="btn btn-secondary" to="/tours">Explore tours →</Link></div>
          <div className="grid two-col">{toursList.slice(0,4).map(t => <TourCard key={t.id || t._id} tour={t} />)}</div>
        </div>
      </section>

      <section className="section">
        <div className="container why-grid">
          <div><span className="eyebrow">Why Tours & Travels Management</span><h2 className="section-title">One place for the entire journey.</h2><p className="muted">From discovering a destination to calculating distance, choosing the right vehicle and confirming your booking, everything stays connected.</p></div>
          <div className="feature-stack">
            <div className="feature-card card"><span>01</span><div><h3>Plan with precision</h3><p className="muted">Add multiple stops and see an estimated route distance before you book.</p></div></div>
            <div className="feature-card card"><span>02</span><div><h3>Price with clarity</h3><p className="muted">Vehicle capacity, distance and estimated travel cost are shown transparently.</p></div></div>
            <div className="feature-card card"><span>03</span><div><h3>Manage effortlessly</h3><p className="muted">Keep bookings, profile details and future journeys organized in one dashboard.</p></div></div>
          </div>
        </div>
      </section>

      {!isAuthenticated && (
        <section className="cta-section">
          <div className="container cta-box">
            <div><span className="eyebrow">Ready when you are</span><h2 className="section-title">Turn a destination into a journey.</h2><p>Build your route and let Tours & Travels Management handle the details.</p></div>
            <Link className="btn btn-primary" to="/register">Create free account →</Link>
          </div>
        </section>
      )}
    </>
  );
}