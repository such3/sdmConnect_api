import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Resource } from "../models/resource.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";

// Function to create a resource and update the user's resources list
const createResource = asyncHandler(async (req, res) => {
  // Extract data from the request body
  const { title, description, branch, semester, url, fileSize } = req.body;

  // Validate the required fields
  if (
    [title, description, branch, semester, url, fileSize].some(
      (field) => field?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // Create the resource in the database
  const resource = await Resource.create({
    title,
    description,
    semester,
    branch,
    url,
    fileSize,
    owner: req.user._id, // Set the owner to the current user's ID
  });

  // Check if resource was created
  if (!resource) {
    throw new ApiError(500, "Resource not created");
  }

  // Add the created resource to the user's 'resources' array
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Add the resource ID to the user's resources array
  user.resources.push(resource._id);

  // Save the updated user document
  await user.save();

  // Populate the owner field with specific user data (name, username, avatar)
  const createdResource = await Resource.findById(resource._id).populate(
    "owner",
    "fullName username avatar"
  ); // Populate the owner with specific fields

  // Return the newly created resource along with the owner data
  return res
    .status(201)
    .json(
      new ApiResponse(201, createdResource, "Resource created successfully")
    );
});
// Combined function to search and filter resources
const getAllResources = asyncHandler(async (req, res) => {
  // Step 1: Extract query parameters
  const { searchQuery, semester, branch, page = 1, limit = 10 } = req.query;

  // Step 2: Initialize the base filter (only non-blocked resources)
  let filter = { isBlocked: false };

  // Step 3: Apply filters based on query parameters

  // Validate and filter by semester (must be between 1 and 8)
  if (semester) {
    const semesterNum = parseInt(semester);
    if (semesterNum < 1 || semesterNum > 8) {
      throw new ApiError(400, "Semester must be a number between 1 and 8");
    }
    filter.semester = semesterNum; // Filter by semester
  }

  // Filter by branch if provided
  if (branch) {
    const validBranches = [
      "ISE",
      "CSE",
      "ECE",
      "MECH",
      "CIVIL",
      "EEE",
      "AIML",
      "CHEMICAL",
    ];
    if (!validBranches.includes(branch)) {
      throw new ApiError(400, "Invalid branch provided");
    }
    filter.branch = branch; // Filter by branch
  }

  // Step 4: Create the search query if searchQuery is provided
  if (searchQuery) {
    // Use regex with the "i" flag for case-insensitive search
    filter.title = { $regex: searchQuery, $options: "i" };
  }

  // Step 5: Aggregate query for filtering, searching, and pagination
  const aggregateQuery = Resource.aggregate([
    { $match: filter }, // Match the filter conditions (search and other filters)
    {
      $sort: { createdAt: -1 }, // Sort by the most recent resource (createdAt)
    },
    {
      $lookup: {
        from: "users", // Lookup the owner details from the User model
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner", // Unwind the owner array (we expect only one owner)
        preserveNullAndEmptyArrays: true, // Preserve resources without owners
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        semester: 1,
        branch: 1,
        url: 1,
        fileSize: 1,
        isBlocked: 1,
        owner: { fullName: 1, username: 1, avatar: 1 },
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ]);

  // Step 6: Apply pagination using mongoose-aggregate-paginate
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
  };

  const resources = await Resource.aggregatePaginate(aggregateQuery, options);

  // Step 7: If no resources are found, throw an error
  if (!resources || resources.length === 0) {
    throw new ApiError(
      404,
      "No resources found with the given filters or search criteria"
    );
  }

  // Step 8: Return the resources with pagination info
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        resources,
        totalResources: resources.totalDocs,
        totalPages: resources.totalPages,
        currentPage: parseInt(page),
      },
      "Resources fetched successfully"
    )
  );
});

// Controller to fetch a single resource by its ID
const getSingleResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract the resource ID from the request parameters

  // Step 1: Validate the resource ID format
  if (!mongoose.Types.ObjectId.isValid(resourceId)) {
    throw new ApiError(400, "Invalid resource ID format");
  }

  // Step 2: Find the resource by ID and populate the owner field with relevant details (fullName, username, avatar)
  const resource = await Resource.findById(resourceId)
    .populate("owner", "fullName username avatar") // Populate the owner's fullName, username, and avatar
    .exec();

  // Step 3: If the resource does not exist, throw an error
  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 4: Return the resource with the owner's details in the response
  return res.status(200).json({
    status: 200,
    message: "Resource fetched successfully",
    data: resource, // Resource includes the populated owner field
  });
});

const updateResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Extract the resource ID from the request parameters
  const { title, description } = req.body; // Extract the title and description from the request body

  // Validate if title and description are provided and not empty
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  // Find the resource by ID and ensure the resource exists
  const resource = await Resource.findById(resourceId);

  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 1: Check if the logged-in user is the owner of the resource or an admin
  const isOwner = resource.owner.toString() === req.user._id.toString();
  const isAdmin = req.user.role === "admin";

  // If neither owner nor admin, throw error
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to update this resource");
  }

  // Step 2: Update the resource title and description
  resource.title = title;
  resource.description = description;

  // Step 3: Save the updated resource to the database
  const updatedResource = await resource.save();

  // Step 4: Return the updated resource along with a success message
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedResource, "Resource updated successfully")
    );
});

const deleteResource = asyncHandler(async (req, res) => {
  const { resourceId } = req.params; // Get resourceId from URL params

  // Step 1: Find the resource by ID
  const resource = await Resource.findById(resourceId);

  // If the resource does not exist, throw an error
  if (!resource || resource.isBlocked) {
    throw new ApiError(404, "Resource not found");
  }

  // Step 2: Check if the logged-in user is the owner of the resource or an admin
  const isOwner = String(resource.owner) === String(req.user._id);
  const isAdmin = req.user.role === "admin";

  // If neither owner nor admin, throw error
  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this resource");
  }

  // Step 3: Remove the resource reference from the owner's resources array
  await User.updateOne(
    { _id: resource.owner }, // Find the owner of the resource
    { $pull: { resources: resourceId } } // Remove the resource ID from the owner's resources array
  );

  // Step 4: Delete the resource from the Resource collection
  await Resource.findByIdAndDelete(resourceId);

  // Step 5: Return a success response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Resource deleted successfully"));
});

export {
  createResource,
  getAllResources,
  updateResource,
  deleteResource,
  getSingleResource,
};
