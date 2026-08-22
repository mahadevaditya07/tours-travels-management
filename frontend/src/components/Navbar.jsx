import { useState } from "react";
import "./Navbar.css";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const nav = [
    ["Home", "/"],
    ["Tours", "/tours"],
    ["Map Planner", "/map-planner"],
  ];

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link className="brand" to="/">
          <span className="brand-mark">T</span>
          <span>Tours & Travels Management</span>
        </Link>

        <button className="mobile-toggle" onClick={() => setOpen(v => !v)} aria-label="Toggle navigation">
          ☰
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {nav.map(([label, path]) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
              {label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <>
              <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
              <NavLink to="/my-bookings" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Bookings</NavLink>
              <NavLink to="/profile" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Profile</NavLink>
              <button className="nav-user" onClick={handleLogout}>{user?.name?.split(" ")[0] || "Logout"} · Logout</button>
            </>
          ) : (
            <div className="nav-auth">
              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
              <Link className="btn btn-primary nav-cta" to="/register" onClick={() => setOpen(false)}>Get Started</Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}