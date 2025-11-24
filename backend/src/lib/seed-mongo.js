// seed-mongo.js
// MongoDB seed script for creating default admin user
// Usage: npm run seed-mongo

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const RepositoryFactory = require('../repositories/repository.factory');

async function ensureSeed() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.log('⚠️  MONGO_URI not set, skipping MongoDB seed');
    return;
  }

  // Connect if not already connected
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB for seeding');
    } catch (err) {
      console.error('❌ Failed to connect to MongoDB:', err.message);
      throw err;
    }
  }

  const userRepo = RepositoryFactory.getUserRepository();
  const adminEmail = "admin@school.test";
  
  // Check if admin already exists
  let admin = await userRepo.findOne({ email: adminEmail });
  
  if (!admin) {
    admin = await userRepo.create({
      id: "admin_1",
      name: "Admin",
      email: adminEmail,
      role: "admin",
      balance: 0,
      passwordHash: bcrypt.hashSync("admin123", 10),
      studentId: "000000001",
      phone: "0000000000",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log("✅ Seed: created default admin user.");
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: admin123`);
    console.log(`   Student ID: 000000001`);
  } else {
    // Ensure password is hashed
    if (!admin.passwordHash) {
      const plain = admin.password || "admin123";
      await userRepo.update(admin.id, {
        passwordHash: bcrypt.hashSync(plain, 10),
        password: undefined
      });
      console.log("✅ Seed: migrated admin password to hashed.");
    } else {
      console.log("ℹ️  Admin user already exists.");
    }
  }

  // Don't close connection if it was already open
  // (let the main app manage the connection)
  // Only close if we opened it ourselves
  if (mongoose.connection.readyState === 1 && process.env.NODE_ENV !== 'production') {
    // In non-production, we might want to close if we opened it
    // But for seed scripts, it's often better to leave it open
    // The process will exit anyway
  }
}

module.exports = { ensureSeed };

