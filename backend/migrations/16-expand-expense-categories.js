'use strict';

const categories = ['SALARY', 'UPAD', 'OFFICE', 'PRINTING', 'TRAVEL', 'UTILITIES', 'HARDWARE', 'SITE_VISIT', 'OTHER'];

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('expenses', 'category', {
      type: Sequelize.ENUM(...categories),
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn('expenses', 'category', {
      type: Sequelize.ENUM('SALARY', 'OFFICE', 'OTHER'),
      allowNull: false
    });
  }
};
