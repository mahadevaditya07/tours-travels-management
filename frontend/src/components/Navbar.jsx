import { useState } from "react";
import "./Navbar.css";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

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

  const jumpToAdminSection = (id) => {
    setOpen(false);
    navigate('/admin');
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <header className="navbar">
      <div className="nav-inner">
        <Link className="brand" to={isAdmin ? "/admin" : "/"}>
          <span className="brand-mark">T</span>
          <span>Tours & Travels Management</span>
        </Link>

        <button className="mobile-toggle" onClick={() => setOpen(v => !v)} aria-label="Toggle navigation">
          ☰
        </button>

        <nav className={`nav-links ${open ? "open" : ""}`}>
          {!isAdmin && nav.map(([label, path]) => (
            <NavLink key={path} to={path} onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>
              {label}
            </NavLink>
          ))}

          {isAuthenticated ? (
            <>
              {isAdmin ? (
                <>
                  <NavLink to="/admin" end onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
                  <NavLink to="/admin/bookings" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Bookings</NavLink>
                  <NavLink to="/admin/pricing" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Pricing</NavLink>
                  <NavLink to="/admin/tours" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Tours</NavLink>
                  <NavLink to="/admin/users" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Users</NavLink>
                </>
              ) : (
                <>
                  <NavLink to="/dashboard" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Dashboard</NavLink>
                  <NavLink to="/saved-experiences" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Saved</NavLink>
                  <NavLink to="/my-bookings" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Bookings</NavLink>
                  <NavLink to="/profile" onClick={() => setOpen(false)} className={({isActive}) => isActive ? "active" : ""}>Profile</NavLink>
                </>
              )}
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