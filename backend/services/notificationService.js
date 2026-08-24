import { supabaseAdmin } from "../config/supabase.js";

// In-memory fallback notifications store keyed by userId
const inMemoryNotifications = new Map();

/**
 * Service 1: Create Notification
 * Example message format: "Order #123 has been placed successfully."
 */
export const createNotification = async (userId, { type = "ORDER_PLACED", title = "Order Placed", message, reference_id }) => {
  if (!userId || !message) {
    return null;
  }

  const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const newNotif = {
    id: notificationId,
    user_id: userId,
    type: type,
    title: title,
    message: message,
    reference_id: reference_id || null,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

  const dbPayload = {
    user_id: isUuid ? userId : null,
    title: title,
    message: message,
  };

  if (isUuid) {
    try {
      // Attempt insertion into Supabase `notifications` table
      const { error: dbErr } = await supabaseAdmin
        .from("notifications")
        .insert(dbPayload);

      if (dbErr) {
        console.warn("Supabase notification insert fallback:", dbErr.message);
      }
    } catch (err) {
      console.error("Error creating DB notification:", err);
    }
  }

  // Update in-memory fallback store
  const userNotifs = inMemoryNotifications.get(userId) || [];
  inMemoryNotifications.set(userId, [newNotif, ...userNotifs]);

  return {
    success: true,
    notification: newNotif,
  };
};

/**
 * Service 2: Get Customer Notifications
 */
export const getUserNotifications = async (userId) => {
  // Query DB first
  const { data: dbNotifs, error: dbErr } = await supabaseAdmin
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!dbErr && dbNotifs && dbNotifs.length > 0) {
    return {
      success: true,
      notifications: dbNotifs,
    };
  }

  // Fallback to in-memory store
  const userNotifs = inMemoryNotifications.get(userId) || [];
  return {
    success: true,
    notifications: userNotifs,
  };
};

/**
 * Service 3: Mark Notification as Read
 */
export const markAsRead = async (userId, notificationId) => {
  try {
    await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", userId);
  } catch (err) {
    console.error("Error marking notification read:", err);
  }

  const userNotifs = inMemoryNotifications.get(userId) || [];
  const updated = userNotifs.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n));
  inMemoryNotifications.set(userId, updated);

  return { success: true };
};

/**
 * Service 4: Mark All Notifications as Read for User
 */
export const markAllAsRead = async (userId) => {
  try {
    await supabaseAdmin
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId);
  } catch (err) {
    console.error("Error marking all notifications read:", err);
  }

  const userNotifs = inMemoryNotifications.get(userId) || [];
  const updated = userNotifs.map((n) => ({ ...n, is_read: true }));
  inMemoryNotifications.set(userId, updated);

  return { success: true };
};

/**
 * Service 5: Delete Notification
 */
export const deleteNotification = async (userId, notificationId) => {
  try {
    await supabaseAdmin
      .from("notifications")
      .delete()
      .eq("id", notificationId)
      .eq("user_id", userId);
  } catch (err) {
    console.error("Error deleting notification:", err);
  }

  const userNotifs = inMemoryNotifications.get(userId) || [];
  const updated = userNotifs.filter((n) => n.id !== notificationId);
  inMemoryNotifications.set(userId, updated);

  return { success: true };
};

/**
 * Service 6: Notify Admin Users
 */
export const notifyAdmins = async ({ title, message, type = "SYSTEM_ALERT", reference_id }) => {
  try {
    const { data: adminUsers } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("role", "ADMIN");

    if (adminUsers && adminUsers.length > 0) {
      for (const admin of adminUsers) {
        await createNotification(admin.id, { title, message, type, reference_id });
      }
    } else {
      // Fallback: create notification for system admin key
      await createNotification("system_admin", { title, message, type, reference_id });
    }
  } catch (err) {
    console.error("Error notifying admins:", err);
  }
};

