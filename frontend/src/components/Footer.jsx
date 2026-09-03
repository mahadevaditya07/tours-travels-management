import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" to={isAdmin ? '/admin' : '/'}><span className="brand-mark">T</span><span>Tours & Travels Management</span></Link>
          <p className="muted">Plan better journeys, discover remarkable places and manage every booking in one beautiful workspace.</p>
        </div>
        {!isAdmin && (
          <div>
            <h4>Explore</h4>
            <Link to="/tours">Tours</Link>
            <Link to="/map-planner">Map Planner</Link>
            <Link to="/dashboard">Dashboard</Link>
          </div>
        )}
        <div>
          <h4>Support</h4>
          <span>help@toursandtravels.local</span>
          <span>+91 90000 00000</span>
          <span>India · Travel anywhere</span>
        </div>
      </div>
      <div className="container footer-bottom">© 2026 Tours & Travels Management. Built for modern travel management.</div>
    </footer>
  );
}