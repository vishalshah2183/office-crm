const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Payment = sequelize.define('Payment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quotation_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    payment_type: {
      type: DataTypes.ENUM('ADVANCE', 'FULL', 'PARTIAL'),
      allowNull: false,
      defaultValue: 'ADVANCE'
    },
    payment_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'),
      allowNull: false
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'payments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Payment;
};
