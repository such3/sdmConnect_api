// Import necessary models, utility functions, and classes
import { Rating } from "../models/rating.model.js"; // Rating model for interacting with Rating data
import { Resource } from "../models/resource.model.js"; // Resource model for interacting with Resource data
import { ApiError } from "../utils/ApiError.js"; // Custom error handling class
import asyncHandler from "../utils/asyncHandler.js"; // Utility function to handle async operations with error handling

// Add rating for a resource
const rateResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Get the resourceId from the request parameters
  console.log(req.params); // Log the params to check if the correct resourceId is received
  const { rating } = req.body; // Get the rating value from the request body
  console.log(req.body); // Log the body to check if the rating value is received

  // Validate the rating value (must be between 1 and 5)
  if (rating < 1 || rating > 5) {
    throw new ApiError(400, "Rating must be between 1 and 5"); // Throw error if rating is not in valid range
  }

  // Check if the resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "Resource not found"); // Throw error if resource does not exist
  }

  // Check if the user has already rated this resource
  const existingRating = await Rating.findOne({
    user: req.user._id, // Check if the current user has already rated this resource
    resource: resourceId,
  });

  if (existingRating) {
    // If the user has already rated this resource, update the rating
    existingRating.rating = rating; // Update the rating value
    await existingRating.save(); // Save the updated rating
  } else {
    // If the user has not rated the resource yet, create a new rating
    await Rating.create({
      user: req.user._id, // Associate the rating with the current user
      resource: resourceId, // Associate the rating with the given resource
      rating, // Set the rating value
    });
  }

  // Recalculate the average rating for the resource
  const avgRating = await resource.getAverageRating();

  // Respond with the updated average rating
  return res.status(200).json({
    status: "success", // Success status
    message: "Rating submitted successfully", // Success message
    data: { averageRating: avgRating }, // Send the updated average rating of the resource
  });
});

// Get average rating of a resource
const getResourceRating = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract the resourceId from the request parameters

  // Find the resource by its ID
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "Resource not found"); // Throw error if the resource is not found
  }

  // Get the average rating from the resource model
  const avgRating = await resource.getAverageRating();

  // Respond with the average rating
  return res.status(200).json({
    status: "success", // Success status
    data: { averageRating: avgRating }, // Send the average rating as response data
  });
});

// Remove a rating from a resource
const removeRating = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Get the resourceId from the request parameters

  // Step 1: Check if the resource exists
  const resource = await Resource.findById(resourceId);
  if (!resource) {
    throw new ApiError(404, "Resource not found"); // Throw error if the resource does not exist
  }

  // Step 2: Check if the user has rated this resource
  const rating = await Rating.findOne({
    user: req.user._id, // Check if the current user has rated this resource
    resource: resourceId,
  });

  if (!rating) {
    throw new ApiError(404, "You have not rated this resource yet"); // Throw error if no rating exists from this user
  }

  // Step 3: Remove the user's rating for the resource using deleteOne
  await Rating.deleteOne({ _id: rating._id }); // Delete the rating from the database

  // Step 4: Optionally, recalculate the average rating for the resource if needed
  const avgRating = await resource.getAverageRating();

  // Step 5: Respond with success message and updated average rating
  return res.status(200).json({
    status: "success", // Success status
    message: "Your rating has been removed successfully", // Success message
    data: { averageRating: avgRating }, // Include the updated average rating in the response
  });
});

// Export the functions to be used in routes
export { rateResource, getResourceRating, removeRating };
