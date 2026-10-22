'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('files', 'odps_number', {
      type: Sequelize.STRING(80),
      allowNull: true
    });
    await queryInterface.addIndex('files', ['odps_number']);
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('files', ['odps_number']);
    await queryInterface.removeColumn('files', 'odps_number');
  }
};