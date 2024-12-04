import mongoose from "mongoose";
import dbErrorHandler from "../utils/dbErrorHandler.js"; // Import error handler utility to handle database-related errors

/**
 * Schema definition for the "Comment" model in MongoDB.
 * This schema represents a comment left by a user on a resource.
 * It contains information about the user, the resource, and the comment itself.
 */
const commentSchema = new mongoose.Schema(
  {
    // User who created the comment, referencing the User model.
    user: {
      type: mongoose.Schema.Types.ObjectId, // ObjectId type is used for references to other documents
      ref: "User", // Reference to the "User" model
      required: true, // User is a required field
    },

    // Resource on which the comment is made, referencing the Resource model.
    resource: {
      type: mongoose.Schema.Types.ObjectId, // ObjectId type for referencing another document
      ref: "Resource", // Reference to the "Resource" model
      required: true, // Resource is a required field
    },

    // The content of the comment, which must be a string.
    comment: {
      type: String, // String type for the comment content
      required: true, // Comment is a required field
      trim: true, // Automatically trims whitespace from both ends of the string
      min: [3, "Comment must be at least 3 characters long"], // Minimum length validation
      max: [1000, "Comment must be at most 1000 characters long"], // Maximum length validation
    },
  },
  {
    // Automatically add timestamp fields (`createdAt` and `updatedAt`) to the comment schema.
    timestamps: true,
  }
);

/**
 * Middleware to handle errors when saving a document in MongoDB.
 * This middleware is triggered after a "save" operation on the Comment model.
 * It catches errors and passes them to the error handler.
 */
commentSchema.post("save", function (error, doc, next) {
  const err = dbErrorHandler(error); // Use the dbErrorHandler utility to format the error
  next(err); // Pass the error to the next middleware (or to the response)
});

// Export the Comment model based on the schema.
export const Comment = mongoose.model("Comment", commentSchema);
