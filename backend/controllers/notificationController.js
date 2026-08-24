import * as notificationService from "../services/notificationService.js";

/**
 * GET /api/notifications
 * Get logged-in customer's notifications.
 */
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await notificationService.getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      notifications: result.notifications,
      data: result.notifications,
    });
  } catch (err) {
    console.error("Error in getNotifications controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve notifications",
    });
  }
};

/**
 * PUT / PATCH /api/notifications/:id/read
 * Mark notification as read.
 */
export const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    await notificationService.markAsRead(userId, notifId);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (err) {
    console.error("Error in markNotificationRead controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to update notification",
    });
  }
};

/**
 * PUT / PATCH /api/notifications/read-all
 * Mark all notifications as read for current user.
 */
export const markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllAsRead(userId);

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (err) {
    console.error("Error in markAllNotificationsRead controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to mark all notifications as read",
    });
  }
};

/**
 * DELETE /api/notifications/:id
 * Delete a notification.
 */
export const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifId = req.params.id;

    await notificationService.deleteNotification(userId, notifId);

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (err) {
    console.error("Error in deleteNotification controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to delete notification",
    });
  }
};
