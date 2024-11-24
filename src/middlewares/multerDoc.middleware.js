import multer from "multer";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// Set storage options for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/resources/"); // Store uploaded PDFs in this folder
  },
  filename: (req, file, cb) => {
    // Generate a unique name for the PDF file using UUID
    const uniqueSuffix = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueSuffix); // Save the file with the unique name
  },
});

// File filter: Allow only PDF files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = /pdf/;
  const extname = allowedMimeTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedMimeTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true); // Accept the file
  } else {
    return cb(new Error("Only PDF files are allowed"), false); // Reject non-PDF files
  }
};

// Multer configuration for handling single PDF file upload
const uploadSinglePdf = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10MB
}).single("file"); // 'file' is the field name in the form for the uploaded file

export { uploadSinglePdf };
