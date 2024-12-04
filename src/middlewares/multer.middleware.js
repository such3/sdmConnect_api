import multer from "multer";

// Multer storage configuration
const storage = multer.diskStorage({
  /**
   * The destination function specifies where the uploaded files will be stored.
   * In this case, files will be stored in the './public/temp' directory.
   *
   * @param {Object} req - The request object.
   * @param {Object} file - The file object containing information about the uploaded file.
   * @param {Function} cb - The callback function to be called with the destination path.
   */
  destination: function (req, file, cb) {
    // Files will be stored in the './public/temp' directory
    cb(null, "./public/temp");
  },

  /**
   * The filename function specifies how the uploaded file will be named.
   * In this case, the file will be renamed to the current timestamp followed by the original file name.
   *
   * @param {Object} req - The request object.
   * @param {Object} file - The file object.
   * @param {Function} cb - The callback function to provide the final file name.
   */
  filename: function (req, file, cb) {
    // The file name will be a timestamp followed by the original file name
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Export the Multer middleware with the defined storage configuration
export const upload = multer({ storage });
