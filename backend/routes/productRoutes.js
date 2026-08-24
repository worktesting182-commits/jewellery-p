import express from "express";
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
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// GET /api/products - Open customer marketplace endpoint
router.get("/", getProducts);

// GET /api/products/catalog - Retailer view of master wholesale catalog
router.get("/catalog", getManufacturerCatalog);

// GET /api/products/my-store - Retailer store listings
router.get("/my-store", authenticate, getMyStoreListings);

// POST /api/products/retailer-store - Retailers list item in store
router.post("/retailer-store", authenticate, listRetailerProduct);

// POST /api/products/upload-image - Upload image file to Supabase Storage
router.post("/upload-image", authenticate, uploadProductImage);

// GET /api/products/my-products - Manufacturer specific listing
router.get(
    "/my-products",
    authenticate,
    authorize("MANUFACTURER"),
    getMyProducts
);

router.get("/:id", getProductById);

router.post(
    "/",
    authenticate,
    authorize("MANUFACTURER"),
    createProduct
);

router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;