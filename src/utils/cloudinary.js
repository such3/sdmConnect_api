import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configure Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Function to upload a file to Cloudinary and remove it from the local server.
 *
 * @param {string} localFilePath - The local file path of the file to be uploaded.
 * @returns {Object|null} - The Cloudinary response object if the upload is successful, null otherwise.
 */
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Ensure the localFilePath exists
    if (!localFilePath) {
      console.error("No file path provided for upload.");
      return null;
    }

    // Log the file path for debugging
    console.log("Uploading file from:", localFilePath);

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detect the resource type (image, video, etc.)
    });

    // Log the full response for debugging (including the URL)
    console.log("Cloudinary upload response:", response);

    // Remove the file from the local server after successful upload
    fs.unlinkSync(localFilePath); // Synchronously delete the file from the local server

    console.log(`File uploaded and local file removed: ${localFilePath}`);

    // Return the Cloudinary response containing details like URL, public_id, etc.
    return response;
  } catch (error) {
    // Log the error for debugging (including the full error object)
    console.error("Error during Cloudinary upload: ", error);

    // Check if the file exists before attempting to remove it
    if (localFilePath && fs.existsSync(localFilePath)) {
      // Remove the file from the server to avoid leaving temporary files
      fs.unlinkSync(localFilePath); // Synchronously delete the file from the local server
      console.log("Temporary file removed from the server:", localFilePath);
    }

    // Return null to indicate failure
    return null;
  }
};

export { uploadOnCloudinary };
