/**
 * Custom Error class for handling API-specific errors with a consistent structure.
 * This class extends the built-in JavaScript Error class, allowing you to throw and manage API errors in a structured way.
 *
 * @class ApiError
 * @extends Error
 */
class ApiError extends Error {
  /**
   * Creates an instance of the ApiError class.
   *
   * @constructor
   * @param {number} statusCode - The HTTP status code to be associated with the error (e.g., 404 for "Not Found").
   * @param {string} [message="Something Went Wrong"] - A message providing more details about the error.
   * @param {Array} [error=[]] - An optional array to provide additional error details or error objects.
   * @param {string} [stack=""] - An optional custom stack trace string. If not provided, a default stack trace is generated.
   */
  constructor(
    statusCode,
    message = "Something Went Wrong",
    error = [],
    stack = ""
  ) {
    super(message); // Call the parent class constructor with the error message
    this.statusCode = statusCode; // Set the HTTP status code
    this.data = null; // Optional property to store additional data related to the error (if needed)
    this.success = false; // A flag indicating that the operation was unsuccessful
    this.error = error; // Store error details passed in as an argument

    // If a custom stack trace is provided, use it, else capture the stack trace
    if (stack) {
      this.stack = stack; // Use the provided stack trace if available
    } else {
      Error.captureStackTrace(this, this.constructor); // Automatically capture stack trace if no custom stack is passed
    }
  }
}

export { ApiError };
