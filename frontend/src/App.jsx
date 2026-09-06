import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import FloatingLogo from "./components/FloatingLogo";
import ProtectedRoute from "./components/ProtectedRoute";
import { ToastProvider } from "./context/ToastContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Tours from "./pages/Tours";
import TourDetails from "./pages/TourDetails";
import MapPlanner from "./pages/MapPlanner";
import Booking from "./pages/Booking";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import VerifyAccount from "./pages/VerifyAccount";
import ConfirmBooking from "./pages/ConfirmBooking";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";
import SavedExperiences from "./pages/SavedExperiences";
import "./App.css";

function PublicRoute({ children }) {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated && user?.role === 'admin') return <Navigate to="/admin" replace />;
  return children;
}

function App() {
  return (
    <ToastProvider>
    <div className="app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<PublicRoute><Home /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/verify-account" element={<PublicRoute><VerifyAccount /></PublicRoute>} />
          <Route path="/confirm-booking" element={<ConfirmBooking />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/map-planner" element={<MapPlanner />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/saved-experiences" element={<SavedExperiences />} />
          </Route>
          <Route path="/tours" element={<PublicRoute><Tours /></PublicRoute>} />
          <Route path="/tours/:id" element={<PublicRoute><TourDetails /></PublicRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <FloatingLogo />
    </div>
    </ToastProvider>
  );
}

export default App;