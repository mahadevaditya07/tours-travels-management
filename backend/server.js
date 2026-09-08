require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const tourRoutes = require("./routes/tourRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const userRoutes = require("./routes/userRoutes");
const vehicleRoutes = require("./routes/vehicleRoutes");
const adminRoutes = require("./routes/adminRoutes");

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
app.use("/api/admin", adminRoutes);

// Seed vehicle data if not present
const Vehicle = require('./models/Vehicle');
const User = require('./models/User');
const Tour = require('./models/Tour');

const seedAdminAccount = async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || 'admin@tours.com').toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@123';
    const existing = await User.findOne({ role: 'admin' });

    if (!existing) {
      await User.create({
        name: 'System Admin',
        email,
        password: await bcrypt.hash(password, 12),
        phone: '9999999999',
        role: 'admin',
        isVerified: true,
      });
      console.log(`Seeded admin account: ${email} / ${password}`);
    }
  } catch (e) {
    console.error('Admin seed failed', e.message || e);
  }
};

const seedVehicles = async () => {
  try {
    const items = [
      { id: 'innova', name: 'Toyota Innova', capacity: 6, mileage: 12, costPerKm: 20, description: 'Spacious and comfortable for family trips.' },
      { id: 'swift', name: 'Maruti Swift', capacity: 3, mileage: 20, costPerKm: 12, description: 'Fuel-efficient hatchback for city and short trips.' },
      { id: 'etios', name: 'Toyota Etios', capacity: 3, mileage: 18, costPerKm: 13, description: 'Reliable sedan with good boot space.' },
      { id: 'travera', name: 'Tavera / Travera', capacity: 6, mileage: 12, costPerKm: 18, description: 'Good for medium groups and inter-city travel.' },
      { id: 'cruiser', name: 'Force Traveller', capacity: 13, mileage: 9, costPerKm: 22, description: 'Robust traveller for larger groups and long hauls.' },
      { id: 'car', name: 'Sedan', capacity: 4, mileage: 16, costPerKm: 15, description: 'Comfortable for small groups.' },
      { id: 'suv', name: 'SUV', capacity: 7, mileage: 14, costPerKm: 16, description: 'Extra space for families and luggage.' },
      { id: 'tempo', name: 'Tempo Traveller', capacity: 12, mileage: 10, costPerKm: 18, description: 'Ideal for medium-sized groups.' },
      { id: 'bus', name: 'Mini Bus', capacity: 25, mileage: 7, costPerKm: 23, description: 'Best for larger groups.' }
    ];
    for (const item of items) {
      await Vehicle.updateOne(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true }
      );
    }
    console.log('Seeded vehicles into DB');
  } catch (e) {
    console.error('Vehicle seed failed', e.message || e);
  }
};

const seedTours = async () => {
  try {
    const tourItems = [
      { id: "gokarna-escape", title: "Gokarna Coastal Escape", destination: "Gokarna, Karnataka", duration: "3 Days / 2 Nights", price: 6999, pricePerPerson: 6999, rating: 4.8, image: "/images/gokarna.jpg", category: "Beach", places: ["Om Beach", "Kudle Beach", "Yana Caves"], description: "A laid-back coastal journey combining beaches, sunsets and local culture.", dates: ["2026-09-05", "2026-09-19", "2026-10-03"], included: ["Hotel stay", "Local sightseeing", "Breakfast"], excluded: ["Personal expenses", "Adventure activities"] },
      { id: "coorg-retreat", title: "Coorg Coffee Trail", destination: "Coorg, Karnataka", duration: "4 Days / 3 Nights", price: 8999, pricePerPerson: 8999, rating: 4.7, image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=900&q=80", category: "Nature", places: ["Abbey Falls", "Raja's Seat", "Coffee Estate"], description: "Explore the misty hills of Coorg with coffee trails and waterfall visits.", dates: ["2026-09-12", "2026-10-10"], included: ["Resort stay", "Breakfast", "Sightseeing"], excluded: ["Lunch and dinner", "Personal expenses"] },
      { id: "dandeli-adventure", title: "Dandeli Adventure", destination: "Dandeli, Karnataka", duration: "2 Days / 1 Night", price: 5499, pricePerPerson: 5499, rating: 4.9, image: "https://images.unsplash.com/photo-1544735716-392fe2489ffa?auto=format&fit=crop&w=900&q=80", category: "Adventure", places: ["Kali River", "Syntheri Rocks", "Wildlife Safari"], description: "A high-energy forest escape with river adventures and wildlife.", dates: ["2026-09-06", "2026-09-20"], included: ["Stay", "Breakfast", "Forest entry"], excluded: ["Rafting charges", "Personal expenses"] },
      { id: "munnar-mountains", title: "Munnar Mountain Journey", destination: "Munnar, Kerala", duration: "5 Days / 4 Nights", price: 11999, pricePerPerson: 11999, rating: 4.9, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=900&q=80", category: "Mountains", places: ["Tea Gardens", "Top Station", "Mattupetty Dam"], description: "A scenic mountain trip through tea plantations and misty viewpoints.", dates: ["2026-09-18", "2026-10-16"], included: ["Hotel", "Breakfast", "Transfers"], excluded: ["Entry tickets", "Personal expenses"] },
      { id: "murudeshwar-temple-coast", title: "Murudeshwar Coastal & Temple Trip", destination: "Murudeshwar, Karnataka", duration: "2 Days / 1 Night", price: 4999, pricePerPerson: 4999, rating: 4.6, image: "/images/murudeshwara.jpg", category: "Heritage", places: ["Murudeshwar Temple", "Netrani Island"], description: "Visit the towering Shiva statue and enjoy coastal views.", dates: ["2026-09-10", "2026-09-24"], included: ["Hotel", "Temple visit", "Breakfast"], excluded: ["Boat charges", "Personal expenses"] },
      { id: "badami-caves-tour", title: "Badami Cave Temples", destination: "Badami, Karnataka", duration: "2 Days / 1 Night", price: 5999, pricePerPerson: 5999, rating: 4.7, image: "/images/badami.jpg", category: "Heritage", places: ["Badami Caves", "Agastya Lake", "Bhutanatha Group"], description: "Explore ancient rock-cut temples and historic sites.", dates: ["2026-09-15", "2026-10-01"], included: ["Stay", "Breakfast", "Guide"], excluded: ["Entry fees", "Personal expenses"] },
      { id: "pattadakallu-heritage", title: "Pattadakallu Temple Trail", destination: "Pattadakallu, Karnataka", duration: "1 Day", price: 2999, pricePerPerson: 2999, rating: 4.5, image: "/images/pattadakallu.jpg", category: "Heritage", places: ["Pattadakallu Temples", "Aihole"], description: "Day trip to admire Chalukyan temple architecture.", dates: ["2026-09-20", "2026-10-05"], included: ["Transport", "Guide"], excluded: ["Lunch", "Entry fees"] },
      { id: "bijapur-monuments", title: "Bijapur Historical Monuments", destination: "Bijapur, Karnataka", duration: "2 Days / 1 Night", price: 5499, pricePerPerson: 5499, rating: 4.6, image: "/images/bijapura.jpg", category: "Heritage", places: ["Gol Gumbaz", "Ibrahim Rauza"], description: "A guided tour of Bijapur's grand monuments.", dates: ["2026-09-22", "2026-10-07"], included: ["Stay", "Breakfast", "Sightseeing"], excluded: ["Entry fees", "Personal expenses"] },
      { id: "jogfalls-view", title: "Jog Falls Getaway", destination: "Jog Falls, Karnataka", duration: "1 Day", price: 2499, pricePerPerson: 2499, rating: 4.8, image: "/images/jogfalls.jpg", category: "Nature", places: ["Viewpoints", "Local trails"], description: "Short trip to witness the spectacular waterfall.", dates: ["2026-09-08", "2026-09-29"], included: ["Transport"], excluded: ["Food", "Personal expenses"] },
      { id: "hampi-ruins", title: "Hampi Heritage Explorer", destination: "Hampi, Karnataka", duration: "2 Days / 1 Night", price: 7999, pricePerPerson: 7999, rating: 4.9, image: "/images/hampi.jpg", category: "Heritage", places: ["Vijaya Vittala", "Virupaksha Temple", "Royal Enclosure"], description: "Explore the ruins and scenic boulder landscapes of Hampi.", dates: ["2026-09-28", "2026-10-12"], included: ["Stay", "Breakfast", "Local transport"], excluded: ["Guide fees", "Entry"] },
      { id: "mangalore-coast", title: "Mangalore Coastal Taste & Sights", destination: "Mangalore, Karnataka", duration: "2 Days / 1 Night", price: 5999, pricePerPerson: 5999, rating: 4.5, image: "/images/mangaluru.jpg", category: "Coastal", places: ["Panambur Beach", "St. Aloysius Chapel"], description: "Enjoy beaches and local cuisine in Mangalore.", dates: ["2026-09-14", "2026-09-30"], included: ["Stay", "Breakfast"], excluded: ["Food", "Personal expenses"] },
      { id: "udupi-temple-coast", title: "Udupi Temple & Backwaters", destination: "Udupi, Karnataka", duration: "1 Day", price: 2799, pricePerPerson: 2799, rating: 4.6, image: "/images/udupi.jpg", category: "Cultural", places: ["Sri Krishna Temple", "Malpe Beach"], description: "A short cultural trip including a famous temple visit.", dates: ["2026-09-11", "2026-09-25"], included: ["Transport"], excluded: ["Food", "Personal expenses"] }
    ];
    for (const item of tourItems) {
      await Tour.updateOne(
        { id: item.id },
        { $setOnInsert: item },
        { upsert: true }
      );
    }
    console.log('Seeded tours into DB');
  } catch (e) {
    console.error('Tour seed failed', e.message || e);
  }
};

seedVehicles();
seedTours();
seedAdminAccount();

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