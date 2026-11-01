/**
 * Standardized API Response Helpers
 * Follows Requirement 18 structure
 */

/**
 * Standardized API Response Helpers
 * Supports both positional parameters:
 *   successResponse(res, data, message, statusCode, pagination)
 *   errorResponse(res, message, statusCode, errors)
 * And options object:
 *   successResponse(res, { data, message, statusCode, pagination })
 *   errorResponse(res, { message, statusCode, errors })
 */

const successResponse = (res, dataOrOptions = null, message = 'Success', statusCode = 200, pagination = null) => {
  let finalData = dataOrOptions;
  let finalMessage = message;
  let finalStatusCode = statusCode;
  let finalPagination = pagination;

  if (
    dataOrOptions &&
    typeof dataOrOptions === 'object' &&
    !Array.isArray(dataOrOptions) &&
    (dataOrOptions.data !== undefined ||
     dataOrOptions.message !== undefined ||
     dataOrOptions.statusCode !== undefined) &&
    message === 'Success' &&
    statusCode === 200
  ) {
    finalData = dataOrOptions.data !== undefined ? dataOrOptions.data : null;
    finalMessage = dataOrOptions.message || 'Success';
    finalStatusCode = dataOrOptions.statusCode || 200;
    finalPagination = dataOrOptions.pagination || null;
  }

  const payload = {
    success: true,
    message: finalMessage,
    data: finalData,
  };

  if (finalPagination) {
    payload.pagination = finalPagination;
  }

  return res.status(finalStatusCode).json(payload);
};

const errorResponse = (res, messageOrOptions = 'Something went wrong', statusCode = 500, errors = []) => {
  let finalMessage = messageOrOptions;
  let finalStatusCode = statusCode;
  let finalErrors = errors;

  if (
    messageOrOptions &&
    typeof messageOrOptions === 'object' &&
    !Array.isArray(messageOrOptions)
  ) {
    finalMessage = messageOrOptions.message || 'Something went wrong';
    finalStatusCode = messageOrOptions.statusCode || 500;
    finalErrors = messageOrOptions.errors || [];
  }

  return res.status(finalStatusCode).json({
    success: false,
    message: finalMessage,
    errors: Array.isArray(finalErrors) ? finalErrors : [finalErrors],
  });
};

module.exports = {
  successResponse,
  errorResponse,
};

