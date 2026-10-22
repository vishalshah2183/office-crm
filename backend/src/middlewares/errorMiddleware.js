const env = require('../config/env');
const { errorResponse } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  console.error('[Error Middleware]:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Do not expose stack traces or internal secrets in response
  const responseData = env.NODE_ENV === 'development' ? { stack: err.stack } : null;

  return errorResponse(res, statusCode, message, responseData);
};

module.exports = errorHandler;
