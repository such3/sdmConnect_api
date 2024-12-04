/**
 * Custom response structure class for API responses.
 * This class provides a standardized format for API responses, including the status code, message, data, and success status.
 * It helps in maintaining a consistent response structure across your application.
 *
 * @class ApiResponse
 */
class ApiResponse {
  /**
   * Creates an instance of the ApiResponse class.
   *
   * @constructor
   * @param {number} statusCode - The HTTP status code for the response (e.g., 200 for success, 400 for bad request, etc.).
   * @param {any} data - The data that will be sent in the response body (e.g., user information, resource data, etc.).
   * @param {string} message - A message that gives more context or details about the response (e.g., "User created successfully").
   */
  constructor(statusCode, data, message) {
    this.statusCode = statusCode; // Set the HTTP status code for the response
    this.message = message; // Set the message that provides context about the response
    this.data = data; // Set the actual data to be returned in the response
    this.success = statusCode < 400; // Set success flag based on the status code (true for 2xx/3xx, false for 4xx/5xx)
  }
}

export { ApiResponse };
