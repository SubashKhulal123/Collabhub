const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const { upload, uploadPortfolio } = require('../config/upload');
const {
  uploadProfilePicture,
  updateProfile,
  getUserProfile,
  addPortfolio,
  removePortfolio,
  getUserStats
} = require('../controllers/userController');

// ============ PUBLIC ROUTES (No authentication required) ============

// Get user profile - MAKE THIS PUBLIC (anyone can view)
router.get('/:id', getUserProfile);

// Get freelancers list - PUBLIC
router.get('/', async (req, res) => {
  try {
    const { skill, minRating } = req.query;
    let query = { role: 'freelancer', isActive: true };

    if (skill) {
      query.skills = { $in: [skill] };
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const freelancers = await User.find(query)
      .select('name email skills rating profilePicture completedProjects hourlyRate location bio')
      .limit(20)
      .sort('-rating');

    res.json(freelancers);
  } catch (error) {
    console.error('Get freelancers error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ============ PROTECTED ROUTES (Authentication required) ============

// Update user profile - PROTECTED (only user can update their own)
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.params.id !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Upload profile picture - PROTECTED
router.post('/upload-profile-picture', protect, upload.single('image'), uploadProfilePicture);

// Update profile (complete) - PROTECTED
router.put('/profile/update', protect, updateProfile);

// Portfolio routes - PROTECTED
router.post('/portfolio', protect, uploadPortfolio.single('image'), addPortfolio);
router.delete('/portfolio/:portfolioId', protect, removePortfolio);

// User stats - PROTECTED (shows private stats for logged in user)
router.get('/stats/me', protect, getUserStats);

module.exports = router;