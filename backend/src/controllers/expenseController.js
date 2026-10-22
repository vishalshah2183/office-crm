const { Op } = require('sequelize');
const { Expense, Employee } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const ALLOWED_CATEGORIES = ['SALARY', 'UPAD', 'OFFICE', 'PRINTING', 'TRAVEL', 'UTILITIES', 'HARDWARE', 'SITE_VISIT', 'OTHER'];

const getExpenses = async (req, res, next) => {
  try {
    const { category, employeeId, startDate, endDate, search, minAmount, maxAmount, page = 1, limit = 20 } = req.query;

    const whereClause = {};

    // Role-based visibility: Non-admin staff can only view expenses added by themselves
    const { Role } = require('../models');
    const employee = await Employee.findByPk(req.user.id, { include: [{ model: Role, as: 'role' }] });
    const userDesignation = (employee?.designation || '').toLowerCase();
    const roleName = (employee?.role?.name || '').toLowerCase();
    const isAdminOrOwner = roleName === 'admin' || userDesignation === 'admin' || userDesignation === 'owner';

    if (!isAdminOrOwner) {
      whereClause.created_by = req.user.id;
    }

    if (category) {
      const upperCat = category.toUpperCase();
      if (ALLOWED_CATEGORIES.includes(upperCat)) {
        whereClause.category = upperCat;
      }
    }

    if (employeeId) {
      const selectedEmployeeId = parseInt(employeeId, 10);
      whereClause.employee_id = selectedEmployeeId;
    }

    if (startDate && endDate) {
      whereClause.expense_date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.expense_date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.expense_date = {
        [Op.lte]: endDate
      };
    }

    if (search && search.trim()) {
      whereClause.description = {
        [Op.like]: `%${search.trim()}%`
      };
    }

    if (minAmount !== undefined && minAmount !== '' && maxAmount !== undefined && maxAmount !== '') {
      whereClause.amount = {
        [Op.between]: [parseFloat(minAmount), parseFloat(maxAmount)]
      };
    } else if (minAmount !== undefined && minAmount !== '') {
      whereClause.amount = {
        [Op.gte]: parseFloat(minAmount)
      };
    } else if (maxAmount !== undefined && maxAmount !== '') {
      whereClause.amount = {
        [Op.lte]: parseFloat(maxAmount)
      };
    }

    const parsedPage = parseInt(page, 10) || 1;
    const parsedLimit = limit === 'all' ? 1000 : (parseInt(limit, 10) || 20);
    const offset = (parsedPage - 1) * parsedLimit;

    const { count, rows } = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        { model: Employee, as: 'creator', attributes: ['id', 'name', 'email'] },
        { model: Employee, as: 'employee', attributes: ['id', 'name'] }
      ],
      order: [['expense_date', 'DESC'], ['id', 'DESC']],
      limit: parsedLimit,
      offset: offset
    });

    const totalExpenseAmount = await Expense.sum('amount', { where: whereClause }) || 0;

    // Aggregate category totals for visual breakdown
    const categoryTotalsRaw = await Expense.findAll({
      where: whereClause,
      attributes: [
        'category',
        [require('sequelize').fn('SUM', require('sequelize').col('amount')), 'total'],
        [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    const categoryBreakdown = categoryTotalsRaw.map(item => ({
      category: item.category,
      total: parseFloat(item.total || 0),
      count: parseInt(item.count || 0, 10)
    }));

    return successResponse(res, 200, {
      totalItems: count,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      totalExpenseAmount: parseFloat(totalExpenseAmount),
      categoryBreakdown,
      expenses: rows
    });
  } catch (error) {
    next(error);
  }
};

const createExpense = async (req, res, next) => {
  try {
    const { category, amount, expense_date, description, employee_id } = req.body;

    if (!category || !amount || !expense_date) {
      return errorResponse(res, 400, 'category, amount, and expense_date are required fields');
    }

    const upperCategory = category.toUpperCase();
    if (!ALLOWED_CATEGORIES.includes(upperCategory)) {
      return errorResponse(res, 400, `Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}`);
    }

    if (parseFloat(amount) <= 0) {
      return errorResponse(res, 400, 'Amount must be a positive number');
    }

    if (['SALARY', 'UPAD'].includes(upperCategory) && !employee_id) {
      return errorResponse(res, 400, 'An employee is required for salary or UPAD records');
    }

    if (employee_id !== undefined && employee_id !== null) {
      const employee = await Employee.findByPk(employee_id);
      if (!employee) return errorResponse(res, 400, 'Invalid employee_id specified');
    }

    const expense = await Expense.create({
      category: upperCategory,
      amount: parseFloat(amount),
      expense_date,
      description: description || null,
      employee_id: employee_id || null,
      created_by: req.user.id
    });

    const created = await Expense.findByPk(expense.id, {
      include: [
        { model: Employee, as: 'creator', attributes: ['id', 'name'] },
        { model: Employee, as: 'employee', attributes: ['id', 'name'] }
      ]
    });

    return successResponse(res, 201, { expense: created }, 'Expense recorded successfully');
  } catch (error) {
    next(error);
  }
};

const updateExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { category, amount, expense_date, description, employee_id } = req.body;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return errorResponse(res, 404, 'Expense record not found');
    }

    if (category) {
      const upperCategory = category.toUpperCase();
      if (!ALLOWED_CATEGORIES.includes(upperCategory)) {
        return errorResponse(res, 400, `Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}`);
      }
      expense.category = upperCategory;
    }

    const nextCategory = expense.category;
    const nextEmployeeId = employee_id !== undefined ? employee_id : expense.employee_id;
    if (['SALARY', 'UPAD'].includes(nextCategory) && !nextEmployeeId) {
      return errorResponse(res, 400, 'An employee is required for salary or UPAD records');
    }

    if (amount !== undefined) {
      if (parseFloat(amount) <= 0) {
        return errorResponse(res, 400, 'Amount must be a positive number');
      }
      expense.amount = parseFloat(amount);
    }

    if (expense_date) expense.expense_date = expense_date;
    if (description !== undefined) expense.description = description;
    if (employee_id !== undefined) {
      if (employee_id !== null) {
        const employee = await Employee.findByPk(employee_id);
        if (!employee) return errorResponse(res, 400, 'Invalid employee_id specified');
      }
      expense.employee_id = employee_id || null;
    }

    await expense.save();

    return successResponse(res, 200, { expense }, 'Expense updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);
    if (!expense) {
      return errorResponse(res, 404, 'Expense record not found');
    }

    await expense.destroy();
    return successResponse(res, 200, {}, 'Expense deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense
};
