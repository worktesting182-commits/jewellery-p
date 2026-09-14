import multer from "multer";
import path from "path";
import { PRODUCT_IMPORT_CONFIG } from "../config/importConfig.js";

// Memory storage engine to access file buffer directly in memory
const storage = multer.memoryStorage();

// File Filter: Strictly enforces extension whitelist (.xlsx, .xls, .csv)
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!PRODUCT_IMPORT_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    const error = new Error(
      `Invalid file type '${ext}'. Only ${PRODUCT_IMPORT_CONFIG.ALLOWED_EXTENSIONS.join(", ")} files are allowed.`
    );
    error.statusCode = 400;
    return cb(error, false);
  }

  cb(null, true);
};

// Configure Multer instance with file size limits and file filter
const upload = multer({
  storage: storage,
  limits: {
    fileSize: PRODUCT_IMPORT_CONFIG.MAX_FILE_SIZE_BYTES,
  },
  fileFilter: fileFilter,
}).single("file");

/**
 * Middleware Wrapper to handle Multer errors gracefully and return JSON responses
 */
export const uploadImportFile = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          const limitMb = Math.round(PRODUCT_IMPORT_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024));
          return res.status(400).json({
            success: false,
            message: `File size exceeds the maximum allowed limit of ${limitMb}MB.`,
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload error: ${err.message}`,
        });
      }

      return res.status(err.statusCode || 400).json({
        success: false,
        message: err.message || "Failed to process uploaded file.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No upload file provided. Please attach a valid .xlsx, .xls, or .csv file.",
      });
    }

    next();
  });
};
