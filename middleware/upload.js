const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

const hasCloudinaryConfig =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

let storage;

if (hasCloudinaryConfig) {
  storage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder: 'spalux',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
      resource_type: 'auto'
    }
  });
} else {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });

  storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname) || '';
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });
}

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/jpg',
  'video/mp4',
  'video/quicktime'
]);

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
    cb(null, false);
  },
  limits: {
    fileSize: 20 * 1024 * 1024
  }
});

module.exports = upload;
