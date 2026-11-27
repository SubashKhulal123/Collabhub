const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'admin'],
    default: 'freelancer'
  },
  skills: [{
    type: String,
    trim: true
  }],
  portfolio: [{
    title: String,
    description: String,
    link: String,
    imageUrl: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bio: {
    type: String,
    maxlength: 500
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  completedProjects: {
    type: Number,
    default: 0
  },
  hourlyRate: {
    type: Number,
    default: 0
  },
  location: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  profilePicture: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isApproved: {
  type: Boolean,
  default: false 
},
approvedAt: Date,
approvedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
},
rejectionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationSentAt: Date,
  lastLoginAt: Date,
  lastLoginIp: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  twoFactorSecret: {
  type: mongoose.Schema.Types.Mixed,
  default: null
},
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
  // ADD THIS FIELD - verificationToken
  verificationToken: {
    type: String,
    default: null
  },

  verificationDocuments: [{
  type: {
    type: String,
    enum: ['id_card', 'passport', 'driving_license', 'address_proof'],
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  reviewedAt: Date,
  rejectionReason: String
}],
verificationStatus: {
  type: String,
  enum: ['unverified', 'pending', 'verified', 'rejected'],
  default: 'unverified'
},
verificationRequestedAt: Date,
verifiedAt: Date,
verifiedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: 'User'
}
}, {
  timestamps: true
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  const bcrypt = require('bcryptjs');
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);