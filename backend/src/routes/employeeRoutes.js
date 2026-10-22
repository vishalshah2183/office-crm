const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);
router.use(requireRole('ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'));

router.get('/', employeeController.getAllEmployees);
router.post('/', employeeController.createEmployee);
router.get('/:id', employeeController.getEmployeeById);
router.put('/:id', employeeController.updateEmployee);
router.patch('/:id/status', employeeController.toggleEmployeeStatus);
router.post('/:id/upad', employeeController.logUpadAdvance);

module.exports = router;
