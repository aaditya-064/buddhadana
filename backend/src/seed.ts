import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from './models/User.js';

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/buddha-dana-udhyog';
  await mongoose.connect(uri);
  console.log('[Seed] Connected to MongoDB.');

  // Check if admin already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    console.log(`[Seed] Admin user already exists: ${existingAdmin.email}`);
    console.log('[Seed] No changes made. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // Create default admin
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@buddhadana.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@12345678';
  const adminName = process.env.ADMIN_NAME || 'Administrator';

  const admin = await User.create({
    name: adminName,
    email: adminEmail,
    password: adminPassword,
    role: 'admin',
  });

  console.log(`[Seed] Admin user created: ${admin.email}`);
  console.log('[Seed] IMPORTANT: Change the default password after first login.');
  console.log('[Seed] Done.');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});
