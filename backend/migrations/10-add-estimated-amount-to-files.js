'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('files', 'permission_type', {
      type: Sequelize.ENUM('Building Permission', 'Addition & Extension', 'Subdivision', 'Layout'),
      allowNull: true
    });

    await queryInterface.addColumn('files', 'estimated_amount', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('files', 'estimated_amount');
    await queryInterface.changeColumn('files', 'permission_type', {
      type: Sequelize.ENUM('Building Permission', 'Addition & Extension', 'Subdivision', 'Layout'),
      allowNull: false
    });
  }
};