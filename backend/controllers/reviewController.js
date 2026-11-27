const Review = require('../models/Review');
const User = require('../models/User');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// @desc    Create review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { projectId, toUserId, rating, comment } = req.body;
    
    console.log('Creating review:', { projectId, toUserId, rating, comment });
    
    // Check if project exists
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    // Check if project is completed
    if (project.status !== 'completed') {
      return res.status(400).json({ message: 'Can only review completed projects' });
    }
    
    // Check if user is the client (only clients can review freelancers)
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only the project client can leave a review' });
    }
    
    // Check if review already exists
    const existingReview = await Review.findOne({ 
      project: projectId, 
      fromUser: req.user._id 
    });
    
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this project' });
    }
    
    // Create review
    const review = await Review.create({
      project: projectId,
      fromUser: req.user._id,
      toUser: toUserId,
      rating: parseInt(rating),
      comment
    });
    
    // Update freelancer's average rating
    const allReviews = await Review.find({ toUser: toUserId });
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / allReviews.length;
    
    await User.findByIdAndUpdate(toUserId, {
      rating: averageRating,
      totalReviews: allReviews.length
    });
    
    // Create notification for freelancer
    await Notification.create({
      user: toUserId,
      type: 'review_received',
      title: 'New Review Received',
      message: `${req.user.name} gave you a ${rating}★ review on project "${project.title}"`,
      relatedId: project._id,
      relatedModel: 'Project'
    });
    
    res.status(201).json({ 
      success: true, 
      review,
      message: 'Review submitted successfully'
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a user
// @route   GET /api/reviews/user/:userId
// @access  Public
const getUserReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ toUser: req.params.userId })
      .populate('fromUser', 'name profilePicture')
      .populate('project', 'title')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reviews for a project
// @route   GET /api/reviews/project/:projectId
// @access  Public
const getProjectReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ project: req.params.projectId })
      .populate('fromUser', 'name profilePicture')
      .populate('toUser', 'name profilePicture')
      .sort('-createdAt');
    res.json(reviews);
  } catch (error) {
    console.error('Get project reviews error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createReview, getUserReviews, getProjectReviews };