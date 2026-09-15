import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically attach JWT token if available
api.interceptors.request.use(
  (config) => {
    // Prefer sessionStorage (per-tab sessions). Fall back to localStorage if present.
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== AUTH ====================

export const registerUser = async (data) => {
  console.log("REGISTER REQUEST:", data);
  try {
    const response = await api.post("/auth/register", data);
    console.log("REGISTER RESPONSE:", response.data);
    return response.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Registration failed.";
    throw new Error(msg);
  }
};

export const loginUser = async (data) => {
  console.log("LOGIN REQUEST:", data);
  try {
    const response = await api.post("/auth/login", data);
    console.log("LOGIN RESPONSE:", response.data);

    if (response.data.token) {
      // Store in sessionStorage so each tab can have its own session
      sessionStorage.removeItem("token");
      sessionStorage.setItem("token", response.data.token);
    }

    if (response.data.user) {
      sessionStorage.removeItem("user");
      sessionStorage.removeItem("tours_user");
      sessionStorage.setItem("user", JSON.stringify(response.data.user));
      sessionStorage.setItem("tours_user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Login failed.";
    throw new Error(msg);
  }
};

// Auth helper endpoints for verification / password reset
export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', {
      email
    });

    return response.data;
  } catch (err) {
    const msg =
      err?.response?.data?.message ||
      err.message ||
      'Request failed.';

    throw new Error(msg);
  }
};

export const resetPassword = async (payload) => {
  try {
    const response = await api.post('/auth/reset-password', payload);
    return response.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Request failed.';
    throw new Error(msg);
  }
};

export const verifyAccount = async (payload) => {
  try {
    const response = await api.post('/auth/verify-account', payload);
    return response.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || 'Request failed.';
    throw new Error(msg);
  }
};

// ==================== TOURS ====================

export const getTours = async () => {
  const response = await api.get("/tours");

  console.log("TOURS FROM BACKEND:", response.data);

  return response.data;
};

export const getTourById = async (id) => {
  const response = await api.get(`/tours/${id}`);

  return response.data;
};

export const updateTour = async (id, data) => {
  const response = await api.put(`/tours/${id}`, data);
  return response.data;
};

// ==================== BOOKINGS ====================

export const createBooking = async (data) => {
  console.log("BOOKING REQUEST:", data);

  // Map frontend booking shape to backend expected fields
  const payload = {
    name: data.traveler?.name || data.name,
    email: data.traveler?.email || data.email,
    phone: data.traveler?.phone || data.phone,
    tour: data.tourId || data.tour || data.tour._id,
    tourName: data.tour || data.tourName,
    startLocation: data.start || data.startLocation,
    destination: data.destination,
    stops: (data.stops || []).map(s => (typeof s === 'string' ? s : (s.name || ''))),
    travelDate: data.date || data.travelDate,
    members: data.members,
    vehicle: data.vehicle,
    distance: data.distance,
    basePrice: data.basePrice,
    vehicleCost: data.vehicleCost,
    additionalCharges: data.additional || data.additionalCharges || 0,
    totalPrice: data.total || data.totalPrice,
  };

  const response = await api.post("/bookings", payload);

  console.log("BOOKING RESPONSE:", response.data);

  // Return created booking object (normalize id)
  const booking = response.data?.booking || response.data;
  // attach any debug info (confirmation link) for local testing
  if (response.data?.debug) booking.debug = response.data.debug;
  if (booking && booking._id && !booking.id) booking.id = booking._id;
  return booking;
};

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my-bookings");

  const bookings = response.data?.bookings || [];
  // normalize booking fields for frontend convenience
  return bookings.map(b => ({
    ...b,
    id: b._id || b.id,
    bookingId: b.bookingId || b.id || b._id,
    tour: b.tourName || (typeof b.tour === 'object' ? b.tour?.title : b.tour) || 'Custom trip',
    start: b.startLocation || b.start || 'N/A',
    destination: b.destination || 'N/A',
    date: b.travelDate || b.date,
    total: b.totalPrice !== undefined ? b.totalPrice : (b.total || 0)
  }));
};

export const getAdminDashboard = async () => {
  const response = await api.get('/admin/dashboard');
  return response.data;
};

export const getAdminUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

export const getAdminBookings = async () => {
  const response = await api.get('/admin/bookings');
  return response.data;
};

export const deleteAdminUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const getVehicles = async () => {
  try {
    const response = await api.get('/vehicles');
    return response.data?.vehicles || [];
  } catch (err) {
    console.error('Failed to fetch vehicles from backend:', err);
    return null;
  }
};

export const updateVehiclePricing = async (vehicleId, costPerKm) => {
  const response = await api.put(`/admin/pricing/${vehicleId}`, { costPerKm });
  return response.data;
};

export const cancelBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/cancel`);
  const booking = response.data?.booking || response.data;
  if (booking && booking._id && !booking.id) booking.id = booking._id;
  return booking;
};

export const cancelBookingAdmin = async (id) => {
  const response = await api.put(`/admin/bookings/${id}/cancel`);
  return response.data;
};

export const confirmBooking = async (bookingId, token) => {
  const response = await api.post(`/bookings/${bookingId}/confirm`, { token });
  return response.data;
};

// ==================== USER ====================

export const getProfile = async () => {
  const response = await api.get("/users/profile");

  return response.data;
};

export const updateProfile = async (data) => {
  const response = await api.put("/users/profile", data);

  return response.data;
};

export const saveExperience = async () => {
  const response = await api.post('/users/profile/save');
  return response.data;
};

export const addRating = async (rating) => {
  const response = await api.post('/users/profile/rate', { rating });
  return response.data;
};

export default api;