const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const env = require('../config/env');
const { Employee, Role } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const login = async (req, res, next) => {
  try {
    const { mobile, email, identifier, password } = req.body;
    const userIdentifier = mobile || email || identifier;

    if (!userIdentifier || !password) {
      return errorResponse(res, 400, 'Mobile number (or email) and password are required');
    }

    const employee = await Employee.scope('withPassword').findOne({
      where: {
        [Op.or]: [
          { mobile: userIdentifier },
          { email: userIdentifier }
        ]
      },
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description', 'permissions']
        }
      ]
    });

    if (!employee) {
      return errorResponse(res, 401, 'Invalid mobile number/email or password');
    }

    if (!employee.is_active) {
      return errorResponse(res, 403, 'Account is inactive. Please contact system administrator');
    }

    const isMatch = await bcrypt.compare(password, employee.password_hash);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid mobile number/email or password');
    }

    // Generate JWT Token
    const token = jwt.sign(
      { id: employee.id, mobile: employee.mobile, email: employee.email, role_id: employee.role_id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Set HTTP-only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    const userObj = employee.toJSON();
    delete userObj.password_hash;

    return successResponse(res, 200, {
      employee: userObj,
      token
    }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    res.clearCookie('token');
    return successResponse(res, 200, {}, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    return successResponse(res, 200, { employee: req.user });
  } catch (error) {
    next(error);
  }
};

const signup = async (req, res, next) => {
  try {
    const { name, mobile, email, password } = req.body;

    if (!name || !mobile || !password) {
      return errorResponse(res, 400, 'Full name, mobile number, and password are required');
    }

    // Check if employee exists by mobile
    const existingMobile = await Employee.findOne({ where: { mobile } });
    if (existingMobile) {
      return errorResponse(res, 400, 'An account with this mobile number already exists');
    }

    // Check if employee exists by email (if email is provided)
    if (email) {
      const existingEmail = await Employee.findOne({ where: { email } });
      if (existingEmail) {
        return errorResponse(res, 400, 'An account with this email address already exists');
      }
    }

    // Auto-assign the default employee/user role (case-insensitive lookup or fallback to role_id 2 or first role)
    let userRole = await Role.findOne({
      where: {
        name: { [Op.like]: '%EMPLOYEE%' }
      }
    });

    if (!userRole) {
      userRole = await Role.findOne({
        where: {
          name: { [Op.notLike]: '%ADMIN%' }
        }
      });
    }

    if (!userRole) {
      userRole = await Role.findOne();
    }

    const role_id = userRole ? userRole.id : 2;

    // Hash the password before storing
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newEmployee = await Employee.create({
      name,
      mobile,
      email: email || null,
      password_hash,
      role_id,
      is_active: true
    });

    // Fetch created record with role attached
    const employee = await Employee.findByPk(newEmployee.id, {
      include: [{ model: Role, as: 'role', attributes: ['id', 'name', 'description', 'permissions'] }]
    });

    // Generate JWT Token
    const token = jwt.sign(
      { id: employee.id, mobile: employee.mobile, email: employee.email, role_id: employee.role_id },
      env.JWT_SECRET,
      { expiresIn: env.JWT_EXPIRES_IN }
    );

    // Set HTTP-only Cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    const userObj = employee.toJSON();
    delete userObj.password_hash;

    return successResponse(res, 201, { employee: userObj, token }, 'Account created successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  logout,
  getMe,
  signup
};
