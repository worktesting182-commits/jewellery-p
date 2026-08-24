import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingBag, Search, Gem } from "lucide-react";
import OrderCard from "../../components/customer/OrderCard";
import { orderAPI } from "../../services/api";

export default function CustomerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Check localStorage saved orders first
      const localSaved = localStorage.getItem("aura_orders");
      let combinedOrders = localSaved ? JSON.parse(localSaved) : [];

      // Fetch orders from backend orderAPI
      try {
        const res = await orderAPI.getOrders();
        const apiOrders = res.data?.orders || res.data?.data || [];
        if (Array.isArray(apiOrders) && apiOrders.length > 0) {
          const existingIds = new Set(combinedOrders.map((o) => o.id || o.order_number));
          const newFromApi = apiOrders.filter((o) => !existingIds.has(o.id || o.order_number));
          combinedOrders = [...newFromApi, ...combinedOrders];
        }
      } catch (apiErr) {
        console.warn("Backend orderAPI.getOrders warning, using local history:", apiErr);
      }

      setOrders(combinedOrders);
    } catch (err) {
      console.error("Error fetching order history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderIdToCancel) => {
    if (!orderIdToCancel) return;
    if (window.confirm("Are you sure you want to cancel this order?")) {
      try {
        await orderAPI.cancelOrder(orderIdToCancel);
      } catch (err) {
        console.warn("Backend cancelOrder warning, applying local cancellation:", err);
      }

      const updatedOrders = orders.map((ord) => {
        const currentId = ord.id || ord.order_number;
        if (currentId === orderIdToCancel) {
          return { ...ord, status: "CANCELLED" };
        }
        return ord;
      });

      setOrders(updatedOrders);
      localStorage.setItem("aura_orders", JSON.stringify(updatedOrders));
    }
  };

  const filteredOrders = orders.filter((order) => {
    const status = (order.status || "PENDING").toUpperCase();
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "PROCESSING" && (status === "PROCESSING" || status === "PAID" || status === "PENDING")) ||
      (activeTab === "SHIPPED" && status === "SHIPPED") ||
      (activeTab === "DELIVERED" && status === "DELIVERED") ||
      (activeTab === "CANCELLED" && status === "CANCELLED");

    const orderIdStr = (order.id || order.order_number || "").toLowerCase();
    const matchesSearch =
      !searchQuery ||
      orderIdStr.includes(searchQuery.toLowerCase()) ||
      order.items?.some((i) => (i.name || i.product?.name || "").toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTab && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#CDD5DB] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-black flex items-center gap-3">
            <Package className="w-7 h-7 text-[#A68868]" /> My Order History
          </h1>
          <p className="text-xs font-bold text-black/80 mt-1">
            Track, view invoice details, and manage your handcrafted jewellery orders
          </p>
        </div>

        <Link
          to="/customer/products"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black text-xs font-black transition-all shadow-xs"
        >
          <ShoppingBag className="w-4 h-4 text-[#A68868]" /> Continue Shopping
        </Link>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-white p-1.5 rounded-full border border-[#CDD5DB] overflow-x-auto shadow-xs">
          {[
            { id: "ALL", label: "All Orders" },
            { id: "PROCESSING", label: "Processing" },
            { id: "SHIPPED", label: "In Transit" },
            { id: "DELIVERED", label: "Delivered" },
            { id: "CANCELLED", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-[#A68868] text-white border border-[#A68868]"
                  : "text-black hover:bg-[#E3C39D]/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Quick Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order ID or item..."
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] shadow-xs"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-black font-black uppercase tracking-wider">
            Fetching order records...
          </p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white border border-[#CDD5DB] space-y-4 max-w-md mx-auto shadow-xs">
          <Package className="w-12 h-12 text-[#A68868] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-base font-black text-black">No Orders Found</h3>
            <p className="text-xs font-bold text-black/80">
              {searchQuery
                ? "No orders match your search query."
                : "You have not placed any orders under this filter status yet."}
            </p>
          </div>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black shadow-xs transition-all"
          >
            <Gem className="w-4 h-4 text-white" /> Browse Collection
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id || order.order_number}
              order={order}
              onCancelOrder={handleCancelOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
}
