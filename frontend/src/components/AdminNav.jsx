import { NavLink } from "react-router-dom";
import "./AdminNav.css";

export default function AdminNav() {
  return (
    <div className="admin-nav-tabs">
      <NavLink to="/admin" end className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
        📊 Dashboard Overview
      </NavLink>
      <NavLink to="/admin/bookings" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
        📅 Bookings
      </NavLink>
      <NavLink to="/admin/pricing" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
        🏷️ Pricing
      </NavLink>
      <NavLink to="/admin/tours" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
        🗺️ Tours
      </NavLink>
      <NavLink to="/admin/users" className={({ isActive }) => isActive ? "admin-nav-link active" : "admin-nav-link"}>
        👥 Users
      </NavLink>
    </div>
  );
}
