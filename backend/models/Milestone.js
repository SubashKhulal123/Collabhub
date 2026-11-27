const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add milestone title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add milestone description']
  },
  amount: {
    type: Number,
    required: [true, 'Please add milestone amount'],
    min: [1, 'Amount must be at least 1']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please add due date']
  },
  status: {
    type: String,
    enum: ['pending', 'submitted', 'approved', 'rejected'],
    default: 'pending'
  },
  submission: {
    files: [{
      filename: String,
      url: String
    }],
    notes: String,
    submittedAt: Date
  },
  feedback: {
    type: String,
    maxlength: 500
  },
  approvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Milestone', milestoneSchema);