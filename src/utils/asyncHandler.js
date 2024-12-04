/**
 * A higher-order function that wraps asynchronous route handlers to catch errors automatically.
 * It simplifies error handling for asynchronous functions (like those that use `async`/`await`).
 *
 * @function asyncHandler
 * @param {Function} requestHandler - The asynchronous function (route handler) that needs error handling.
 *
 * @returns {Function} - A middleware function that catches and passes any errors to the next error handler.
 */
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    // Automatically catch and handle any errors in the asynchronous route handler
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      console.error("ERROR : ", error); // Log the error for debugging or monitoring
      next(error); // Pass the error to the next error handling middleware
    });
  };
};

export default asyncHandler;
