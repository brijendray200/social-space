// Quick script to create a test user
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const createTestUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/social-space');
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: 'test@example.com' });
    
    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log('Email:', existingUser.email);
      console.log('Username:', existingUser.username);
      console.log('\nYou can login with:');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      
      // Delete and recreate
      console.log('\n🗑️  Deleting old user...');
      await User.deleteOne({ email: 'test@example.com' });
      console.log('✅ Old user deleted');
    }

    // Create new test user
    console.log('\n📝 Creating new test user...');
    const testUser = new User({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
      name: 'Test User',
      bio: 'This is a test user account'
    });

    await testUser.save();
    console.log('✅ Test user created successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email:    test@example.com');
    console.log('Password: test123');
    console.log('Username: testuser');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n🚀 Now you can login at: http://localhost:5000/test-login.html');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTestUser();
