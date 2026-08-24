import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, registerUser, updateProfile as apiUpdateProfile, saveExperience as apiSaveExperience, addRating as apiAddRating } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "tours_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Support legacy `user` key if `tours_user` is not present
      const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    else localStorage.removeItem(STORAGE_KEY);
  }, [user]);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Email and password are required.");
      const res = await loginUser({ email, password });
      if (!res || !res.token) throw new Error(res?.message || "Login failed.");
      localStorage.setItem("token", res.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await registerUser(data);
      if (!res || !res.token) throw new Error(res?.message || "Registration failed.");
      localStorage.setItem("token", res.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const res = await apiUpdateProfile(data);
      if (!res || !res.user) throw new Error(res?.message || 'Update failed.');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const saveExperience = async () => {
    setLoading(true);
    try {
      const res = await apiSaveExperience();
      if (res?.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
      }
      return res;
    } finally { setLoading(false); }
  };

  const addRating = async (rating) => {
    setLoading(true);
    try {
      const res = await apiAddRating(rating);
      if (res?.user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
      }
      return res;
    } finally { setLoading(false); }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("token");
    setUser(null);
  };

  const value = useMemo(() => ({
    user, loading, isAuthenticated: Boolean(user), login, register, logout, updateProfile, saveExperience, addRating
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}