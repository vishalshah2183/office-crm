const request = require('supertest'); // or standard HTTP test using app directly
const { sequelize } = require('./src/models');
const app = require('./src/app');

async function testBackend() {
  console.log('--- Testing Backend Initialization ---');
  try {
    // Sync models in sqlite in-memory for quick verification if MySQL is offline during automated test
    await sequelize.options.dialect;
    console.log('Loaded Sequelize dialect:', sequelize.getDialect());
  } catch (err) {
    console.error('Error during test setup:', err);
  }
}

if (require.main === module) {
  testBackend();
}
