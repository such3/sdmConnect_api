// MongoDB error handler utility

/**
 * This function handles MongoDB errors and formats them into a user-friendly format.
 * It takes an error object (from MongoDB operations) as input and returns an object with formatted error messages.
 *
 * @param {Object} error - The error object from a MongoDB operation.
 * @returns {Object} - The formatted error messages to be returned to the client.
 */
export default function dbErrorHandler(error) {
  // Initialize an errors object with a general error message as the default
  const errors = { general: "Something went wrong!" };

  // Duplicate key error (e.g., when a username or email already exists in the database)
  if (error.code === 11000) {
    // Check if the error is related to a duplicate username
    if (error.message.includes("username")) {
      errors.general = "Username is already in use."; // Custom message for duplicate username
    }
    // Check if the error is related to a duplicate email
    else if (error.message.includes("email")) {
      errors.general = "Email is already in use."; // Custom message for duplicate email
    }
    return errors; // Return the formatted error object
  }

  // Validation error (occurs when invalid data is passed to MongoDB, e.g., missing required fields)
  if (error.name === "ValidationError") {
    // Loop through all the fields with validation errors
    for (let field in error.errors) {
      // If the field has an error message, add it to the errors object
      if (error.errors[field].message) {
        errors[field] = error.errors[field].message; // Store the validation error message for each field
      }
    }
    return errors; // Return the formatted error object
  }

  // Catch-all for other types of errors
  if (error.message) {
    errors.general = error.message; // Add the general error message to the response
  }

  return errors; // Return the formatted error object
}
