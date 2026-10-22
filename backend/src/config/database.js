const env = require('./env');

const dbConfig = {
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updated_at: 'updated_at'
  }
};

module.exports = {
  development: dbConfig,
  test: dbConfig,
  production: {
    ...dbConfig,
    logging: false
  }
};
