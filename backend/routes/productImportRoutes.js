import express from "express";
import multer from "multer";
import {
  validateBulkUpload,
  getBulkUploadPreview,
  downloadBulkUploadErrorReport,
  confirmBulkUpload,
  uploadBulkProductImagesZIP,
  downloadImportTemplate,
  getManufacturerImportHistory,
} from "../controllers/productImportController.js";
import { manufacturerAuth } from "../middleware/manufacturerAuth.js";
import { productImportUpload } from "../middleware/productImportUpload.js";

const router = express.Router();
const zipUpload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }).single("file"); // 50MB max ZIP file

// GET /api/products/bulk/history - Fetch Manufacturer Import History Jobs
router.get("/history", manufacturerAuth, getManufacturerImportHistory);

// GET /api/products/bulk/template - Download import template (.xlsx / .csv)
router.get("/template", manufacturerAuth, downloadImportTemplate);

// POST /api/products/bulk/validate - Validate upload file payload
router.post("/validate", manufacturerAuth, productImportUpload, validateBulkUpload);

// GET /api/products/bulk/:uploadId/preview - Preview upload results
router.get("/:uploadId/preview", manufacturerAuth, getBulkUploadPreview);

// GET /api/products/bulk/:uploadId/errors - Download CSV error report
router.get("/:uploadId/errors", manufacturerAuth, downloadBulkUploadErrorReport);

// POST /api/products/bulk/:uploadId/confirm - Confirm import and commit products
router.post("/:uploadId/confirm", manufacturerAuth, confirmBulkUpload);

// POST /api/products/bulk/:uploadId/images - Upload product images ZIP archive
router.post("/:uploadId/images", manufacturerAuth, zipUpload, uploadBulkProductImagesZIP);

export default router;
