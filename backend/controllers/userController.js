const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Upload profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Delete old image if exists and not default
    if (user.profilePicture && 
        user.profilePicture !== 'https://via.placeholder.com/150' &&
        !user.profilePicture.includes('placeholder')) {
      const oldFilename = user.profilePicture.split('/').pop();
      const oldImagePath = path.join(__dirname, '../uploads/profiles', oldFilename);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Create FULL URL for the image
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    
    user.profilePicture = imageUrl;
    await user.save();

    res.json({
      success: true,
      profilePicture: imageUrl,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      },
      message: 'Profile picture updated successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const { name, bio, skills, hourlyRate, location, phone, website } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (skills) {
      user.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim());
    }
    if (hourlyRate) user.hourlyRate = parseFloat(hourlyRate);
    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (website !== undefined) user.website = website;
    
    await user.save();
    
    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        skills: user.skills,
        hourlyRate: user.hourlyRate,
        location: user.location,
        phone: user.phone,
        website: user.website,
        profilePicture: user.profilePicture,
        rating: user.rating,
        completedProjects: user.completedProjects
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: error.message });
  }
};
// Get user profile by ID - PUBLIC (removed authentication requirement)
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -email -phone -isVerified'); // Hide sensitive info
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // If user is inactive, don't show profile
    if (!user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Add portfolio item - FIXED VERSION
const addPortfolio = async (req, res) => {
  try {
    const { title, description, link } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Create portfolio image URL if file was uploaded
    let imageUrl = null;
    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/portfolio/${req.file.filename}`;
    }
    
    user.portfolio.push({
      title,
      description,
      link,
      imageUrl: imageUrl,
      createdAt: new Date()
    });
    
    await user.save();
    
    res.json({
      success: true,
      portfolio: user.portfolio
    });
  } catch (error) {
    console.error('Add portfolio error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Remove portfolio item
const removePortfolio = async (req, res) => {
  try {
    const { portfolioId } = req.params;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.portfolio = user.portfolio.filter(p => p._id.toString() !== portfolioId);
    await user.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove portfolio error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get user stats
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    let stats = {
      memberSince: user.createdAt,
      totalProjects: user.completedProjects || 0,
      rating: user.rating || 0,
      totalReviews: user.totalReviews || 0
    };
    
    if (user.role === 'freelancer') {
      stats.hourlyRate = user.hourlyRate;
      stats.skillsCount = user.skills?.length || 0;
      stats.portfolioCount = user.portfolio?.length || 0;
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: error.message });
  }
};



module.exports = {
  uploadProfilePicture,
  updateProfile,
  addPortfolio,
  removePortfolio,
  getUserStats,
//   changePassword, 
  getUserProfile
};