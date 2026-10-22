const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const FileStatusHistory = sequelize.define('FileStatusHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'file_status_history',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return FileStatusHistory;
};
