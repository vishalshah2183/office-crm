const successResponse = (res, statusCode = 200, data = {}, message = null) => {
  const responseObj = {
    success: true,
    data
  };
  if (message) {
    responseObj.message = message;
  }
  return res.status(statusCode).json(responseObj);
};

const errorResponse = (res, statusCode = 500, message = 'Internal Server Error', errors = null) => {
  const responseObj = {
    success: false,
    message
  };
  if (errors) {
    responseObj.errors = errors;
  }
  return res.status(statusCode).json(responseObj);
};

module.exports = {
  successResponse,
  errorResponse
};
