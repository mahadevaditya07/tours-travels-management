require('dotenv').config();
const connectDB = require('../config/db');
const Tour = require('../models/Tour');

const tours = [
  { title: 'Gokarna Coastal Escape', destination: 'Gokarna, Karnataka', duration: '3 Days / 2 Nights', price: 6999, rating: 4.8, image: '/images/gokarna.jpg', category: 'Beach', places: ['Om Beach','Kudle Beach','Yana Caves'], description: 'A laid-back coastal journey combining beaches, sunsets and local culture.', availableDates: [new Date('2026-09-05'), new Date('2026-09-19')] },
  { title: 'Coorg Coffee Trail', destination: 'Coorg, Karnataka', duration: '4 Days / 3 Nights', price: 8999, rating: 4.7, image: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2', category: 'Nature', places: ['Abbey Falls','Raja\'s Seat'], description: 'Explore the misty hills of Coorg with coffee trails and waterfall visits.', availableDates: [new Date('2026-09-12')] },
  { title: 'Dandeli Adventure', destination: 'Dandeli, Karnataka', duration: '2 Days / 1 Night', price: 5499, rating: 4.9, image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa', category: 'Adventure', places: ['Kali River','Syntheri Rocks'], description: 'A high-energy forest escape with river adventures and wildlife.', availableDates: [new Date('2026-09-06')] }
];

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB; seeding tours if empty...');
    const count = await Tour.countDocuments();
    if (count === 0) {
      await Tour.insertMany(tours);
      console.log('Seeded tours.');
    } else {
      console.log(`Tours exist (${count}). Skipping seed.`);
    }
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

run();
