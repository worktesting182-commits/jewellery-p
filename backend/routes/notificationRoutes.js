import express from "express";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protect all notification routes
router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read-all", markAllNotificationsRead);
router.put("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);
router.put("/:id/read", markNotificationRead);
router.delete("/:id", deleteNotification);

export default router;
