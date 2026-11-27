const mongoose = require('mongoose');
const User = require('../models/User');
const Wallet = require('../models/Wallet');
require('dotenv').config();

async function setupPlatformWallet() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.error('No admin user found. Please create an admin first.');
      process.exit(1);
    }

    // Create or update platform wallet
    const wallet = await Wallet.findOneAndUpdate(
      { user: admin._id },
      { 
        $setOnInsert: { 
          user: admin._id, 
          balance: 0, 
          totalEarned: 0, 
          totalSpent: 0,
          pendingBalance: 0
        } 
      },
      { upsert: true, new: true }
    );

    console.log('Platform wallet setup complete!');
    console.log(`Admin: ${admin.name} (${admin.email})`);
    console.log(`Wallet ID: ${wallet._id}`);
    console.log(`Balance: $${wallet.balance}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

setupPlatformWallet();