import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirmPassword:"" });
  const [error, setError] = useState("");

  const update = e => setForm({...form,[e.target.name]:e.target.value});
  const submit = async e => {
    e.preventDefault(); setError("");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    try { await register(form); navigate("/dashboard"); } catch (err) { setError(err.message); }
  };

  return <div className="auth-page register-page"><div className="auth-art"><span className="eyebrow">Your journey begins</span><h1 className="section-title">Create an account built for travelers.</h1><p>Save trips, manage bookings and build routes tailored to your group.</p></div>
    <div className="auth-panel"><div className="auth-form">
      <span className="eyebrow">New traveler</span><h2>Create account</h2><p className="muted">It takes less than a minute.</p>
      {error && <div className="notice error">{error}</div>}
      <form onSubmit={submit} className="form-grid">
        <div className="field full-field"><label>Full name</label><input name="name" required value={form.name} onChange={update} placeholder="Your full name" /></div>
        <div className="field"><label>Email</label><input type="email" name="email" required value={form.email} onChange={update} placeholder="you@example.com" /></div>
        <div className="field"><label>Phone</label><input name="phone" required value={form.phone} onChange={update} placeholder="+91 90000 00000" /></div>
        <div className="field"><label>Password</label><input type="password" name="password" required value={form.password} onChange={update} placeholder="Minimum 6 characters" /></div>
        <div className="field"><label>Confirm password</label><input type="password" name="confirmPassword" required value={form.confirmPassword} onChange={update} placeholder="Repeat password" /></div>
        <button className="btn btn-primary full full-field" disabled={loading}>{loading ? "Creating..." : "Create account →"}</button>
      </form>
      <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    </div></div></div>;
}