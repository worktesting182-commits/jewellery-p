import * as bulkImportService from "../services/bulkImportService.js";
import { generateCSVTemplate, generateExcelTemplateBuffer } from "../utils/importTemplateSpec.js";

/**
 * POST /api/manufacturer/products/bulk/validate
 */
export const validateBulkUpload = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No upload file provided. Please attach a valid file.",
      });
    }

    const result = await bulkImportService.validateBulkUpload(
      userId,
      file.buffer,
      file.originalname,
      file.mimetype
    );

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in validateBulkUpload controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to validate bulk product upload file.",
    });
  }
};

/**
 * GET /api/manufacturer/products/bulk/history
 * Returns array of manufacturer import jobs for the Import History page.
 */
export const getManufacturerImportHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const historyJobs = await bulkImportService.getManufacturerImportHistory(userId);
    return res.status(200).json({
      success: true,
      jobs: historyJobs,
    });
  } catch (err) {
    console.error("Error fetching import history:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to fetch import history jobs.",
    });
  }
};

/**
 * Phase 9: GET /api/manufacturer/products/bulk/:uploadId/preview
 */
export const getBulkUploadPreview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uploadId } = req.params;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: "Upload ID parameter is required.",
      });
    }

    const previewData = await bulkImportService.getBulkUploadPreview(userId, uploadId);
    return res.status(200).json(previewData);
  } catch (err) {
    console.error("Error in getBulkUploadPreview controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to fetch bulk upload preview details.",
    });
  }
};

/**
 * Phase 10: GET /api/manufacturer/products/bulk/:uploadId/errors
 */
export const downloadBulkUploadErrorReport = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uploadId } = req.params;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: "Upload ID parameter is required.",
      });
    }

    const csvContent = await bulkImportService.getBulkUploadErrorReportCSV(userId, uploadId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="CJP_Import_Error_Report_${uploadId.substring(0, 8)}.csv"`
    );
    return res.send(csvContent);
  } catch (err) {
    console.error("Error generating error report download:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to generate error report CSV.",
    });
  }
};

/**
 * Phase 11: POST /api/manufacturer/products/bulk/:uploadId/confirm
 */
export const confirmBulkUpload = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uploadId } = req.params;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: "Upload ID parameter is required.",
      });
    }

    const result = await bulkImportService.confirmBulkUpload(userId, uploadId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in confirmBulkUpload controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to confirm bulk product import.",
    });
  }
};

/**
 * Phase 14: POST /api/manufacturer/products/bulk/:uploadId/images
 */
export const uploadBulkProductImagesZIP = async (req, res) => {
  try {
    const userId = req.user.id;
    const { uploadId } = req.params;
    const file = req.file;

    if (!uploadId) {
      return res.status(400).json({
        success: false,
        message: "Upload ID parameter is required.",
      });
    }

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "No ZIP archive attached. Please attach product-images.zip file.",
      });
    }

    const result = await bulkImportService.uploadBulkProductImagesZIP(
      userId,
      uploadId,
      file.buffer
    );

    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in uploadBulkProductImagesZIP controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to process product images ZIP archive.",
    });
  }
};

/**
 * GET /api/manufacturer/products/bulk/template
 */
export const downloadImportTemplate = async (req, res) => {
  try {
    const format = (req.query.format || "excel").toLowerCase();

    if (format === "csv") {
      const csvContent = generateCSVTemplate();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", 'attachment; filename="CJP_Manufacturer_Product_Import_Template.csv"');
      return res.send(csvContent);
    } else {
      const buffer = generateExcelTemplateBuffer();
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="CJP_Manufacturer_Product_Import_Template.xlsx"');
      return res.send(buffer);
    }
  } catch (err) {
    console.error("Error generating import template download:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate import template download file.",
    });
  }
};
