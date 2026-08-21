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
    const token = localStorage.getItem("token");

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
      localStorage.setItem("token", response.data.token);
    }

    if (response.data.user) {
      localStorage.setItem("user", JSON.stringify(response.data.user));
    }

    return response.data;
  } catch (err) {
    const msg = err?.response?.data?.message || err.message || "Login failed.";
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
  if (booking && booking._id && !booking.id) booking.id = booking._id;
  return booking;
};

export const getMyBookings = async () => {
  const response = await api.get("/bookings/my-bookings");

  const bookings = response.data?.bookings || [];
  // normalize id
  return bookings.map(b => ({ ...b, id: b.id || b._id }));
};

export const cancelBooking = async (id) => {
  const response = await api.put(`/bookings/${id}/cancel`);
  const booking = response.data?.booking || response.data;
  if (booking && booking._id && !booking.id) booking.id = booking._id;
  return booking;
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

export default api;