import express from "express";
import multer from "multer";
import {
    createProduct,
    getProducts,
    getMyProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getManufacturerCatalog,
    listRetailerProduct,
    getMyStoreListings,
    uploadProductImage,
} from "../controllers/productController.js";
import {
    validateBulkUpload,
    getBulkUploadPreview,
    downloadBulkUploadErrorReport,
    confirmBulkUpload,
    uploadBulkProductImagesZIP,
    downloadImportTemplate,
} from "../controllers/bulkImportController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { verifyRetailerAccess } from "../middleware/verifyRetailerAccess.js";
import { uploadImportFile } from "../middleware/importUploadMiddleware.js";

const router = express.Router();
const zipUpload = multer({ limits: { fileSize: 50 * 1024 * 1024 } }).single("file"); // 50MB max ZIP file

// GET /api/products - Customer retailer-scoped product listings endpoint
router.get("/", authenticate, verifyRetailerAccess, getProducts);

// GET /api/products/catalog - Retailer view of master wholesale catalog
router.get("/catalog", getManufacturerCatalog);

// GET /api/products/my-store - Retailer store listings
router.get("/my-store", authenticate, getMyStoreListings);

// POST /api/products/retailer-store - Retailers list item in store
router.post("/retailer-store", authenticate, listRetailerProduct);

// POST /api/products/upload-image - Upload image file to Supabase Storage
router.post("/upload-image", authenticate, uploadProductImage);

// GET /api/products/bulk/template - Download bulk import template (.xlsx / .csv)
router.get(
    "/bulk/template",
    authenticate,
    authorize("MANUFACTURER"),
    downloadImportTemplate
);

// POST /api/products/bulk/validate - Validate Bulk Upload Payload
router.post(
    "/bulk/validate",
    authenticate,
    authorize("MANUFACTURER"),
    uploadImportFile,
    validateBulkUpload
);

// GET /api/products/bulk/:uploadId/preview - Phase 9 Preview API Endpoint
router.get(
    "/bulk/:uploadId/preview",
    authenticate,
    authorize("MANUFACTURER"),
    getBulkUploadPreview
);

// GET /api/products/bulk/:uploadId/errors - Phase 10 Error Report CSV Download Endpoint
router.get(
    "/bulk/:uploadId/errors",
    authenticate,
    authorize("MANUFACTURER"),
    downloadBulkUploadErrorReport
);

// POST /api/products/bulk/:uploadId/confirm - Phase 11 Confirm Import Endpoint
router.post(
    "/bulk/:uploadId/confirm",
    authenticate,
    authorize("MANUFACTURER"),
    confirmBulkUpload
);

// POST /api/products/bulk/:uploadId/images - Phase 14 Image ZIP Upload Endpoint
router.post(
    "/bulk/:uploadId/images",
    authenticate,
    authorize("MANUFACTURER"),
    zipUpload,
    uploadBulkProductImagesZIP
);

// GET /api/products/my-products - Manufacturer specific listing
router.get(
    "/my-products",
    authenticate,
    authorize("MANUFACTURER"),
    getMyProducts
);

router.get("/:id", authenticate, verifyRetailerAccess, getProductById);

router.post(
    "/",
    authenticate,
    authorize("MANUFACTURER"),
    createProduct
);

router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;