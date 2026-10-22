'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      file_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      work_type: {
        type: Sequelize.ENUM('Building Permission', 'Estimate', 'Valuation', 'Design'),
        allowNull: false
      },
      applicant_name: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      applicant_address: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      applicant_mobile: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      revenue_survey_no: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      city_survey_no: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      tp_scheme_no: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      final_plot_no: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      plot_no: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      permission_type: {
        type: Sequelize.ENUM('Building Permission', 'Addition & Extension', 'Subdivision', 'Layout'),
        allowNull: true
      },
      floors: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      specific_built_up_area: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      current_status: {
        type: Sequelize.ENUM(
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
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'employees',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('files', ['file_number']);
    await queryInterface.addIndex('files', ['current_status']);
    await queryInterface.addIndex('files', ['created_by']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('files');
  }
};
