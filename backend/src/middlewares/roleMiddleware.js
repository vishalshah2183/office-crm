const { errorResponse } = require('../utils/apiResponse');
const { hasPermission } = require('../utils/permissions');

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return errorResponse(res, 401, 'Authentication required');
    }

    const userRole = req.user.role.name.toUpperCase();
    const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase());

    if (!normalizedAllowedRoles.includes(userRole)) {
      return errorResponse(res, 403, 'Access denied: insufficient permissions');
    }

    next();
  };
};

const requirePermission = (module, action = 'read') => (req, res, next) => {
  if (!req.user) return errorResponse(res, 401, 'Authentication required');
  if (!hasPermission(req.user, module, action)) {
    return errorResponse(res, 403, `Access denied: ${action} permission required for ${module}`);
  }
  next();
};

module.exports = {
  requireRole,
  requirePermission
};
