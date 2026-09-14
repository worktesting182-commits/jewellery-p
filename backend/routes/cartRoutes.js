import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "../controllers/cartController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { verifyRetailerAccess } from "../middleware/verifyRetailerAccess.js";

const router = express.Router();

// Protect all customer cart endpoints with Authentication & Multi-Tenant Retailer Authorization
router.use(authenticate);
router.use(verifyRetailerAccess);

router.get("/", getCart);
router.post("/", addToCart);
router.put("/:id", updateCartItem);
router.delete("/:id", removeCartItem);
router.delete("/", clearCart);

export default router;
