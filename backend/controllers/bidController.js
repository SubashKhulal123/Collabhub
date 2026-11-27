const Bid = require('../models/Bid');
const Project = require('../models/Project');
const Notification = require('../models/Notification');

// @desc    Place bid on project
// @route   POST /api/bids
// @access  Private (Freelancer only)
const placeBid = async (req, res) => {
  try {
    if (req.user.role !== 'freelancer') {
      return res.status(403).json({ message: 'Only freelancers can place bids' });
    }

    const { projectId, amount, estimatedDays, proposal, coverLetter } = req.body;

    // Check if project exists and is open
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Project is not open for bidding' });
    }

    // Check if already bid
    const existingBid = await Bid.findOne({ project: projectId, freelancer: req.user._id });
    if (existingBid) {
      return res.status(400).json({ message: 'You have already placed a bid on this project' });
    }

    const bid = await Bid.create({
      project: projectId,
      freelancer: req.user._id,
      amount,
      estimatedDays,
      proposal,
      coverLetter
    });

    // Update project bids count
    project.bidsCount += 1;
    await project.save();

    // Create notification for client
    await Notification.create({
      user: project.client,
      type: 'new_bid',
      title: 'New Bid Received',
      message: `${req.user.name} placed a bid of $${amount} on your project "${project.title}"`,
      relatedId: project._id
    });

    res.status(201).json(bid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get bids for a project
// @route   GET /api/bids/project/:projectId
// @access  Private
const getProjectBids = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is client of project or admin
    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const bids = await Bid.find({ project: req.params.projectId })
      .populate('freelancer', 'name email rating skills profilePicture completedProjects')
      .sort('-createdAt');

    res.json(bids);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept bid
// @route   PUT /api/bids/:id/accept
// @access  Private (Client who owns project)
const acceptBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('project freelancer');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    const project = await Project.findById(bid.project._id);
    
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (project.status !== 'open') {
      return res.status(400).json({ message: 'Project is no longer open' });
    }

    // Update bid status
    bid.status = 'accepted';
    await bid.save();

    // Reject all other bids
    await Bid.updateMany(
      { project: project._id, _id: { $ne: bid._id } },
      { status: 'rejected' }
    );

    // Update project
    project.status = 'in_progress';
    project.assignedTo = bid.freelancer._id;
    await project.save();

    // Create notification for freelancer
    await Notification.create({
      user: bid.freelancer._id,
      type: 'bid_accepted',
      title: 'Bid Accepted!',
      message: `Your bid for project "${project.title}" has been accepted`,
      relatedId: project._id
    });

    res.json({ message: 'Bid accepted successfully', project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject bid
// @route   PUT /api/bids/:id/reject
// @access  Private (Client who owns project)
const rejectBid = async (req, res) => {
  try {
    const bid = await Bid.findById(req.params.id).populate('project');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    const project = await Project.findById(bid.project._id);
    
    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    bid.status = 'rejected';
    await bid.save();

    await Notification.create({
      user: bid.freelancer,
      type: 'bid_rejected',
      title: 'Bid Rejected',
      message: `Your bid for project "${project.title}" was rejected`,
      relatedId: project._id
    });

    res.json({ message: 'Bid rejected' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { placeBid, getProjectBids, acceptBid, rejectBid };