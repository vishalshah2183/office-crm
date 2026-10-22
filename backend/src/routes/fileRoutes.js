const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const workflowController = require('../controllers/workflowController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// Files endpoints
router.get('/', requirePermission('files', 'read'), fileController.getFiles);
router.post('/', requirePermission('files', 'write'), fileController.createFile);
router.get('/:id', requirePermission('files', 'read'), fileController.getFileById);
router.put('/:id', requirePermission('files', 'write'), fileController.updateFile);
router.delete('/:id', requirePermission('files', 'delete'), fileController.deleteFile);

// Checklist workflow endpoints
router.get('/:id/workflow', requirePermission('files', 'read'), workflowController.getWorkflow);
router.patch('/:id/workflow/:taskId', requirePermission('files', 'write'), workflowController.updateTask);
router.post('/:id/workflow/:taskId/undo-completion', requirePermission('files', 'write'), workflowController.undoTaskCompletion);
router.post('/:id/workflow/:taskId/trigger', requirePermission('files', 'write'), workflowController.triggerTask);
router.post('/:id/workflow/:taskId/assign', requirePermission('files', 'write'), workflowController.assignTask);
router.post('/:id/workflow/bulk-complete', requirePermission('files', 'write'), workflowController.bulkCompleteTasks);
router.post('/:id/workflow/bulk-undo-complete', requirePermission('files', 'write'), workflowController.bulkUndoCompleteTasks);
router.post('/:id/workflow/bulk-assign', requirePermission('files', 'write'), workflowController.bulkAssignTasks);

module.exports = router;
