'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('workflow_tasks', 'is_optional', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn('workflow_tasks', 'is_triggered', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    });
    await queryInterface.sequelize.query(
      "UPDATE workflow_tasks SET is_optional = 1, is_triggered = 0 WHERE category = 'QUERY'"
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('workflow_tasks', 'is_triggered');
    await queryInterface.removeColumn('workflow_tasks', 'is_optional');
  }
};