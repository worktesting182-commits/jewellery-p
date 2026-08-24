import express from "express";
import {
  createSip,
  getCustomerSips,
  getSipById,
  updateSip,
  updateSipStatus,
  pauseSip,
  resumeSip,
  cancelSip,
  deleteSip,
  processSipPayment,
  getGoldWallet,
  redeemGoldBalance,
  getGoldPrices,
  getAllSipTransactions,
  getGoldTransactionsLedger,
  getAvailableSchemesForCustomers,
} from "../controllers/goldSipController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Benchmark rate endpoints
router.get("/prices", getGoldPrices);
router.get("/price", getGoldPrices);

// All customer Gold SIP / Wallet / Transactions routes require Customer authentication
router.use(authenticate);
router.use(authorize("CUSTOMER"));

// Available Retailer Schemes for browsing
router.get("/available-schemes", getAvailableSchemesForCustomers);
router.get("/schemes/available", getAvailableSchemesForCustomers);

// Gold Wallet & Ledger endpoints
router.get("/wallet", getGoldWallet);
router.get("/transactions", getAllSipTransactions);
router.get("/gold-transactions", getGoldTransactionsLedger);
router.post("/redeem", redeemGoldBalance);

// Gold SIP / Schemes Subscription endpoints
router.post("/", createSip);
router.get("/", getCustomerSips);
router.get("/:id", getSipById);
router.put("/:id", updateSip);
router.patch("/:id/pause", pauseSip);
router.patch("/:id/resume", resumeSip);
router.patch("/:id/status", updateSipStatus);
router.delete("/:id", deleteSip);
router.delete("/:id/delete", deleteSip);
router.post("/:id/pay", processSipPayment);

export default router;

