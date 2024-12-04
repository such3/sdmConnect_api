// Import necessary models, utility functions, and classes
import { Comment } from "../models/comment.model.js"; // Comment model for interacting with Comment data
import { Resource } from "../models/resource.model.js"; // Resource model for interacting with Resource data
import { ApiError } from "../utils/ApiError.js"; // Class to handle custom API errors
import asyncHandler from "../utils/asyncHandler.js"; // Utility for handling async operations with error handling

// 1. Add a comment to a resource
const addComment = asyncHandler(async (req, res, next) => {
  const { resourceId } = req.params; // Extract the resourceId from the request parameters
  const { comment } = req.body; // Extract the comment text from the request body

  // Check if the resource exists in the database
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "Resource not found"); // If resource not found, throw error
  }

  // Create a new Comment instance
  const newComment = new Comment({
    user: req.user._id, // The user who is adding the comment (authenticated user)
    resource: resourceId, // The resource the comment belongs to
    comment, // The comment text
  });

  // Save the newly created comment to the database
  await newComment.save();

  // Return a success response with the newly created comment
  return res.status(201).json({
    message: "Comment added successfully",
    comment: newComment,
  });
});

// 2. Edit a comment
const editComment = asyncHandler(async (req, res, next) => {
  const { resourceId, commentId } = req.params; // Extract resourceId and commentId from request parameters
  const { comment } = req.body; // Extract the updated comment text from the request body

  // Step 1: Find the comment by its ID, associated resource, and check if the user is the owner of the comment
  const existingComment = await Comment.findOne({
    _id: commentId,
    resource: resourceId, // Ensure the comment belongs to the resource
    user: req.user._id, // Ensure the current user is the author of the comment
  });

  // Step 2: If the comment doesn't exist or the user isn't the owner, throw an error
  if (!existingComment) {
    throw new ApiError(
      404,
      "Comment not found or you are not the author of this comment"
    );
  }

  // Step 3: If the comment exists and the user is the owner, update the comment text
  existingComment.comment = comment;

  // Step 4: Save the updated comment to the database
  await existingComment.save();

  // Step 5: Return a success response with the updated comment
  return res.status(200).json({
    message: "Comment updated successfully",
    comment: existingComment, // Return the updated comment object
  });
});

// 3. Delete a comment
const deleteComment = asyncHandler(async (req, res, next) => {
  const { resourceId, commentId } = req.params; // Extract resourceId and commentId from request parameters

  // Check if the comment exists and belongs to the current user
  const comment = await Comment.findOne({
    _id: commentId,
    resource: resourceId, // Ensure the comment belongs to the resource
    user: req.user._id, // Ensure the current user is the author of the comment
  });
  if (!comment) {
    throw new ApiError(
      404,
      "Comment not found or you are not the author of this comment"
    );
  }

  // Delete the comment from the database
  await comment.deleteOne({ _id: comment._id });

  // Return a success response after deleting the comment
  return res.status(200).json({
    message: "Comment deleted successfully",
  });
});

// 4. Get all comments for a resource
const getComments = asyncHandler(async (req, res, next) => {
  const { resourceId } = req.params; // Extract resourceId from request parameters

  // Find the resource by its ID
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "Resource not found"); // If resource not found, throw error
  }

  // Populate the comments with user details (full name, username, avatar) and sort by creation date
  const comments = await Comment.find({ resource: resourceId })
    .populate("user", "fullName username avatar") // Populate the user details for each comment
    .sort({ createdAt: -1 }); // Sort comments by creation date in descending order

  // Return success response with the list of comments
  return res.status(200).json({
    message: "Comments fetched successfully",
    comments, // Send the comments list as part of the response
  });
});

// Export the comment-related functions for use in routes
export { getComments, deleteComment, editComment, addComment };
