import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Package,
  ShoppingBag,
  AlertTriangle,
  Info,
  UserCheck,
} from "lucide-react";
import { notificationAPI } from "../../services/api";

const getNotificationIcon = (type = "") => {
  const t = String(type).toUpperCase();
  if (t.includes("ORDER")) return <Package className="w-4 h-4 text-[#A68868]" />;
  if (t.includes("REGISTRATION") || t.includes("USER"))
    return <UserCheck className="w-4 h-4 text-emerald-700" />;
  if (t.includes("STOCK") || t.includes("WARNING"))
    return <AlertTriangle className="w-4 h-4 text-amber-700" />;
  return <Info className="w-4 h-4 text-blue-700" />;
};

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return "Just now";
  const now = new Date();
  const date = new Date(timestamp);
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getNotifications();
      const items = res.data?.notifications || res.data?.data || res.data || [];
      setNotifications(Array.isArray(items) ? items : []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full bg-white border border-[#CDD5DB] hover:bg-[#E3C39D]/30 text-black transition-all shadow-xs flex items-center justify-center cursor-pointer"
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5 text-black" />

        {/* Unread Count Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white border border-[#CDD5DB] shadow-2xl z-50 overflow-hidden animate-fadeIn font-sans">
          {/* Header */}
          <div className="p-4 bg-[#F8F6F2] border-b border-[#CDD5DB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-black text-xs text-black uppercase tracking-wider">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E3C39D] text-black font-black text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] font-black text-[#A68868] hover:text-black transition-colors flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark all read
              </button>
            )}
          </div>

          {/* List Content */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#CDD5DB]/60">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-xs font-bold text-black/70">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center space-y-2 p-4">
                <Bell className="w-8 h-8 text-[#A68868] mx-auto opacity-50" />
                <p className="text-xs font-black text-black">No notifications yet</p>
                <p className="text-[11px] text-black/70 font-bold">
                  Important order updates and alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                  className={`p-4 transition-colors flex items-start gap-3 cursor-pointer ${
                    !n.is_read ? "bg-[#E3C39D]/20 font-bold" : "hover:bg-[#F8F6F2]"
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/30 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(n.type || n.title)}
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black text-black line-clamp-1">
                        {n.title || "Notification"}
                      </span>
                      <span className="text-[10px] text-black/70 font-bold shrink-0">
                        {formatRelativeTime(n.created_at)}
                      </span>
                    </div>

                    <p className="text-[11px] text-black/80 font-semibold line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                  </div>

                  {!n.is_read && (
                    <span
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 mt-2 shadow-xs hover:scale-125 transition-transform"
                      title="Mark as read"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-[#F8F6F2] border-t border-[#CDD5DB] text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-black text-[#A68868] hover:text-black transition-colors inline-flex items-center gap-1.5"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
