import express from "express";
import * as retailerAccessController from "../controllers/retailerAccessController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. Public Endpoints (Pre-auth retailer code validation)
router.post("/validate", retailerAccessController.validateRetailerCode);
router.post("/validate-code", retailerAccessController.validateRetailerCode);

// 2. Authenticated Customer Endpoints (Handles root path / when mounted under /api/customer/retailers)
router.get("/", authenticate, retailerAccessController.getMyRetailers);
router.get("/my-stores", authenticate, retailerAccessController.getMyRetailers);
router.get("/retailers", authenticate, retailerAccessController.getMyRetailers);
router.post("/join", authenticate, retailerAccessController.joinRetailer);

router.get("/membership/:retailerId", authenticate, retailerAccessController.getRetailerMembership);
router.get("/retailers/:retailerId", authenticate, retailerAccessController.getRetailerMembership);

router.delete("/leave/:retailerId", authenticate, retailerAccessController.leaveRetailer);
router.delete("/retailers/:retailerId", authenticate, retailerAccessController.leaveRetailer);
router.delete("/:retailerId", authenticate, retailerAccessController.leaveRetailer);

export default router;
