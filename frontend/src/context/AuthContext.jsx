import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginUser, registerUser, getProfile, updateProfile as apiUpdateProfile, saveExperience as apiSaveExperience, addRating as apiAddRating } from "../services/api";

const AuthContext = createContext(null);
const STORAGE_KEY = "tours_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      // Use sessionStorage so each tab can hold a separate logged-in user
      const stored = sessionStorage.getItem(STORAGE_KEY) || sessionStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (token) {
      getProfile().then(res => {
        if (res?.user) {
          setUser(res.user);
        }
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (user) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      sessionStorage.setItem('user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem('user');
    }
  }, [user]);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      if (!email || !password) throw new Error("Email and password are required.");
      const res = await loginUser({ email, password });
      if (!res || !res.token) throw new Error(res?.message || "Login failed.");
      // Store token and user in sessionStorage so each tab keeps its own session
      sessionStorage.setItem("token", res.token);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
      sessionStorage.setItem('user', JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data) => {
    setLoading(true);
    try {
      const res = await registerUser(data);
      // Backend no longer auto-logs-in; registration returns success message.
      if (!res || !res.success) throw new Error(res?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const res = await apiUpdateProfile(data);
      if (!res || !res.user) throw new Error(res?.message || 'Update failed.');
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const saveExperience = async (tourId, tour) => {
    setLoading(true);
    try {
      const res = await apiSaveExperience(tourId, tour);
      if (res?.user) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
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
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(res.user));
        setUser(res.user);
      }
      return res;
    } finally { setLoading(false); }
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem("token");
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