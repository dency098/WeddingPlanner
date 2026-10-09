require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const seedAdmin = async () => {
  try {
    await connectDB();

    const adminName = process.env.ADMIN_NAME || 'System Admin';
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@weddingplanner.com').toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD || 'change_this_password';

    const existingAdmin = await Admin.findOne({ email: adminEmail });

    if (existingAdmin) {
      console.log('Admin already exists.');
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await Admin.create({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
    });

    console.log(`Admin created: ${adminEmail}`);
  } catch (error) {
    console.error('Admin seed failed:', error.message);
  } finally {
    process.exit(0);
  }
};

seedAdmin();
