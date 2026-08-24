import express from "express";
import {
  getProfile,
  updateProfile,
  getStoreListings,
  getRetailerProductById,
  createListing,
  createCustomProduct,
  updateListing,
  updateRetailerProductStatus,
  deleteListing,
  getStoreOrders,
  getBullionRates,
} from "../controllers/retailerController.js";
import { getManufacturerCatalog } from "../controllers/productController.js";
import {
  createRetailerScheme,
  getRetailerSchemes,
  updateRetailerScheme,
  deleteRetailerScheme,
} from "../controllers/goldSipController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Apply authentication & role authorization to all retailer routes
router.use(authenticate);
router.use(authorize("RETAILER"));

// Profile routes
router.get("/profile", getProfile);
router.put("/profile", updateProfile);

// Store listings & retailer product REST API routes
router.get("/catalog", getManufacturerCatalog);
router.get("/listings", getStoreListings);
router.post("/listings", createListing);
router.put("/listings/:id", updateListing);
router.delete("/listings/:id", deleteListing);
router.patch("/listings/:id/status", updateRetailerProductStatus);

// Retailer Products REST API
router.get("/products", getStoreListings);
router.post("/products", createCustomProduct);
router.get("/products/:id", getRetailerProductById);
router.put("/products/:id", updateListing);
router.delete("/products/:id", deleteListing);
router.patch("/products/:id/status", updateRetailerProductStatus);

router.post("/custom-products", createCustomProduct);
router.get("/bullion-rates", getBullionRates);

// Retailer Store Gold Schemes REST API
router.post("/gold-schemes", createRetailerScheme);
router.get("/gold-schemes", getRetailerSchemes);
router.put("/gold-schemes/:id", updateRetailerScheme);
router.delete("/gold-schemes/:id", deleteRetailerScheme);

// Store orders route
router.get("/orders", getStoreOrders);

export default router;
