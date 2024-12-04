import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; // Import pagination plugin for aggregation queries
import { Rating } from "./rating.model.js"; // Import Rating model for calculating average rating
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Import custom error handler utility

/**
 * Schema definition for the "Resource" model in MongoDB.
 * This schema represents a resource that can be rated by users.
 * It contains details about the resource like title, description, semester, branch, and owner.
 */
const resourceSchema = new mongoose.Schema(
  {
    // Title of the resource, required with specific validation on length.
    title: {
      type: String, // String type for the title
      required: [true, "Title is required"], // Title is a required field
      trim: true, // Trim leading and trailing whitespace from the title
      min: [3, "Title must be at least 3 characters long"], // Minimum length for the title is 3 characters
      max: [255, "Title must be at most 255 characters long"], // Maximum length for the title is 255 characters
      index: true, // Index the title field for faster queries
    },

    // Description of the resource, with validation for length.
    description: {
      type: String, // String type for the description
      required: [true, "Description is required"], // Description is a required field
      trim: true, // Trim leading and trailing whitespace from the description
      min: [10, "Description must be at least 10 characters long"], // Minimum length for the description is 10 characters
      max: [500, "Description must be at most 500 characters long"], // Maximum length for the description is 500 characters
    },

    // Semester the resource is associated with, must be a number between 1 and 8.
    semester: {
      type: Number, // Number type for the semester
      required: [true, "Semester is required"], // Semester is a required field
      max: [8, "Semester can be Maximum 8"], // Maximum value for semester is 8
      min: [1, "Semester can be Minimum 1"], // Minimum value for semester is 1
    },

    // Branch associated with the resource, must be one of the predefined values.
    branch: {
      type: String, // String type for the branch
      required: [true, "Branch is required"], // Branch is a required field
      enum: ["ISE", "CSE", "ECE", "MECH", "CIVIL", "EEE", "AIML", "CHEMICAL"], // Branch must be one of the predefined values
    },

    // File URL associated with the resource.
    file: {
      type: String, // String type for the file URL
      required: [true, "File URL is required"], // File URL is a required field
      trim: true, // Trim leading and trailing whitespace from the URL
    },

    // Boolean flag to indicate whether the resource is blocked.
    isBlocked: {
      type: Boolean, // Boolean type to represent the blocked status
      default: false, // Default value is false (not blocked)
    },

    // Owner of the resource, referencing the User model.
    owner: {
      type: mongoose.Schema.Types.ObjectId, // ObjectId type for referencing another document
      ref: "User", // Reference to the "User" model
    },
  },
  {
    // Automatically add timestamp fields (`createdAt` and `updatedAt`) to the resource schema.
    timestamps: true,
  }
);

/**
 * Instance method to calculate the average rating for a resource.
 * It uses the Rating model to aggregate ratings for the resource and calculates the average.
 *
 * @returns {Number} The average rating, or 0 if no ratings exist for the resource.
 */
resourceSchema.methods.getAverageRating = async function () {
  // Aggregate ratings for the resource and calculate the average.
  const ratings = await Rating.aggregate([
    { $match: { resource: this._id } }, // Match ratings for the current resource
    { $group: { _id: null, avgRating: { $avg: "$rating" } } }, // Group and calculate the average rating
  ]);
  return ratings.length > 0 ? ratings[0].avgRating : 0; // Return the average rating, or 0 if no ratings found
};

// Apply the mongoose-aggregate-paginate plugin to enable pagination for aggregation queries.
resourceSchema.plugin(mongooseAggregatePaginate);

/**
 * Middleware to handle errors when saving a document in MongoDB.
 * This middleware is triggered after a "save" operation on the Resource model.
 * It catches errors and passes them to the error handler.
 */
resourceSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Format the error using the dbErrorHandler utility
  next(err); // Pass the error to the next middleware or response handler
});

// Export the Resource model based on the defined schema.
export const Resource = mongoose.model("Resource", resourceSchema);
