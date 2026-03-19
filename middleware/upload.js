const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use memory storage on Vercel (no filesystem), disk storage locally
const isVercel = !!process.env.VERCEL;

let storage;
if (isVercel) {
  storage = multer.memoryStorage();
} else {
  // Ensure uploads dir exists locally
  if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (mimetype && extname) return cb(null, true);
  cb(new Error('Only images and videos are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter
});

module.exports = upload;
