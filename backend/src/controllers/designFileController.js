const path = require('path');
const fs = require('fs');
const { DesignFile, File, Employee } = require('../models');
const env = require('../config/env');
const { sanitizeFilename, isValidDesignExtension } = require('../utils/fileHelper');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getDesignFilesByFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const file = await File.findByPk(fileId);
    if (!file) {
      return errorResponse(res, 404, 'File not found');
    }

    const designFiles = await DesignFile.findAll({
      where: { file_id: fileId },
      include: [{ model: Employee, as: 'uploader', attributes: ['id', 'name', 'email'] }],
      order: [['version', 'DESC']]
    });

    return successResponse(res, 200, { designFiles });
  } catch (error) {
    next(error);
  }
};

const uploadDesignFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;

    if (!req.file) {
      return errorResponse(res, 400, 'No file uploaded or file extension rejected. Only .dwg and .dxf files are permitted');
    }

    const workFile = await File.findByPk(fileId);
    if (!workFile) {
      // Remove temp uploaded file if file entity does not exist
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return errorResponse(res, 404, 'Work file record not found');
    }

    // Determine current version number for this file_id
    const maxVersion = await DesignFile.max('version', { where: { file_id: fileId } }) || 0;
    const newVersion = maxVersion + 1;

    // Build directory: uploads/designs/FILE-{file_number}/
    const fileFolder = `FILE-${workFile.file_number.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
    const targetDir = path.resolve(__dirname, '../../', env.UPLOAD_DIR, fileFolder);

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const cleanOriginalName = sanitizeFilename(req.file.originalname);
    const targetFileName = `v${newVersion}-${cleanOriginalName}`;
    const finalFilePath = path.join(targetDir, targetFileName);

    // Move file from temp to final destination
    fs.renameSync(req.file.path, finalFilePath);

    // Store relative path in database
    const relativePath = path.relative(path.resolve(__dirname, '../../'), finalFilePath).replace(/\\/g, '/');

    const designFile = await DesignFile.create({
      file_id: parseInt(fileId, 10),
      file_name: req.file.originalname,
      file_path: relativePath,
      version: newVersion,
      uploaded_by: req.user.id
    });

    const created = await DesignFile.findByPk(designFile.id, {
      include: [{ model: Employee, as: 'uploader', attributes: ['id', 'name'] }]
    });

    return successResponse(res, 201, { designFile: created }, 'Design file uploaded successfully');
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

const downloadDesignFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const designFile = await DesignFile.findByPk(id);
    if (!designFile) {
      return errorResponse(res, 404, 'Design file not found');
    }

    const absolutePath = path.resolve(__dirname, '../../', designFile.file_path);

    // Prevent path traversal attack
    const baseUploadPath = path.resolve(__dirname, '../../', env.UPLOAD_DIR);
    if (!absolutePath.startsWith(baseUploadPath)) {
      return errorResponse(res, 403, 'Invalid file access path');
    }

    if (!fs.existsSync(absolutePath)) {
      return errorResponse(res, 404, 'File not found on disk storage');
    }

    return res.download(absolutePath, designFile.file_name);
  } catch (error) {
    next(error);
  }
};

const deleteDesignFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const designFile = await DesignFile.findByPk(id);
    if (!designFile) {
      return errorResponse(res, 404, 'Design file not found');
    }

    const absolutePath = path.resolve(__dirname, '../../', designFile.file_path);

    // Delete physical file if exists
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await designFile.destroy();

    return successResponse(res, 200, {}, 'Design file record and file deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDesignFilesByFile,
  uploadDesignFile,
  downloadDesignFile,
  deleteDesignFile
};
