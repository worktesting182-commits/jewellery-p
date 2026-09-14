import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import { verifyRetailerAccess } from "../middleware/verifyRetailerAccess.js";
import { getProducts } from "../controllers/productController.js";
import { getCart, addToCart, updateCartItem, removeCartItem } from "../controllers/cartController.js";
import { createOrder } from "../controllers/orderController.js";

const router = express.Router({ mergeParams: true });

// ALL routes pass through Authentication + Multi-Tenant Membership Authorization
router.use(authenticate);
router.use(verifyRetailerAccess);

// ------------------------------------------------------------
// 1. Retailer-Scoped Storefront Endpoints
// ------------------------------------------------------------
router.get("/store", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Retailer storefront retrieved",
    retailer: req.retailer,
    membership: req.membership,
  });
});

router.get("/products", getProducts);

// ------------------------------------------------------------
// 2. Retailer-Scoped Cart Endpoints
// ------------------------------------------------------------
router.get("/cart", getCart);
router.post("/cart/items", addToCart);
router.patch("/cart/items/:id", updateCartItem);
router.put("/cart/items/:id", updateCartItem);
router.delete("/cart/items/:id", removeCartItem);

// ------------------------------------------------------------
// 3. Retailer-Scoped Checkout Endpoint
// ------------------------------------------------------------
router.post("/checkout", createOrder);

export default router;
