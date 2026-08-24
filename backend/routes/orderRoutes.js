import express from "express";
import { createOrder, getOrders, getOrderById, cancelOrder, updateOrderStatus, getManufacturerOrders } from "../controllers/orderController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all order routes for authenticated users
router.use(authenticate);

// Manufacturer order routes (MUST be defined before /:id)
router.get("/manufacturer", getManufacturerOrders);
router.get("/manufacturer/orders", getManufacturerOrders);
router.put("/manufacturer/orders/:id", updateOrderStatus);
router.get("/orders", getManufacturerOrders); // Support mounting under /api/manufacturer
router.put("/orders/:id", updateOrderStatus); // Support mounting under /api/manufacturer

// Customer order routes
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);
router.put("/:id/status", updateOrderStatus);

export default router;
