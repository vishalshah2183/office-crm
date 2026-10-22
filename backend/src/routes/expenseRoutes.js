const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

router.use(authMiddleware);

router.get('/', requirePermission('expenses', 'read'), expenseController.getExpenses);
router.post('/', requirePermission('expenses', 'write'), expenseController.createExpense);
router.put('/:id', requirePermission('expenses', 'write'), expenseController.updateExpense);
router.delete('/:id', requirePermission('expenses', 'delete'), expenseController.deleteExpense);

module.exports = router;
