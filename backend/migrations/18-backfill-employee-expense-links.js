'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const [employees] = await queryInterface.sequelize.query(
      'SELECT id, name FROM employees'
    );

    for (const employee of employees) {
      await queryInterface.sequelize.query(
        `UPDATE expenses
         SET employee_id = :employeeId
         WHERE employee_id IS NULL
           AND category IN ('SALARY', 'UPAD')
           AND description LIKE :description`,
        {
          replacements: {
            employeeId: employee.id,
            description: `%for ${employee.name}%`
          }
        }
      );
    }

    await queryInterface.sequelize.query(
      "UPDATE expenses SET category = 'OTHER' WHERE category IS NULL OR category = ''"
    );
  },

  down: async () => {
    // Backfilled employee links cannot be safely distinguished from new links.
  }
};
