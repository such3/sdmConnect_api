import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const respone = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been uploaded successfully
    console.log("File uploaded successfully : ", respone.url);
    return respone;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the file from the server
    return null;
  }
};

export { uploadOnCloudinary };
