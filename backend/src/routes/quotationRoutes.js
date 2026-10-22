const express = require('express');
const router = express.Router();
const quotationController = require('../controllers/quotationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// Standalone quotation routes
router.put('/:id', quotationController.updateQuotation);
router.post('/:id/finalize', quotationController.finalizeQuotation);

module.exports = router;
