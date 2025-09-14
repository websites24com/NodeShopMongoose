// util/errorHandler.js

/**
 * Wraps any error into a standardized Error object
 * with HTTP status code (default 500) and forwards it to Express `next()`.
 *
 * @param {Function} next - The Express `next` callback
 * @param {Error|string} err - The error (can be an Error or a message string)
 * @param {number} statusCode - Optional HTTP status code (default 500)
 */
function forwardError(next, err, statusCode = 500) {
  const error = new Error(err);
  error.httpStatusCode = statusCode;
  return next(error);
}

module.exports =  forwardError ;
