const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: [true, 'Please add bid amount'],
    min: [1, 'Amount must be at least 1']
  },
  estimatedDays: {
    type: Number,
    required: [true, 'Please add estimated days'],
    min: [1, 'Must be at least 1 day']
  },
  proposal: {
    type: String,
    required: [true, 'Please add a proposal'],
    maxlength: [2000, 'Proposal cannot be more than 2000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending'
  },
  coverLetter: {
    type: String,
    maxlength: [1000, 'Cover letter too long']
  },
  attachments: [{
    filename: String,
    url: String
  }]
}, {
  timestamps: true
});

// Ensure one freelancer can't bid twice on same project
bidSchema.index({ project: 1, freelancer: 1 }, { unique: true });

module.exports = mongoose.model('Bid', bidSchema);