'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const columns = await queryInterface.describeTable('expenses');
    if (!columns.employee_id) {
      await queryInterface.addColumn('expenses', 'employee_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    const indexes = await queryInterface.showIndex('expenses');
    if (!indexes.some((index) => index.fields?.some((field) => field.attribute === 'employee_id'))) {
      await queryInterface.addIndex('expenses', ['employee_id']);
    }
  },

  down: async (queryInterface) => {
    await queryInterface.removeIndex('expenses', ['employee_id']);
    await queryInterface.removeColumn('expenses', 'employee_id');
  }
};
