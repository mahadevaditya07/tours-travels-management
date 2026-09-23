import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { tours, destinations } from "../data/mockData";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const bookings = JSON.parse(localStorage.getItem("tours_bookings") || "[]");
  const upcoming = bookings.filter(b => b.status !== "Cancelled").slice(0, 2);

  return <div className="dashboard page">
    <div className="container page-title-wrap"><span className="eyebrow">Your travel workspace</span><h1 className="section-title">Good to see you, {user?.name?.split(" ")[0] || "Traveler"}.</h1><p className="muted">Everything you need for your next journey, in one place.</p></div>
    <section className="container dashboard-grid">
      <div className="dashboard-main">
        <div className="stats-grid">
          <div className="stat-card-lg card"><span>Upcoming trips</span><strong>{upcoming.length}</strong><small>Keep exploring</small></div>
          <div className="stat-card-lg card"><span>Saved experiences</span><strong>{user?.savedTours?.length ?? user?.savedExperience ?? 0}</strong><small>Curated for you</small></div>
          <div className="stat-card-lg card"><span>Traveler rating</span><strong>{user?.rating?.toFixed ? user.rating.toFixed(1) : (user?.rating ?? 0)}</strong><small>Average experience</small></div>
        </div>
        <div className="card dash-panel">
          <div className="section-head"><div><span className="eyebrow">Quick actions</span><h2>What are you planning?</h2></div></div>
          <div className="quick-actions"><Link to="/map-planner" className="quick-card"><span>⌁</span><strong>Plan a trip</strong><small>Build a custom route</small></Link><Link to="/tours" className="quick-card"><span>✦</span><strong>Explore tours</strong><small>Find curated packages</small></Link><Link to="/my-bookings" className="quick-card"><span>▣</span><strong>My bookings</strong><small>Manage reservations</small></Link><Link to="/saved-experiences" className="quick-card"><span>❤</span><strong>Saved experiences</strong><small>View your saved trips</small></Link></div>
        </div>
        <div className="dash-panel">
          <div className="section-head"><div><span className="eyebrow">For you</span><h2>Recommended tours</h2></div><Link to="/tours">View all →</Link></div>
          <div className="grid two-col">{tours.slice(0,2).map(t => <Link className="mini-tour card" key={t.id || t._id} to={`/tours/${t.id || t._id}`}><img src={t.image} alt={t.title}/><div><span>{t.destination}</span><h3>{t.title}</h3><strong>₹{(t.price || 0).toLocaleString("en-IN")}</strong></div></Link>)}</div>
        </div>
      </div>
      <aside className="dashboard-side card">
        <span className="eyebrow">Your account</span><div className="avatar">{user?.name?.charAt(0) || "T"}</div><h2>{user?.name || "Traveler"}</h2><p className="muted">{user?.email}</p><Link className="btn btn-secondary full" to="/profile">Manage profile</Link>
        <div className="side-destination"><span className="eyebrow">Dreaming of</span><img src={destinations[0].image} alt={destinations[0].name}/><div><strong>{destinations[0].name}</strong><span>{destinations[0].state}</span></div></div>
      </aside>
    </section>
  </div>;
}