const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectsByClient,
  getProjectsByFreelancer
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(getProjects)
  .post(protect, createProject);

router.get('/client/:clientId', protect, getProjectsByClient);
router.get('/freelancer/:freelancerId', protect, getProjectsByFreelancer);

router.route('/:id')
  .get(getProjectById)
  .put(protect, updateProject)
  .delete(protect, deleteProject);

module.exports = router;