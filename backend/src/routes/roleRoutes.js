const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', requirePermission('roles', 'read'), roleController.getAllRoles);
router.post('/', requirePermission('roles', 'write'), roleController.createRole);
router.put('/:id', requirePermission('roles', 'write'), roleController.updateRole);

module.exports = router;
