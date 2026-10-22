const bcrypt = require('bcryptjs');
const { Employee, Role } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.findAll({
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description']
        }
      ],
      order: [['id', 'ASC']]
    });
    return successResponse(res, 200, { employees });
  } catch (error) {
    next(error);
  }
};

const createEmployee = async (req, res, next) => {
  try {
    const { name, email, password, mobile, designation, role_id, monthly_salary, upad_balance } = req.body;

    if (!name || !mobile || !password || !role_id) {
      return errorResponse(res, 400, 'Name, mobile number, password, and role_id are required fields');
    }

    const existingMobile = await Employee.findOne({ where: { mobile } });
    if (existingMobile) {
      return errorResponse(res, 400, 'An employee with this mobile number already exists');
    }

    if (email) {
      const existingEmail = await Employee.findOne({ where: { email } });
      if (existingEmail) {
        return errorResponse(res, 400, 'An employee with this email address already exists');
      }
    }

    const role = await Role.findByPk(role_id);
    if (!role) {
      return errorResponse(res, 400, 'Invalid role_id specified');
    }

    const password_hash = await bcrypt.hash(password, 10);

    const newEmployee = await Employee.create({
      name,
      mobile,
      email: email || null,
      password_hash,
      designation: designation || null,
      role_id,
      is_active: true,
      monthly_salary: monthly_salary !== undefined ? parseFloat(monthly_salary) : 0,
      upad_balance: upad_balance !== undefined ? parseFloat(upad_balance) : 0
    });

    const created = await Employee.findByPk(newEmployee.id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }]
    });

    return successResponse(res, 201, { employee: created }, 'Employee record created successfully');
  } catch (error) {
    next(error);
  }
};

const getEmployeeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description'] }]
    });

    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    return successResponse(res, 200, { employee });
  } catch (error) {
    next(error);
  }
};

const updateEmployee = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, password, mobile, designation, role_id, monthly_salary, upad_balance } = req.body;

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    if (email && email !== employee.email) {
      const existingEmail = await Employee.findOne({ where: { email } });
      if (existingEmail) {
        return errorResponse(res, 400, 'Email address is already in use by another employee');
      }
      employee.email = email;
    }

    if (role_id) {
      const role = await Role.findByPk(role_id);
      if (!role) {
        return errorResponse(res, 400, 'Invalid role_id specified');
      }
      employee.role_id = role_id;
    }

    if (name) employee.name = name;
    if (mobile !== undefined) employee.mobile = mobile;
    if (designation !== undefined) employee.designation = designation;
    if (monthly_salary !== undefined) employee.monthly_salary = parseFloat(monthly_salary);
    if (upad_balance !== undefined) employee.upad_balance = parseFloat(upad_balance);

    if (password) {
      employee.password_hash = await bcrypt.hash(password, 10);
    }

    await employee.save();

    const updated = await Employee.findByPk(employee.id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name'] }]
    });

    return successResponse(res, 200, { employee: updated }, 'Employee updated successfully');
  } catch (error) {
    next(error);
  }
};

const toggleEmployeeStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return errorResponse(res, 400, 'is_active field must be a boolean');
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    employee.is_active = is_active;
    await employee.save();

    return successResponse(
      res,
      200,
      { employee },
      `Employee account ${is_active ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

const logUpadAdvance = async (req, res, next) => {
  const { sequelize } = require('../models');
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { amount, expense_date, notes } = req.body;

    if (!amount || parseFloat(amount) <= 0) {
      await transaction.rollback();
      return errorResponse(res, 400, 'Amount must be a positive number');
    }

    const employee = await Employee.findByPk(id);
    if (!employee) {
      await transaction.rollback();
      return errorResponse(res, 404, 'Employee record not found');
    }

    const upadAmount = parseFloat(amount);
    const currentUpad = parseFloat(employee.upad_balance || 0);
    employee.upad_balance = currentUpad + upadAmount;
    await employee.save({ transaction });

    const { Expense } = require('../models');
    await Expense.create({
      category: 'UPAD',
      amount: upadAmount,
      expense_date: expense_date || new Date().toISOString().split('T')[0],
      description: `UPAD (Advance Salary) for ${employee.name}${notes ? ` - ${notes}` : ''}`,
      employee_id: employee.id,
      created_by: req.user.id
    }, { transaction });

    await transaction.commit();

    return successResponse(res, 200, { employee }, `Logged UPAD advance of ₹${upadAmount} for ${employee.name}`);
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
};

module.exports = {
  getAllEmployees,
  createEmployee,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  logUpadAdvance
};
