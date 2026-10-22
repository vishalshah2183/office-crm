const express = require('express');
const router = express.Router({ mergeParams: true });
const designFileController = require('../controllers/designFileController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// File-nested routes: GET/POST /api/files/:fileId/design-files
router.get('/files/:fileId/design-files', requirePermission('files', 'read'), designFileController.getDesignFilesByFile);
router.post('/files/:fileId/design-files', requirePermission('files', 'write'), upload.single('designFile'), designFileController.uploadDesignFile);

// Standalone design file routes
router.get('/design-files/:id', requirePermission('files', 'read'), designFileController.downloadDesignFile);
router.delete('/design-files/:id', requirePermission('files', 'delete'), designFileController.deleteDesignFile);

module.exports = router;
