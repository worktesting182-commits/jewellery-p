import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCheck,
  Trash2,
  Check,
  Search,
  Filter,
  Package,
  AlertTriangle,
  Info,
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  X,
} from "lucide-react";
import { notificationAPI } from "../services/api";

const getNotificationIcon = (type = "") => {
  const t = String(type).toUpperCase();
  if (t.includes("ORDER")) return <Package className="w-5 h-5 text-[#A68868]" />;
  if (t.includes("REGISTRATION") || t.includes("USER"))
    return <UserCheck className="w-5 h-5 text-emerald-700" />;
  if (t.includes("STOCK") || t.includes("WARNING"))
    return <AlertTriangle className="w-5 h-5 text-amber-700" />;
  return <Info className="w-5 h-5 text-blue-700" />;
};

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchNotifications();
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

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      showToast("Notification marked as read");
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      showToast("All notifications marked as read");
    } catch (err) {
      console.error("Error marking all read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      showToast("Notification deleted");
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      const matchesSearch =
        n.title?.toLowerCase().includes(search.toLowerCase()) ||
        n.message?.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === "UNREAD") return !n.is_read;
      if (activeTab === "ORDERS") return String(n.type || n.title).toUpperCase().includes("ORDER");
      if (activeTab === "SYSTEM")
        return (
          String(n.type || n.title).toUpperCase().includes("SYSTEM") ||
          String(n.type || n.title).toUpperCase().includes("REGISTRATION") ||
          String(n.type || n.title).toUpperCase().includes("STOCK")
        );

      return true;
    });
  }, [notifications, search, activeTab]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black font-sans p-4 sm:p-6 lg:p-8 selection:bg-[#E3C39D] selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all font-black text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-black text-[#A68868] hover:text-black transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight flex items-center gap-3">
              Notification History
              {unreadCount > 0 && (
                <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-300 text-xs font-black">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs text-black/70 font-bold">
              Review order updates, partner registrations, inventory alerts, and system notifications.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0"
            >
              <CheckCheck className="w-4 h-4" /> Mark All as Read
            </button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="rounded-3xl bg-white border border-[#CDD5DB] p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search notifications by keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: `All (${notifications.length})` },
                { id: "UNREAD", label: `Unread (${unreadCount})` },
                { id: "ORDERS", label: "Orders" },
                { id: "SYSTEM", label: "System" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-[#A68868] text-white shadow-xs"
                      : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Notification List */}
        {loading ? (
          <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#CDD5DB]">
            <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-black">Loading notification history...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-[#CDD5DB] space-y-3 p-6">
            <Bell className="w-12 h-12 text-[#A68868] mx-auto opacity-40" />
            <h3 className="text-base font-black text-black">No notifications found</h3>
            <p className="text-xs text-black/70 font-bold max-w-sm mx-auto">
              There are no notifications matching your current search or filter criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-3xl border transition-all flex items-start gap-4 ${
                  !item.is_read
                    ? "bg-white border-[#A68868]/60 shadow-md"
                    : "bg-white/80 border-[#CDD5DB] opacity-90 hover:opacity-100"
                }`}
              >
                <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(item.type || item.title)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="text-sm font-black text-black flex items-center gap-2">
                      {item.title || "System Alert"}
                      {!item.is_read && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-[10px] font-black uppercase">
                          New
                        </span>
                      )}
                    </h4>
                    <span className="text-[11px] text-black/70 font-bold font-mono">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleString("en-IN", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Just now"}
                    </span>
                  </div>

                  <p className="text-xs text-black/80 font-bold leading-relaxed">
                    {item.message}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkAsRead(item.id)}
                      className="p-2 rounded-full bg-[#E3C39D]/30 border border-[#A68868]/30 hover:bg-[#A68868] hover:text-white text-black transition-colors"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
