const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const File = sequelize.define('File', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    file_number: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    odps_number: {
      type: DataTypes.STRING(80),
      allowNull: true
    },
    work_type: {
      type: DataTypes.ENUM('Building Permission', 'Estimate', 'Valuation', 'Design'),
      allowNull: false
    },
    applicant_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    applicant_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    applicant_mobile: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    revenue_survey_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    city_survey_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    tp_scheme_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    final_plot_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    plot_no: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    permission_type: {
      type: DataTypes.ENUM('Building Permission', 'Addition & Extension', 'Subdivision', 'Layout'),
      allowNull: true
    },
    floors: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    specific_built_up_area: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    estimated_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    current_status: {
      type: DataTypes.ENUM(
        'NEW',
        'QUOTATION',
        'FINALIZED',
        'DRAWING_IN_PROGRESS',
        'DRAWING_COMPLETED',
        'PROCESSING',
        'SCRUTINY_FEES_PAID',
        'COMPLETED',
        'CANCELLED'
      ),
      allowNull: false,
      defaultValue: 'NEW'
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'files',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return File;
};
