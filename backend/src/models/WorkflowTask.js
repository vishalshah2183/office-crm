const { DataTypes } = require('sequelize');

module.exports = (sequelize) => sequelize.define('WorkflowTask', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  file_id: { type: DataTypes.INTEGER, allowNull: false },
  task_key: { type: DataTypes.STRING(80), allowNull: false },
  title: { type: DataTypes.STRING(180), allowNull: false },
  category: { type: DataTypes.STRING(50), allowNull: false },
  sequence: { type: DataTypes.INTEGER, allowNull: false },
  is_optional: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  is_triggered: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  default_designation: { type: DataTypes.STRING(100), allowNull: true },
  assigned_to: { type: DataTypes.INTEGER, allowNull: true },
  assigned_by: { type: DataTypes.INTEGER, allowNull: true },
  assigned_at: { type: DataTypes.DATE, allowNull: true },
  completed_by: { type: DataTypes.INTEGER, allowNull: true },
  completed_at: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  tableName: 'workflow_tasks',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});