const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { Employee, Role } = require('../models');
const { errorResponse } = require('../utils/apiResponse');

const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Fallback to Bearer token in Authorization header if present
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Authentication token missing or invalid');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const employee = await Employee.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          as: 'role',
          attributes: ['id', 'name', 'description', 'permissions']
        }
      ]
    });

    if (!employee) {
      return errorResponse(res, 401, 'Employee account not found');
    }

    if (!employee.is_active) {
      return errorResponse(res, 403, 'Account is inactive. Contact system administrator');
    }

    req.user = employee;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Invalid or expired authentication token');
    }
    return errorResponse(res, 500, 'Authentication check failed', error.message);
  }
};

module.exports = authMiddleware;
