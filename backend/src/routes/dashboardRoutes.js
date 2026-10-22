const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');
const workflowController = require('../controllers/workflowController');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/summary', requirePermission('dashboard', 'read'), dashboardController.getSummary);
router.get('/my-tasks', requirePermission('dashboard', 'read'), workflowController.getMyTasks);

module.exports = router;
