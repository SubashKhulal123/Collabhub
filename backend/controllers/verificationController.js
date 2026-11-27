const VerificationRequest = require('../models/VerificationRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');

const submitVerification = async (req, res) => {
  try {
    const { fullName, dateOfBirth, country, idType, idNumber } = req.body;
    
    // Convert file paths to URLs
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const documents = req.files ? req.files.map(file => {
      // Return URL path instead of local file path
      return `${baseUrl}/uploads/verification/${file.filename}`;
    }) : [];
    
    console.log('Documents URLs:', documents); // Debug log
    
    // Check if user already has pending request
    const existingRequest = await VerificationRequest.findOne({ 
      user: req.user._id, 
      status: 'pending' 
    });
    
    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending verification request' 
      });
    }
    
    // Check if user is already verified
    if (req.user.verificationStatus === 'verified') {
      return res.status(400).json({ 
        message: 'Your account is already verified' 
      });
    }
    
    const verificationRequest = await VerificationRequest.create({
      user: req.user._id,
      fullName,
      dateOfBirth: new Date(dateOfBirth),
      country,
      idType,
      idNumber,
      documents,  // Now stores URLs instead of file paths
      status: 'pending'
    });
    
    // Update user verification status
    await User.findByIdAndUpdate(req.user._id, {
      verificationStatus: 'pending',
      verificationRequestedAt: new Date()
    });
    
    // Notify admins
    const admins = await User.find({ role: 'admin' });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'verification_request',
        title: 'New Verification Request',
        message: `${req.user.name} has submitted a verification request`,
        relatedId: verificationRequest._id,
        relatedModel: 'VerificationRequest'
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Verification request submitted successfully. Please wait for admin approval.' 
    });
  } catch (error) {
    console.error('Submit verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get verification status (User)
const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('verificationStatus verificationRequestedAt verifiedAt isVerified');
    
    const pendingRequest = await VerificationRequest.findOne({ 
      user: req.user._id, 
      status: 'pending' 
    });
    
    res.json({
      status: user.verificationStatus,
      isVerified: user.isVerified,
      requestedAt: user.verificationRequestedAt,
      verifiedAt: user.verifiedAt,
      hasPendingRequest: !!pendingRequest
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all verification requests (Admin)
const getVerificationRequests = async (req, res) => {
  try {
    const requests = await VerificationRequest.find()
      .populate('user', 'email name role createdAt profilePicture')
      .sort('-createdAt');
    
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single verification request (Admin)
const getVerificationRequest = async (req, res) => {
  try {
    const request = await VerificationRequest.findById(req.params.id)
      .populate('user', 'name email profilePicture createdAt');
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve verification (Admin)
const approveVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const request = await VerificationRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Update request
    request.status = 'approved';
    request.adminNotes = adminNotes;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    
    // Update user
    await User.findByIdAndUpdate(request.user, {
      verificationStatus: 'verified',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: req.user._id
    });
    
    // Notify user
    await Notification.create({
      user: request.user,
      type: 'verification_approved',
      title: 'Verification Approved!',
      message: 'Your identity has been verified. You now have a verified badge on your profile.',
      relatedId: request._id,
      relatedModel: 'VerificationRequest'
    });
    
    res.json({ success: true, message: 'Verification approved successfully' });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Reject verification (Admin)
const rejectVerification = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }
    
    const request = await VerificationRequest.findById(id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Update request
    request.status = 'rejected';
    request.adminNotes = rejectionReason;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();
    
    // Update user
    await User.findByIdAndUpdate(request.user, {
      verificationStatus: 'rejected',
      isVerified: false
    });
    
    // Notify user
    await Notification.create({
      user: request.user,
      type: 'verification_rejected',
      title: 'Verification Rejected',
      message: `Your verification request was rejected. Reason: ${rejectionReason}`,
      relatedId: request._id,
      relatedModel: 'VerificationRequest'
    });
    
    res.json({ success: true, message: 'Verification rejected' });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitVerification,
  getVerificationStatus,
  getVerificationRequests,
  getVerificationRequest,
  approveVerification,
  rejectVerification
};