import express from "express";
import {
  getDashboardStats,
  getAllUsers,
  updateUser,
  updateUserStatus,
  getAllManufacturers,
  updateManufacturerStatus,
  getAllRetailers,
  updateRetailerStatus,
  getAdminProducts,
  updateProductStatus,
  getAdminListings,
  updateListingStatus,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminReports,
  setAdminGoldPrice,
  getAdminGoldPriceHistory,
  getAdminSips,
  getAdminSipTransactions,
  getAdminGoldTransactions,
  getAdminCustomerGoldBalances,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Apply JWT authentication and Admin role check across all admin routes
router.use(authenticate);
router.use(authorize("ADMIN"));

// Dashboard statistics & charts
router.get("/dashboard", getDashboardStats);
router.get("/stats", getDashboardStats);

// User Management routes
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.put("/users/:id/status", updateUserStatus);

// Manufacturer Management routes
router.get("/manufacturers", getAllManufacturers);
router.put("/manufacturers/:id/status", updateManufacturerStatus);

// Retailer Management routes
router.get("/retailers", getAllRetailers);
router.put("/retailers/:id/status", updateRetailerStatus);

// Manufacturer Products Management routes
router.get("/products", getAdminProducts);
router.put("/products/:id/status", updateProductStatus);

// Retailer Listings Moderation routes
router.get("/listings", getAdminListings);
router.put("/listings/:id/status", updateListingStatus);

// Gold Management routes
router.post("/gold/price", setAdminGoldPrice);
router.get("/gold/price-history", getAdminGoldPriceHistory);
router.get("/gold/sips", getAdminSips);
router.get("/gold/sip-transactions", getAdminSipTransactions);
router.get("/gold/transactions", getAdminGoldTransactions);
router.get("/gold/customer-holdings", getAdminCustomerGoldBalances);

// Platform Orders Management routes
router.get("/orders", getAdminOrders);
router.put("/orders/:id/status", updateAdminOrderStatus);

// Reports & Analytics routes
router.get("/reports", getAdminReports);

export default router;

