const nodemailer = require('nodemailer');
const { MongoMemoryServer } = require('mongodb-memory-server');
const axios = require('axios');

(async function main(){
  try {
    console.log('Creating Ethereal test account...');
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal account created:', testAccount.user);

    process.env.SMTP_HOST = 'smtp.ethereal.email';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = testAccount.user;
    process.env.SMTP_PASS = testAccount.pass;
    process.env.SMTP_SECURE = 'false';
    process.env.ADMIN_EMAIL = testAccount.user;
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.FRONTEND_URL = 'http://localhost:5173';

    console.log('Starting in-memory MongoDB...');
    const mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();

    process.env.PORT = process.env.PORT || '5555';

    // Start the server
    console.log('Starting backend server...');
    const app = require('../server');
    const port = process.env.PORT || 5000;
    const server = app.listen(port, () => console.log(`Test server listening on ${port}`));

    // Wait for mongoose connection
    const mongoose = require('mongoose');
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timed out waiting for mongoose connection')), 10000);
      const check = () => {
        if (mongoose.connection && mongoose.connection.readyState === 1) {
          clearTimeout(timeout);
          return resolve();
        }
        setTimeout(check, 200);
      };
      check();
    });

    console.log('MongoDB connected, running test flows...');

    const api = axios.create({ baseURL: `http://localhost:${port}/api`, headers: { 'Content-Type': 'application/json' } });

    // 1) Register user
    const user = { name: 'E2E Tester', email: `e2e_${Date.now()}@example.com`, password: 'Abc@12345', phone: '9999999999' };
    console.log('Registering user:', user.email);
    const reg = await api.post('/auth/register', user);
    console.log('Register response:', reg.data);

    // 2) Login
    const login = await api.post('/auth/login', { email: user.email, password: user.password });
    console.log('Login response:', login.data);
    const token = login.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // 3) Create booking
    const bookingPayload = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      startLocation: 'City A',
      destination: 'City B',
      travelDate: new Date(Date.now() + 24*60*60*1000).toISOString(),
      members: 2,
      vehicle: 'car',
      totalPrice: 1500
    };

    console.log('Creating booking...');
    const bookingRes = await api.post('/bookings', bookingPayload);
    console.log('Booking response:', bookingRes.data);

    // Give time for mails to be delivered and preview URLs logged
    await new Promise(r => setTimeout(r, 2000));

    // Shutdown
    await server.close();
    await mongod.stop();
    console.log('Integration test finished. Check server logs above for Ethereal preview URLs.');
  } catch (err) {
    console.error('Integration test failed:', err);
    process.exit(1);
  }
})();
