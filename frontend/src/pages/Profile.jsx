import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import "./Profile.css";

export default function Profile() {
  const { user, logout, updateProfile } = useAuth();
  const [form,setForm] = useState({name:user?.name||"",email:user?.email||"",phone:user?.phone||""});
  const [saved,setSaved] = useState(false);
  const [error,setError] = useState("");
  const toast = useToast();
  const save = async e => {
    e.preventDefault(); setError("");
    if (!/^[A-Za-z\s]+$/.test(form.name)) return setError("Name must contain only letters and spaces.");
    if (!/^\d{10}$/.test(form.phone)) return setError("Phone must be exactly 10 digits.");
    try {
      await updateProfile(form);
      setSaved(true); setTimeout(()=>setSaved(false),2000);
      toast?.showToast('Profile updated', { type: 'success' });
    } catch (err) { setError(err.message || err.toString()); }
  };
  return <div className="page"><div className="container page-title-wrap"><span className="eyebrow">Your account</span><h1 className="section-title">Profile settings.</h1><p className="muted">Keep your traveler information up to date.</p></div>
    <div className="container profile-grid"><aside className="profile-card card"><div className="avatar xl">{user?.name?.charAt(0)||"T"}</div><h2>{user?.name}</h2><p className="muted">{user?.email}</p><span className="profile-badge">Traveler account</span><button className="btn btn-danger full" onClick={logout}>Log out</button></aside>
      <form className="card profile-form" onSubmit={save}><span className="eyebrow">Personal information</span><h2>Edit profile</h2>{saved&&<div className="notice success">Profile saved successfully.</div>}{error&&<div className="notice error">{error}</div>}<div className="form-grid"><div className="field"><label>Full name</label><input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></div><div className="field"><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><div className="field"><label>Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div></div><h3>Security</h3><p className="muted">Password changes can be connected to your Express authentication API.</p><button className="btn btn-primary" type="submit">Save changes →</button></form>
    </div>
  </div>;
}