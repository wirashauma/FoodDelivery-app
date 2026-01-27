// scripts/createAdmin.js
// Run this script to create a default admin user
// Usage: node scripts/createAdmin.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const adminEmail = 'admin@titipin.com';
    const adminPassword = 'admin123'; // Change this in production!

    // Check if admin already exists
    const existingAdmin = await prisma.users.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminEmail);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        password_hash: hashedPassword,
        role: 'ADMIN',
        nama: 'Administrator'
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User ID:', admin.user_id);
    console.log('\n⚠️  Remember to change the password in production!');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
