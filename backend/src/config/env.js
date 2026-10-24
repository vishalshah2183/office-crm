module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'production',
  DB_HOST: process.env.DB_HOST || 'gateway01.ap-northeast-1.prod.aws.tidbcloud.com',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 4000,
  DB_NAME: process.env.DB_NAME || 'test',
  DB_USER: process.env.DB_USER || '2cMxuiLAHjVCdbZ.root',
  DB_PASSWORD: process.env.DB_PASSWORD || 'VqJ7DCCssg3Sa7Sb',
  JWT_SECRET: process.env.JWT_SECRET || 'super_secret_crm_jwt_token_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  FRONTEND_URL: process.env.FRONTEND_URL || '*',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads/designs'
};