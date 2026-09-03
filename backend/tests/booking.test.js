const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
let app;

describe('Booking API', () => {
  let mongod;
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';
    // Load app after setting MONGO_URI
    app = require('../server');
    // wait a moment for DB seed
    await new Promise(r => setTimeout(r, 500));
  }, 20000);

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });

  test('rejects booking if members exceed vehicle passenger capacity', async () => {
    // Seeded vehicles include Sedan capacity 4 -> maxPassengers 3
    // Create dummy user and bypass auth by creating booking with a fake user id
    const Vehicle = require('../models/Vehicle');
    const v = await Vehicle.findOne({ id: 'car' });
    expect(v).toBeTruthy();

    // create a verified user and token
    const User = require('../models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    const u = await User.create({ name: 'T', email: 'test@t.com', password: await bcrypt.hash('Password1!', 8), phone: '9000000000', isVerified: true });
    const tok = jwt.sign({ id: u._id }, process.env.JWT_SECRET || 'testsecret');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tok}`)
      .send({
        name: 'Test',
        email: 'a@b.com',
        phone: '9000000000',
        startLocation: 'Hubli',
        destination: 'Gokarna',
        travelDate: tomorrow.toISOString(),
        members: 4,
        vehicle: v.name,
        totalPrice: 1000,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/supports maximum/);
  });

  test('allows the single admin to load dashboard and update per-km pricing', async () => {
    const User = require('../models/User');
    const Vehicle = require('../models/Vehicle');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');

    const admin = await User.findOne({ role: 'admin' }) || await User.create({
      name: 'System Admin',
      email: 'admin@tours.com',
      password: await bcrypt.hash('Admin@123', 8),
      phone: '9999999999',
      role: 'admin',
      isVerified: true,
    });

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET || 'testsecret');

    const dashboard = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${token}`);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.success).toBe(true);
    expect(dashboard.body.summary).toBeTruthy();

    const sedan = await Vehicle.findOne({ id: 'car' });
    const update = await request(app)
      .put(`/api/admin/pricing/${sedan._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ costPerKm: 14 });

    expect(update.status).toBe(200);
    expect(update.body.success).toBe(true);
    expect(update.body.vehicle.costPerKm).toBe(14);
  });
});
