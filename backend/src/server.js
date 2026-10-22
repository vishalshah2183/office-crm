const app = require('./app');
const env = require('./config/env');
const { sequelize } = require('./models');

const PORT = env.PORT || 5000;

async function startServer() {
  try {
    // Authenticate database connection & sync models
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log('Database connection has been established & models synchronized successfully.');

    app.listen(PORT, () => {
      console.log(`Server running in ${env.NODE_ENV} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database or start server:', error);
    process.exit(1);
  }
}

startServer();
