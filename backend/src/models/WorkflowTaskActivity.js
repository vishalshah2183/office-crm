const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('WorkflowTaskActivity', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  task_id: { type: DataTypes.INTEGER, allowNull: false },
  actor_id: { type: DataTypes.INTEGER, allowNull: false },
  action: { type: DataTypes.STRING(40), allowNull: false },
  assigned_to: { type: DataTypes.INTEGER, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'workflow_task_activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});