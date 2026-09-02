require("dotenv").config();

const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const tourRoutes = require("./routes/tourRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");

const app = express();

connectDB();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Tours & Travels Management System API is running 🚀",
    version: "1.0.0",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/tours", tourRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/users", userRoutes);
app.use("/api/vehicles", vehicleRoutes);

// Seed vehicle data if not present
const Vehicle = require('./models/Vehicle');
const seedVehicles = async () => {
  try {
    const count = await Vehicle.countDocuments();
    if (count === 0) {
      const items = [
        { id: 'car', name: 'Sedan', capacity: 4, mileage: 16, costPerKm: 15, description: 'Comfortable for small groups.' },
        { id: 'suv', name: 'SUV', capacity: 7, mileage: 14, costPerKm: 16, description: 'Extra space for families and luggage.' },
        { id: 'tempo', name: 'Tempo Traveller', capacity: 12, mileage: 10, costPerKm: 18, description: 'Ideal for medium-sized groups.' },
        { id: 'bus', name: 'Mini Bus', capacity: 25, mileage: 7, costPerKm: 23, description: 'Best for larger groups.' },
      ];
      await Vehicle.insertMany(items);
      console.log('Seeded vehicles into DB');
    }
  } catch (e) {
    console.error('Vehicle seed failed', e.message || e);
  }
};

seedVehicles();

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;