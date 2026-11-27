const Project = require('../models/Project');
const Bid = require('../models/Bid');
const Notification = require('../models/Notification');

// @desc    Create project
// @route   POST /api/projects
// @access  Private (Client only)
const createProject = async (req, res) => {
  try {
    if (req.user.role !== 'client') {
      return res.status(403).json({ message: 'Only clients can create projects' });
    }

    const { title, description, budget, deadline, category, skillsRequired } = req.body;

    const project = await Project.create({
      title,
      description,
      budget,
      deadline,
      category,
      skillsRequired: skillsRequired || [],
      client: req.user._id
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects (with filters)
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      minBudget, 
      maxBudget,
      search,
      page = 1,
      limit = 10 
    } = req.query;

    let query = {};

    // Filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (minBudget) query.budget = { $gte: parseInt(minBudget) };
    if (maxBudget) query.budget = { ...query.budget, $lte: parseInt(maxBudget) };
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const projects = await Project.find(query)
      .populate('client', 'name email rating profilePicture')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Project.countDocuments(query);

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('client', 'name email rating profilePicture')
      .populate('assignedTo', 'name email rating skills profilePicture');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get bids for this project
    const bids = await Bid.find({ project: project._id, status: 'pending' })
      .populate('freelancer', 'name email rating skills profilePicture')
      .sort('-createdAt');

    res.json({ project, bids });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Client who created it)
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Client who created it or admin)
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.client.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await project.remove();
    res.json({ message: 'Project removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get projects by client
// @route   GET /api/projects/client/:clientId
// @access  Private
const getProjectsByClient = async (req, res) => {
  try {
    const projects = await Project.find({ client: req.params.clientId })
      .populate('assignedTo', 'name email rating')
      .sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get projects assigned to freelancer
// @route   GET /api/projects/freelancer/:freelancerId
// @access  Private
const getProjectsByFreelancer = async (req, res) => {
  try {
    const projects = await Project.find({ assignedTo: req.params.freelancerId })
      .populate('client', 'name email rating')
      .sort('-createdAt');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByClient,
  getProjectsByFreelancer
};