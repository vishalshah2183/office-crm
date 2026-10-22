const express = require('express');
const router = express.Router({ mergeParams: true });
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

// File-nested routes: GET/POST /api/files/:fileId/payments
router.get('/', requirePermission('files', 'read'), paymentController.getPaymentsByFile);
router.post('/', requirePermission('files', 'write'), paymentController.createPayment);
router.put('/:id', requirePermission('files', 'write'), paymentController.updatePayment);

module.exports = router;
