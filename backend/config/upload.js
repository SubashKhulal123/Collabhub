const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const profileUploadDir = path.join(__dirname, '../uploads/profiles');
const portfolioUploadDir = path.join(__dirname, '../uploads/portfolio');
const verificationUploadDir = path.join(__dirname, '../uploads/verification');

if (!fs.existsSync(profileUploadDir)) {
  fs.mkdirSync(profileUploadDir, { recursive: true });
}
if (!fs.existsSync(portfolioUploadDir)) {
  fs.mkdirSync(portfolioUploadDir, { recursive: true });
}
if (!fs.existsSync(verificationUploadDir)) {
  fs.mkdirSync(verificationUploadDir, { recursive: true });
}

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

// Profile storage
const profileStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, profileUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Portfolio storage
const portfolioStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, portfolioUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'portfolio-' + uniqueSuffix + ext);
  }
});

// Verification storage
const verificationStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, verificationUploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'verification-' + uniqueSuffix + ext);
  }
});

// Create separate upload handlers
const upload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const uploadPortfolio = multer({
  storage: portfolioStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

const uploadVerification = multer({
  storage: verificationStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

module.exports = { upload, uploadPortfolio, uploadVerification };