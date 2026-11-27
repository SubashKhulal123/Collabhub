const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a project title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [5000, 'Description cannot be more than 5000 characters']
  },
  budget: {
    type: Number,
    required: [true, 'Please add a budget'],
    min: [1, 'Budget must be at least 1']
  },
  deadline: {
    type: Date,
    required: [true, 'Please add a deadline']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['Web Development', 'Mobile Development', 'UI/UX Design', 'Writing', 'Marketing', 'Data Science', 'Other']
  },
  skillsRequired: [{
    type: String,
    trim: true
  }],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'cancelled'],
    default: 'open'
  },
  bidsCount: {
    type: Number,
    default: 0
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for bids
projectSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

// Virtual for milestones
projectSchema.virtual('milestones', {
  ref: 'Milestone',
  localField: '_id',
  foreignField: 'project',
  justOne: false
});

module.exports = mongoose.model('Project', projectSchema);