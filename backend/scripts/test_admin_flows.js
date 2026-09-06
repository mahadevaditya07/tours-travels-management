require('dotenv').config();
const axios = require('axios');

const API = axios.create({ baseURL: `http://localhost:${process.env.PORT || 5000}/api` });

const adminCreds = { email: (process.env.ADMIN_EMAIL || 'admin@tours.com'), password: (process.env.ADMIN_PASSWORD || 'Admin@123') };

const run = async () => {
  try {
    console.log('1) Registering a temporary test user...');
    const testEmail = `tempuser+${Date.now()}@example.com`;
    await API.post('/auth/register', { name: 'Temp User', email: testEmail, password: 'TempPass123!', phone: '9000000000' });

    console.log('2) Logging in as admin...');
    const login = await API.post('/auth/login', adminCreds);
    const token = login.data?.token;
    if (!token) throw new Error('Admin login failed');
    API.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    console.log('3) Fetching admin users to locate temporary user...');
    const usersRes = await API.get('/admin/users');
    const users = usersRes.data?.users || [];
    const testUser = users.find(u => u.email === testEmail);
    if (!testUser) {
      throw new Error('Temporary user not found in admin users list.');
    }

    console.log('4) Fetching tours (public endpoint)...');
    const toursRes = await API.get('/tours');
    const tours = toursRes.data?.tours || [];
    console.log('Tours count:', tours.length);

    if (tours.length > 0) {
      const t = tours[0];
      console.log('5) Updating per-person price for tour:', t._id || t.id);
      const newPrice = (t.pricePerPerson || t.price || 1000) + 100;
      await API.put(`/tours/${t._id || t.id}`, { pricePerPerson: newPrice });
      console.log('Updated per-person price to', newPrice);
    } else {
      console.log('No tours found to update.');
    }

    console.log('6) Deleting temporary test user via admin endpoint...');
    await API.delete(`/admin/users/${testUser._id || testUser.id}`);
    console.log('Deleted test user.');

    console.log('Admin flow test completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Admin flow test failed:', err.response?.data || err.message || err);
    process.exit(1);
  }
};

run();
