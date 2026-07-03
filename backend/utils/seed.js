require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@123456';

    console.log(`Seeding admin account: ${email}`);

    // bcrypt cost factor 12+
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      adminExists.passwordHash = passwordHash;
      await adminExists.save();
      console.log('Admin account already existed. Password updated successfully!');
    } else {
      await Admin.create({
        email,
        passwordHash,
      });
      console.log('Admin account created successfully!');
    }

    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
