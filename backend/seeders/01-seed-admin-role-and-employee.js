'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert ADMIN role
    await queryInterface.bulkInsert('roles', [
      {
        name: 'ADMIN',
        description: 'System Administrator with full access rights',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Query for the ADMIN role ID
    const [roles] = await queryInterface.sequelize.query(
      `SELECT id FROM roles WHERE name = 'ADMIN' LIMIT 1;`
    );
    
    if (!roles || roles.length === 0) {
      throw new Error('Failed to retrieve inserted ADMIN role ID');
    }

    const adminRoleId = roles[0].id;

    // Hash admin password
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);

    await queryInterface.bulkInsert('employees', [
      {
        name: 'Admin User',
        email: 'admin@office.local',
        password_hash: hashedPassword,
        mobile: '9999999999',
        designation: 'System Administrator',
        role_id: adminRoleId,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('employees', { email: 'admin@office.local' }, {});
    await queryInterface.bulkDelete('roles', { name: 'ADMIN' }, {});
  }
};
