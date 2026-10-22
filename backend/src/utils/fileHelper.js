const path = require('path');

const sanitizeFilename = (filename) => {
  // Remove dangerous path traversal and special characters
  return path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, '_');
};

const isValidDesignExtension = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  return ['.dwg', '.dxf'].includes(ext);
};

module.exports = {
  sanitizeFilename,
  isValidDesignExtension
};
