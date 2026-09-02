import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

export default function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", confirmPassword:"" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const update = e => setForm({...form,[e.target.name]:e.target.value});
  const submit = async e => {
    e.preventDefault(); setError("");

    // Name: only letters and spaces
    if (!/^[A-Za-z\s]+$/.test(form.name)) return setError("Name must contain only letters and spaces.");

    // Phone: exactly 10 digits
    if (!/^\d{10}$/.test(form.phone)) return setError("Phone must be exactly 10 digits.");

    // Password: 8-16 chars, letters, number, special char
    if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,16}$/.test(form.password)) return setError("Password must be 8-16 chars and include letters, numbers and special characters.");

    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    try { await register(form); navigate("/login", { state: { info: 'registered' } }); } catch (err) { setError(err.message); }
  };

  return <div className="auth-page register-page"><div className="auth-art"><span className="eyebrow">Your journey begins</span><h1 className="section-title">Create an account built for travelers.</h1><p>Save trips, manage bookings and build routes tailored to your group.</p></div>
    <div className="auth-panel"><div className="auth-form">
      <span className="eyebrow">New traveler</span><h2>Create account</h2><p className="muted">It takes less than a minute.</p>
      {error && <div className="notice error">{error}</div>}
      <form onSubmit={submit} className="form-grid" autoComplete="off">
        {/* Hidden fields to prevent browser autofill suggestions */}
        <input style={{position:'absolute',opacity:0,height:0,width:0,border:0,padding:0}} tabIndex={-1} name="fakeusernameremembered" autoComplete="username" />
        <input style={{position:'absolute',opacity:0,height:0,width:0,border:0,padding:0}} tabIndex={-1} type="password" name="fakepasswordremembered" autoComplete="new-password" />

        <div className="field full-field"><label>Full name</label><input name="name" autoComplete="off" spellCheck="false" required value={form.name} onChange={update} placeholder="Your full name" /></div>
        <div className="field"><label>Email</label><input type="email" name="email" autoComplete="off" spellCheck="false" required value={form.email} onChange={update} placeholder="you@example.com" /></div>
        <div className="field"><label>Phone</label><input type="tel" name="phone" autoComplete="off" required value={form.phone} onChange={update} placeholder="9000000000" /></div>
        <div className="field"><label>Password</label><div className="password-wrap"><input type={showPassword ? "text" : "password"} name="password" autoComplete="new-password" required value={form.password} onChange={update} placeholder="8-16 characters" /><button type="button" onClick={()=>setShowPassword(v=>!v)} className="inline-toggle">{showPassword?"Hide":"Show"}</button></div></div>
        <div className="field"><label>Confirm password</label><div className="password-wrap"><input type={showConfirm ? "text" : "password"} name="confirmPassword" autoComplete="new-password" required value={form.confirmPassword} onChange={update} placeholder="Repeat password" /><button type="button" onClick={()=>setShowConfirm(v=>!v)} className="inline-toggle">{showConfirm?"Hide":"Show"}</button></div></div>
        <button className="btn btn-primary full full-field" disabled={loading}>{loading ? "Creating..." : "Create account →"}</button>
      </form>
      <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
    </div></div></div>;
}