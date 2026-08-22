import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  
  

  const submit = async e => {
    e.preventDefault(); setError("");
    try { await login(form); navigate(location.state?.from || "/dashboard"); }
    catch (err) { setError(err.message); }
  };

  return <div className="auth-page"><div className="auth-art"><span className="eyebrow">Welcome back</span><h1 className="section-title">Keep exploring.</h1><p>Pick up where you left off and continue planning your next escape.</p></div>
    <div className="auth-panel"><div className="auth-form">
      <span className="eyebrow">Account access</span><h2>Sign in</h2><p className="muted">Enter your details to access your travel dashboard.</p>
      {error && <div className="notice error">{error}</div>}
      <form onSubmit={submit}>
        <div className="field"><label>Email</label><input type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})} placeholder="you@example.com" /></div>
        <div className="field"><label>Password</label><div className="password-wrap"><input type={show ? "text" : "password"} required value={form.password} onChange={e => setForm({...form,password:e.target.value})} placeholder="••••••••" /><button type="button" onClick={() => setShow(v=>!v)}>{show ? "Hide" : "Show"}</button></div></div>
        <div className="form-row"><label className="remember"><input type="checkbox" /> Remember me</label><button type="button" className="link-button">Forgot password?</button></div>
        <button className="btn btn-primary full" disabled={loading}>{loading ? "Signing in..." : "Sign in →"}</button>
      </form>
      <p className="auth-switch">Don't have an account? <Link to="/register">Create one</Link></p>
    </div></div></div>;
}