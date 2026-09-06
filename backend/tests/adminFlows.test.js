const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let app;
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongod.getUri();
  process.env.JWT_SECRET = 'testsecret';
  process.env.ADMIN_EMAIL = 'admin@tours.com';
  process.env.ADMIN_PASSWORD = 'Admin@123';

  // Connect mongoose directly and create admin user so server seed timing cannot fail
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('../models/User');
  const bcrypt = require('bcryptjs');
  const existing = await User.findOne({ email: process.env.ADMIN_EMAIL.toLowerCase() });
  if (!existing) {
    await User.create({ name: 'System Admin', email: process.env.ADMIN_EMAIL.toLowerCase(), password: await bcrypt.hash(process.env.ADMIN_PASSWORD, 12), phone: '9999999999', role: 'admin', isVerified: true });
  }

  // Require server after DB and admin seeded
  app = require('../server');
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Admin flows (integration)', () => {
  let adminToken;

  test('admin can login and create a tour, update per-person price, and delete a user', async () => {
    // login admin
    const loginRes = await request(app).post('/api/auth/login').send({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    adminToken = loginRes.body.token;

    // create a tour as admin
    const tourPayload = { title: 'Test Tour', destination: 'Testland', price: 1000 };
    const createRes = await request(app).post('/api/tours').set('Authorization', `Bearer ${adminToken}`).send(tourPayload);
    expect(createRes.statusCode === 201 || createRes.statusCode === 200).toBeTruthy();
    const tour = createRes.body.tour || createRes.body;
    expect(tour._id || tour.id).toBeTruthy();

    const tourId = tour._id || tour.id;

    // update per-person price
    const newPerPerson = 1500;
    const upd = await request(app).put(`/api/tours/${tourId}`).set('Authorization', `Bearer ${adminToken}`).send({ pricePerPerson: newPerPerson });
    expect(upd.statusCode).toBe(200);
    expect(upd.body.tour.pricePerPerson).toBe(newPerPerson);

    // register a normal user
    const tempEmail = `temp+${Date.now()}@example.com`;
    const reg = await request(app).post('/api/auth/register').send({ name: 'Temp', email: tempEmail, password: 'TempPass123!', phone: '9000000000' });
    expect([200,201].includes(reg.statusCode)).toBeTruthy();

    // fetch admin users to find the new user
    const usersRes = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
    expect(usersRes.statusCode).toBe(200);
    const users = usersRes.body.users || [];
    const created = users.find(u => u.email === tempEmail);
    expect(created).toBeTruthy();

    // delete the user
    const del = await request(app).delete(`/api/admin/users/${created._id}`).set('Authorization', `Bearer ${adminToken}`);
    expect(del.statusCode).toBe(200);
    expect(del.body.success).toBeTruthy();
  }, 20000);
});
