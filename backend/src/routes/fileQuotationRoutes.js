const express = require('express');
const router = express.Router({ mergeParams: true });
const quotationController = require('../controllers/quotationController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

// File-nested quotation routes
router.get('/', quotationController.getQuotationsByFile);
router.post('/', quotationController.createQuotation);

module.exports = router;
