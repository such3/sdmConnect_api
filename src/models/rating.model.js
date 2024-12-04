import mongoose from "mongoose";
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Import custom error handler utility

/**
 * Schema definition for the "Rating" model in MongoDB.
 * This schema represents a rating given by a user on a resource.
 * It contains information about the user, the resource being rated, and the rating itself.
 */
const ratingSchema = new mongoose.Schema({
  // The user who created the rating, referencing the User model.
  user: {
    type: mongoose.Schema.Types.ObjectId, // ObjectId type used for referencing another document
    ref: "User", // Reference to the "User" model
    required: true, // User is a required field
  },

  // The resource being rated, referencing the Resource model.
  resource: {
    type: mongoose.Schema.Types.ObjectId, // ObjectId type for referencing another document
    ref: "Resource", // Reference to the "Resource" model
    required: true, // Resource is a required field
  },

  // The rating value, which must be a number between 1 and 5.
  rating: {
    type: Number, // Number type for the rating value
    required: [true, "Please provide a rating between 1 and 5"], // Rating is a required field
    min: 1, // Minimum allowed rating value is 1
    max: 5, // Maximum allowed rating value is 5
  },

  // Timestamp of when the rating was created. Defaults to the current date/time.
  createdAt: {
    type: Date, // Date type for the creation timestamp
    default: Date.now, // Default value is the current date/time when the rating is created
  },
});

/**
 * Middleware to handle errors when saving a rating document to MongoDB.
 * This middleware is triggered after a "save" operation on the Rating model.
 * It catches errors and formats them using the custom error handler.
 */
ratingSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Format the error using the dbErrorHandler utility
  next(err); // Pass the error to the next middleware or response handler
});

// Export the Rating model based on the defined schema.
export const Rating = mongoose.model("Rating", ratingSchema);
