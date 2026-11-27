const User = require('../models/User');
const Notification = require('../models/Notification');

// Get pending freelancers for approval
const getPendingFreelancers = async (req, res) => {
  try {
    const pendingFreelancers = await User.find({ 
      role: 'freelancer', 
      isApproved: false,
      isEmailVerified: true
    }).select('-password').sort('-createdAt');
    
    res.json(pendingFreelancers);
  } catch (error) {
    console.error('Get pending freelancers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Approve freelancer
const approveFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    
    const freelancer = await User.findById(id);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    freelancer.isApproved = true;
    freelancer.approvedAt = new Date();
    freelancer.approvedBy = req.user._id;
    await freelancer.save();
    
    // Notify freelancer
    await Notification.create({
      user: freelancer._id,
      type: 'account_approved',
      title: 'Account Approved! 🎉',
      message: 'Your freelancer account has been approved. You can now login and start working on projects.',
      relatedId: freelancer._id,
      relatedModel: 'User'
    });
    
    res.json({ success: true, message: 'Freelancer approved successfully' });
  } catch (error) {
    console.error('Approve freelancer error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reject freelancer
const rejectFreelancer = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const freelancer = await User.findById(id);
    
    if (!freelancer) {
      return res.status(404).json({ message: 'Freelancer not found' });
    }
    
    freelancer.isApproved = false;
    freelancer.rejectionReason = rejectionReason;
    await freelancer.save();
    
    // Notify freelancer
    await Notification.create({
      user: freelancer._id,
      type: 'account_rejected',
      title: 'Account Update',
      message: `Your freelancer account application was not approved. Reason: ${rejectionReason}`,
      relatedId: freelancer._id,
      relatedModel: 'User'
    });
    
    res.json({ success: true, message: 'Freelancer rejected' });
  } catch (error) {
    console.error('Reject freelancer error:', error);
    res.status(500).json({ message: error.message });
  }
};


const getApprovedFreelancers = async (req, res) => {
  try {
    const approvedFreelancers = await User.find({ 
      role: 'freelancer', 
      isApproved: true,
      isActive: true
    }).select('-password').sort('-approvedAt');
    
    res.json(approvedFreelancers);
  } catch (error) {
    console.error('Get approved freelancers error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get rejected freelancers
const getRejectedFreelancers = async (req, res) => {
  try {
    const rejectedFreelancers = await User.find({ 
      role: 'freelancer', 
      isApproved: false,
      rejectionReason: { $ne: null, $exists: true }
    }).select('-password').sort('-createdAt');
    
    res.json(rejectedFreelancers);
  } catch (error) {
    console.error('Get rejected freelancers error:', error);
    res.status(500).json({ message: error.message });
  }
};


module.exports = { getPendingFreelancers, approveFreelancer, rejectFreelancer, getApprovedFreelancers, getRejectedFreelancers };