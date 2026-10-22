'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('workflow_task_activities', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      task_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'workflow_tasks', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      actor_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      action: { type: Sequelize.STRING(40), allowNull: false },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'employees', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      notes: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP') }
    });

    await queryInterface.addIndex('workflow_task_activities', ['task_id', 'created_at']);

    const [tasks] = await queryInterface.sequelize.query(
      'SELECT id, assigned_by, assigned_to, assigned_at, completed_by, completed_at FROM workflow_tasks'
    );
    const activities = [];
    tasks.forEach((task) => {
      if (task.assigned_by && task.assigned_at) {
        activities.push({
          task_id: task.id,
          actor_id: task.assigned_by,
          action: 'ASSIGNED',
          assigned_to: task.assigned_to,
          created_at: task.assigned_at,
          updated_at: task.assigned_at
        });
      }
      if (task.completed_by && task.completed_at) {
        activities.push({
          task_id: task.id,
          actor_id: task.completed_by,
          action: 'COMPLETED',
          assigned_to: null,
          created_at: task.completed_at,
          updated_at: task.completed_at
        });
      }
    });
    if (activities.length) await queryInterface.bulkInsert('workflow_task_activities', activities);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('workflow_task_activities');
  }
};