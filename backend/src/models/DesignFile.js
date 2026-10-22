const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DesignFile = sequelize.define('DesignFile', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    file_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    file_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'design_files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return DesignFile;
};
