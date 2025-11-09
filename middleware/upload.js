const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|mov|avi|wmv|flv|webm/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;
  
  if (file.fieldname === 'images') {
    const isImage = allowedImageTypes.test(extname) && mimetype.startsWith('image/');
    if (isImage) {
      return cb(null, true);
    } else {
      return cb(new Error('Only image files are allowed for images field'));
    }
  }
  
  if (file.fieldname === 'videos') {
    const isVideo = allowedVideoTypes.test(extname) && mimetype.startsWith('video/');
    if (isVideo) {
      return cb(null, true);
    } else {
      return cb(new Error('Only video files are allowed for videos field'));
    }
  }
  
  cb(new Error('Invalid field name'));
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB max file size
  },
  fileFilter: fileFilter
});

// Export upload configurations
module.exports = {
  uploadFields: upload.fields([
    { name: 'images', maxCount: 10 },
    { name: 'videos', maxCount: 2 }
  ]),
  uploadSingle: upload.single('file')
};
