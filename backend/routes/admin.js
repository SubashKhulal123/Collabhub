


const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Project = require('../models/Project');
const Transaction = require('../models/Transaction');
const Wallet = require('../models/Wallet');
const { protect, authorize } = require('../middleware/auth');
const {
  getPendingFreelancers,
  approveFreelancer,
  rejectFreelancer,
  getApprovedFreelancers,
  getRejectedFreelancers
} = require('../controllers/adminApprovalController');

router.use(protect);
router.use(authorize('admin'));

// Get platform stats (updated with earnings)
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalFreelancers = await User.countDocuments({ role: 'freelancer' });
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ status: 'completed' });
    const openProjects = await Project.countDocuments({ status: 'open' });
    
    // Get platform earnings
    const platformFees = await Transaction.aggregate([
      { $match: { type: 'platform_fee', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalRevenue = await Transaction.aggregate([
      { $match: { type: 'payment_received', status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalUsers,
      totalFreelancers,
      totalClients,
      totalProjects,
      completedProjects,
      openProjects,
      platformFees: platformFees[0]?.total || 0,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Suspend user (toggle)
router.put('/users/:id/suspend', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ 
      success: true,
      message: `User ${user.isActive ? 'activated' : 'suspended'} successfully` 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get platform wallet (admin's wallet)
router.get('/platform-wallet', async (req, res) => {
  try {
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    let wallet = await Wallet.findOne({ user: admin._id });
    if (!wallet) {
      wallet = await Wallet.create({ 
        user: admin._id, 
        balance: 0, 
        totalEarned: 0, 
        totalSpent: 0,
        pendingBalance: 0
      });
    }
    
    res.json(wallet);
  } catch (error) {
    console.error('Platform wallet error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Withdraw platform fees
router.post('/withdraw-platform-fees', async (req, res) => {
  try {
    const { amount, bankAccount } = req.body;
    
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    
    let wallet = await Wallet.findOne({ user: admin._id });
    if (!wallet) {
      wallet = await Wallet.create({ user: admin._id, balance: 0 });
    }
    
    if (wallet.balance < amount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }
    
    wallet.balance -= amount;
    await wallet.save();
    
    await Transaction.create({
      user: admin._id,
      type: 'withdrawal',
      amount: amount,
      status: 'pending',
      description: `Platform fee withdrawal of $${amount}`,
      metadata: { bankAccount },
      completedAt: null
    });
    
    res.json({ 
      success: true, 
      message: `Withdrawal request of $${amount} submitted`,
      newBalance: wallet.balance
    });
  } catch (error) {
    console.error('Withdraw error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ==================== FREELANCER APPROVAL ROUTES ====================
// Get pending freelancers for approval
router.get('/pending-freelancers', getPendingFreelancers);

// Approve a freelancer
router.post('/approve-freelancer/:id', approveFreelancer);

// Reject a freelancer
router.post('/reject-freelancer/:id', rejectFreelancer);

router.get('/approved-freelancers', getApprovedFreelancers);
router.get('/rejected-freelancers', getRejectedFreelancers);
module.exports = router;