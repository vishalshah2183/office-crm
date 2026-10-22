'use strict';

const modules = ['dashboard', 'files', 'employees', 'roles', 'expenses'];
const fullPermissions = Object.fromEntries(modules.map((module) => [module, { read: true, write: true, delete: true }]));

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('roles', 'permissions', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: fullPermissions
    });
    await queryInterface.sequelize.query(
      `UPDATE roles SET permissions = '${JSON.stringify(fullPermissions).replace(/'/g, "''")}'`
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('roles', 'permissions');
  }
};