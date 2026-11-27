const mongoose = require('mongoose');

const verificationRequestSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  dateOfBirth: Date,
  country: String,
  idType: {
    type: String,
    enum: ['id_card', 'passport', 'driving_license'],
    required: true
  },
  idNumber: String,
  documents: [{
    type: String,
    required: true
  }],
  selfieUrl: String,
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminNotes: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('VerificationRequest', verificationRequestSchema);