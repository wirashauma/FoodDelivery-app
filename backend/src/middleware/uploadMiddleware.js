// file: backend/src/middleware/uploadMiddleware.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist (for fallback local storage)
const uploadDirs = ['uploads', 'uploads/products', 'uploads/restaurants', 'uploads/documents'];
uploadDirs.forEach(dir => {
  const fullPath = path.join(__dirname, '../../', dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Memory storage configuration (for Supabase upload)
const memoryStorage = multer.memoryStorage();

// Disk storage configuration (fallback)
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.baseUrl.includes('products') ? 'products' : 
                 req.baseUrl.includes('restaurants') ? 'restaurants' : 'documents';
    const uploadPath = path.join(__dirname, '../../uploads', type);
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'), false);
  }
};

// Multer configuration with memory storage (preferred for Supabase)
const upload = multer({
  storage: memoryStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Multer configuration with disk storage (fallback)
const uploadDisk = multer({
  storage: diskStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

module.exports = { upload, uploadDisk };
