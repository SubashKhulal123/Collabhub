const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const VerificationToken = require('../models/VerificationToken');
const RefreshToken = require('../models/RefreshToken');
const Notification = require('../models/Notification');
const LoginAttempt = require('../models/LoginAttempt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/emailService');
const { generateRandomToken, generateTwoFactorSecret, generateQRCode, verifyTwoFactorToken } = require('../utils/authUtils');
const crypto = require('crypto'); 
const speakeasy = require('speakeasy');
// Generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// Generate regular token for admin creation (non-refresh)
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Generate refresh token
const generateRefreshToken = async (userId, deviceInfo, ipAddress) => {
  const token = generateRandomToken();
  const refreshToken = new RefreshToken({
    user: userId,
    token,
    deviceInfo,
    ipAddress,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  });
  await refreshToken.save();
  return token;
};

// Check login attempts
const checkLoginAttempts = async (email, ipAddress) => {
  const attempts = await LoginAttempt.countDocuments({
    email,
    ipAddress,
    success: false,
    createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) } // Last 15 minutes
  });
  return attempts < 5;
};



const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // For clients: auto-approve, For freelancers: pending approval
    const isApproved = role === 'client' ? true : false;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'freelancer',
      isEmailVerified: false,
      isApproved: isApproved,
      isActive: true
    });

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    
    await VerificationToken.create({
      user: user._id,
      token: verificationToken,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // If freelancer, notify admins
    if (role === 'freelancer') {
      const admins = await User.find({ role: 'admin' });
      for (const admin of admins) {
        await Notification.create({
          user: admin._id,
          type: 'freelancer_approval_needed',
          title: 'New Freelancer Needs Approval',
          message: `${name} has registered as a freelancer and needs admin approval.`,
          relatedId: user._id,
          relatedModel: 'User'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: role === 'freelancer' 
        ? 'Registration successful! Please verify your email. After verification, an admin will approve your account before you can login.'
        : 'Registration successful! Please check your email to verify your account.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: error.message });
  }
};

// // Register user (with email verification) - FIXED
// const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: role || 'freelancer',
//       isEmailVerified: false,
//       isActive: true
//     });

//     // Generate verification token
//     const verificationToken = crypto.randomBytes(32).toString('hex');
    
//     // SAVE THE TOKEN - Make sure this is being saved
//     const savedToken = await VerificationToken.create({
//       user: user._id,
//       token: verificationToken,
//       type: 'email_verification',
//       expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
//     });

//     console.log('✅ Verification token saved:', savedToken.token);
//     console.log('Token expires at:', savedToken.expiresAt);

//     // Send verification email
//     const emailSent = await sendVerificationEmail(email, verificationToken);
    
//     if (!emailSent) {
//       console.error('Failed to send verification email');
//     }

//     res.status(201).json({
//       success: true,
//       message: 'Registration successful! Please check your email to verify your account.',
//       user: {
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role
//       }
//     });
//   } catch (error) {
//     console.error('Register error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log('🔍 Verifying token:', token);
    
    // Find the verification token
    const verificationToken = await VerificationToken.findOne({ 
      token: token,
      type: 'email_verification'
    }).populate('user');

    // Case: Token not found
    if (!verificationToken) {
      console.log('❌ Token not found');
      // Check if there's a user with this email that is already verified
      // For the second request scenario
      return res.status(200).json({ 
        success: false,
        status: 'invalid',
        message: 'Invalid verification link'
      });
    }

    // Case: Already verified
    if (verificationToken.user.isEmailVerified) {
      console.log('⚠️ User already verified');
      return res.status(200).json({ 
        success: true, 
        status: 'already_verified',
        message: 'Email already verified! You can now login.'
      });
    }

    // Case: Expired
    if (verificationToken.expiresAt < new Date()) {
      console.log('❌ Token expired');
      await VerificationToken.deleteOne({ _id: verificationToken._id });
      return res.status(200).json({ 
        success: false,
        status: 'expired',
        message: 'Verification link has expired. Please register again.'
      });
    }

    // Success - Verify the user
    console.log('✅ Verifying user:', verificationToken.user.email);
    
    await User.findByIdAndUpdate(verificationToken.user._id, { 
      isEmailVerified: true 
    });
    
    // DON'T DELETE THE TOKEN - let it expire naturally
    // This way the second request will find it and show "already verified"
    // await VerificationToken.deleteOne({ _id: verificationToken._id });

    console.log('✅ User verified successfully!');

    return res.status(200).json({ 
      success: true, 
      status: 'success',
      message: 'Email verified successfully! You can now login.'
    });
    
  } catch (error) {
    console.error('❌ Verify email error:', error);
    return res.status(500).json({ 
      success: false,
      status: 'error',
      message: 'Something went wrong. Please try again.'
    });
  }
};

// Login user (WITH email verification check)
const loginUser = async (req, res) => {
  try {
    const { email, password, twoFactorToken } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const deviceInfo = req.headers['user-agent'];

    const canAttempt = await checkLoginAttempts(email, ipAddress);
    if (!canAttempt) {
      return res.status(429).json({ 
        message: 'Too many failed attempts. Please try again later.' 
      });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      await LoginAttempt.create({ email, ipAddress, success: false });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(423).json({ 
        message: 'Account is temporarily locked. Please try again later.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await LoginAttempt.create({ email, ipAddress, success: false });
      
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      }
      await user.save();
      
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // CHECK IF EMAIL IS VERIFIED (KEEP THIS)
    if (!user.isEmailVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email before logging in. Check your inbox for the verification link.' 
      });
    }

    // CHECK ADMIN APPROVAL FOR FREELANCERS
if (user.role === 'freelancer' && !user.isApproved) {
  return res.status(401).json({ 
    success: false,
    message: 'Your account is pending admin approval. You will be notified once approved.',
    needsApproval: true
  });
}

 // In loginUser function, update the 2FA verification part:
if (user.twoFactorEnabled) {
  if (!twoFactorToken) {
    return res.status(200).json({ 
      requiresTwoFactor: true,
      message: '2FA token required' 
    });
  }
  
  const isValid = speakeasy.totp.verify({
    secret: user.twoFactorSecret,
    encoding: 'base32',
    token: twoFactorToken,
    window: 2
  });
  
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid 2FA token' });
  }
}

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await user.save();

    await LoginAttempt.create({ email, ipAddress, success: true });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = await generateRefreshToken(user._id, deviceInfo, ipAddress);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isEmailVerified: user.isEmailVerified,
        twoFactorEnabled: user.twoFactorEnabled
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    const tokenDoc = await RefreshToken.findOne({ 
      token: refreshToken, 
      revoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!tokenDoc) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(tokenDoc.user._id);
    
    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.findOneAndUpdate(
        { token: refreshToken },
        { revoked: true }
      );
    }
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ 
        success: true, 
        message: 'If an account exists, a reset link has been sent.' 
      });
    }

    const resetToken = generateRandomToken();
    await VerificationToken.create({
      user: user._id,
      token: resetToken,
      type: 'password_reset',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    });

    await sendPasswordResetEmail(email, resetToken);

    res.json({ 
      success: true, 
      message: 'If an account exists, a reset link has been sent.' 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    
    const resetToken = await VerificationToken.findOne({ 
      token, 
      type: 'password_reset',
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!resetToken) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(resetToken.user._id, { password: hashedPassword });
    await VerificationToken.deleteOne({ _id: resetToken._id });
    await RefreshToken.deleteMany({ user: resetToken.user._id });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// // Enable 2FA
// const enableTwoFactor = async (req, res) => {
//   try {
//     const secret = generateTwoFactorSecret(req.user.email);
//     const qrCode = await generateQRCode(secret);
    
//     await User.findByIdAndUpdate(req.user._id, {
//       twoFactorSecret: secret,
//       twoFactorEnabled: false
//     });

//     res.json({ 
//       success: true, 
//       secret: secret.base32,
//       qrCode,
//       message: 'Scan QR code with Google Authenticator' 
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Verify and enable 2FA
// const verifyTwoFactor = async (req, res) => {
//   try {
//     const { token } = req.body;
//     const user = await User.findById(req.user._id);
    
//     const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
    
//     if (!isValid) {
//       return res.status(400).json({ message: 'Invalid 2FA token' });
//     }
    
//     user.twoFactorEnabled = true;
//     await user.save();
    
//     res.json({ success: true, message: '2FA enabled successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // Disable 2FA
// const disableTwoFactor = async (req, res) => {
//   try {
//     const { token } = req.body;
//     const user = await User.findById(req.user._id);
    
//     const isValid = verifyTwoFactorToken(user.twoFactorSecret, token);
    
//     if (!isValid) {
//       return res.status(400).json({ message: 'Invalid 2FA token' });
//     }
    
//     user.twoFactorEnabled = false;
//     user.twoFactorSecret = undefined;
//     await user.save();
    
//     res.json({ success: true, message: '2FA disabled successfully' });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// Enable 2FA - Generate secret and QR code
const enableTwoFactor = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }
    
    // Generate secret using speakeasy directly
    const secret = speakeasy.generateSecret({
      name: `CollabHub (${user.email})`,
      length: 20
    });
    
    // Generate QR code
    const QRCode = require('qrcode');
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    // Store the base32 secret
    user.twoFactorSecret = secret.base32;
    await user.save();
    
    res.json({ 
      success: true, 
      secret: secret.base32,
      qrCode,
      message: 'Scan QR code with Google Authenticator' 
    });
  } catch (error) {
    console.error('Enable 2FA error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Verify and enable 2FA
const verifyTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorSecret) {
      return res.status(400).json({ message: 'No 2FA setup in progress' });
    }
    
    // Verify using speakeasy
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }
    
    user.twoFactorEnabled = true;
    await user.save();
    
    res.json({ success: true, message: '2FA enabled successfully' });
  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Disable 2FA
const disableTwoFactor = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (!user.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }
    
    // Verify token before disabling
    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token: token,
      window: 2
    });
    
    if (!isValid) {
      return res.status(400).json({ message: 'Invalid 2FA token' });
    }
    
    user.twoFactorEnabled = false;
    user.twoFactorSecret = null;
    await user.save();
    
    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Create admin
const createAdmin = async (req, res) => {
  try {
    const { name, email, password, secretKey } = req.body;
    
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "CollabHubAdmin2024!";
    
    if (secretKey !== ADMIN_SECRET_KEY) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized. Invalid secret key.' 
      });
    }
    
    const adminExists = await User.findOne({ email });
    if (adminExists) {
      return res.status(400).json({ 
        success: false,
        message: 'Admin already exists with this email' 
      });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });
    
    const token = generateToken(admin._id);
    
    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      user: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      },
      token: token
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ 
      success: false,
      message: error.message 
    });
  }
};

// Get current user
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -twoFactorSecret');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  verifyEmail,
  loginUser,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  enableTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  createAdmin,
  getMe
};