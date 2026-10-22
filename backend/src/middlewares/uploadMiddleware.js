const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');
const { isValidDesignExtension, sanitizeFilename } = require('../utils/fileHelper');

// Configure storage destination & filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Temp upload dir, controller will move file to file-specific directory if needed
    const tempDir = path.resolve(__dirname, '../../', env.UPLOAD_DIR, 'tmp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const cleanName = sanitizeFilename(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${cleanName}`);
  }
});

// File extension filter (.dwg and .dxf only)
const fileFilter = (req, file, cb) => {
  if (isValidDesignExtension(file.originalname)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only AutoCAD (.dwg, .dxf) files are permitted.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB file size limit
  }
});

module.exports = upload;
