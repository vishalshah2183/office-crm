const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FileAssignment = sequelize.define('FileAssignment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    assigned_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    assignment_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'GENERAL'
    },
    assigned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'file_assignments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return FileAssignment;
};
