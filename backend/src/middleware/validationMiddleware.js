const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Middleware that inspects express-validator results.
 * Returns 422 with formatted errors if validation fails, else calls next().
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const formattedErrors = errors.array().map((err) => ({
    field: err.path || err.param,
    message: err.msg,
    value: err.value,
  }));

  return errorResponse(res, 'Validation failed', 422, formattedErrors);
};

module.exports = { validate };

