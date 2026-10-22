const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');
const env = require('../config/env');

const config = dbConfig[env.NODE_ENV] || dbConfig.development;

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

const Role = require('./Role')(sequelize);
const Employee = require('./Employee')(sequelize);
const File = require('./File')(sequelize);
const Quotation = require('./Quotation')(sequelize);
const Payment = require('./Payment')(sequelize);
const DesignFile = require('./DesignFile')(sequelize);
const Expense = require('./Expense')(sequelize);
const WorkflowTask = require('./WorkflowTask')(sequelize);
const WorkflowTaskActivity = require('./WorkflowTaskActivity')(sequelize);

// --- Associations ---

// Role <-> Employee
Role.hasMany(Employee, { foreignKey: 'role_id', as: 'employees' });
Employee.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });

// Employee <-> File (Creator)
Employee.hasMany(File, { foreignKey: 'created_by', as: 'createdFiles' });
File.belongsTo(Employee, { foreignKey: 'created_by', as: 'creator' });

// File <-> Quotation
File.hasMany(Quotation, { foreignKey: 'file_id', as: 'quotations' });
Quotation.belongsTo(File, { foreignKey: 'file_id', as: 'file' });
Quotation.belongsTo(Employee, { foreignKey: 'created_by', as: 'creator' });
Employee.hasMany(Quotation, { foreignKey: 'created_by', as: 'quotations' });

// File / Quotation <-> Payment
File.hasMany(Payment, { foreignKey: 'file_id', as: 'payments' });
Payment.belongsTo(File, { foreignKey: 'file_id', as: 'file' });
Quotation.hasMany(Payment, { foreignKey: 'quotation_id', as: 'payments' });
Payment.belongsTo(Quotation, { foreignKey: 'quotation_id', as: 'quotation' });
Payment.belongsTo(Employee, { foreignKey: 'created_by', as: 'creator' });
Employee.hasMany(Payment, { foreignKey: 'created_by', as: 'payments' });

// File <-> DesignFile
File.hasMany(DesignFile, { foreignKey: 'file_id', as: 'designFiles' });
DesignFile.belongsTo(File, { foreignKey: 'file_id', as: 'file' });
DesignFile.belongsTo(Employee, { foreignKey: 'uploaded_by', as: 'uploader' });
Employee.hasMany(DesignFile, { foreignKey: 'uploaded_by', as: 'uploadedDesigns' });

// Employee <-> Expense
Expense.belongsTo(Employee, { foreignKey: 'created_by', as: 'creator' });
Employee.hasMany(Expense, { foreignKey: 'created_by', as: 'expenses' });
Expense.belongsTo(Employee, { foreignKey: 'employee_id', as: 'employee' });
Employee.hasMany(Expense, { foreignKey: 'employee_id', as: 'employeeExpenses' });

// File <-> WorkflowTask
File.hasMany(WorkflowTask, { foreignKey: 'file_id', as: 'workflowTasks' });
WorkflowTask.belongsTo(File, { foreignKey: 'file_id', as: 'file' });
WorkflowTask.belongsTo(Employee, { foreignKey: 'assigned_to', as: 'assignee' });
WorkflowTask.belongsTo(Employee, { foreignKey: 'assigned_by', as: 'assigner' });
WorkflowTask.belongsTo(Employee, { foreignKey: 'completed_by', as: 'completer' });
WorkflowTask.hasMany(WorkflowTaskActivity, { foreignKey: 'task_id', as: 'activities' });
WorkflowTaskActivity.belongsTo(WorkflowTask, { foreignKey: 'task_id', as: 'task' });
WorkflowTaskActivity.belongsTo(Employee, { foreignKey: 'actor_id', as: 'actor' });
WorkflowTaskActivity.belongsTo(Employee, { foreignKey: 'assigned_to', as: 'assignedEmployee' });

const db = {
  sequelize,
  Sequelize,
  Role,
  Employee,
  File,
  Quotation,
  Payment,
  DesignFile,
  Expense,
  WorkflowTask,
  WorkflowTaskActivity
};

module.exports = db;
