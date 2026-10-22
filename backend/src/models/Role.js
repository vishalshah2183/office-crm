const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Role = sequelize.define('Role', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {},
      get() {
        const value = this.getDataValue('permissions');
        if (typeof value !== 'string') return value || {};
        try {
          return JSON.parse(value);
        } catch (error) {
          return {};
        }
      }
    }
  }, {
    tableName: 'roles',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Role;
};
