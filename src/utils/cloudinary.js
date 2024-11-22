import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload a file to Cloudinary
const uploadOnCloudinary = async (localFilePath) => {
  try {
    // Ensure the localFilePath exists
    if (!localFilePath) {
      console.error("No file path provided");
      return null;
    }

    // Upload the file to Cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto", // Automatically detects the resource type (image, video, etc.)
    });

    // Log the URL of the uploaded file
    // console.log("File uploaded successfully: ", response.url);
    fs.unlinkSync(localFilePath); // Synchronously delete the file from the local server
    // Return the Cloudinary response containing the URL and other details
    return response;
  } catch (error) {
    // Log the error for debugging
    console.error("Error during Cloudinary upload: ", error.message);

    // Remove the file from the server to avoid leaving temporary files
    if (localFilePath && fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath); // Synchronously delete the file from the local server
      console.log("Temporary file removed from the server");
    }

    // Return null to indicate failure
    return null;
  }
};

export { uploadOnCloudinary };
