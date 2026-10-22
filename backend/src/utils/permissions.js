const MODULES = ['dashboard', 'files', 'employees', 'roles', 'expenses'];
const ACTIONS = ['read', 'write', 'delete'];

const FULL_PERMISSIONS = Object.fromEntries(
  MODULES.map((module) => [module, Object.fromEntries(ACTIONS.map((action) => [action, true]))])
);

const hasPermission = (user, module, action = 'read') => {
  if (['ADMIN', 'SUPERADMIN', 'SUPER_ADMIN'].includes(user?.role?.name?.toUpperCase()) || user?.role_id === 1) return true;
  let permissions = user?.role?.permissions;
  if (typeof permissions === 'string') {
    try {
      permissions = JSON.parse(permissions);
    } catch (error) {
      permissions = null;
    }
  }
  return Boolean(permissions?.[module]?.[action]);
};

module.exports = { MODULES, ACTIONS, FULL_PERMISSIONS, hasPermission };