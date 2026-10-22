const { Role } = require('../models');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { FULL_PERMISSIONS } = require('../utils/permissions');

const getAllRoles = async (req, res, next) => {
  try {
    const roles = await Role.findAll({ order: [['id', 'ASC']] });
    return successResponse(res, 200, { roles });
  } catch (error) {
    next(error);
  }
};

const createRole = async (req, res, next) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name) {
      return errorResponse(res, 400, 'Role name is required');
    }

    const uppercaseName = name.trim().toUpperCase();

    const existingRole = await Role.findOne({ where: { name: uppercaseName } });
    if (existingRole) {
      return errorResponse(res, 400, 'Role name already exists');
    }

    const role = await Role.create({
      name: uppercaseName,
      description: description || null,
      permissions: permissions || FULL_PERMISSIONS
    });

    return successResponse(res, 201, { role }, 'Role created successfully');
  } catch (error) {
    next(error);
  }
};

const updateRole = async (req, res, next) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return errorResponse(res, 404, 'Role not found');
    const { description, permissions } = req.body;
    if (description !== undefined) role.description = description || null;
    if (permissions !== undefined) role.permissions = permissions;
    await role.save();
    return successResponse(res, 200, { role }, 'Role updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllRoles,
  createRole,
  updateRole
};
