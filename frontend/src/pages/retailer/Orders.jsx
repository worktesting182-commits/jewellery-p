import React, { useState, useEffect } from "react";
import {
  ShoppingBasket,
  Search,
  Package,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  Clock,
  User,
  ShieldCheck,
  Building2,
  Lock,
  Eye,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
} from "lucide-react";
import { retailerAPI } from "../../services/api";

const RetailerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await retailerAPI.getOrders();
      const data = res.data?.data || res.data?.orders || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching retailer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Module 10 Full 7-Stage Order Lifecycle Status Steps
  const statusSteps = [
    { label: "Order Placed", key: "PENDING" },
    { label: "Accepted", key: "ACCEPTED" },
    { label: "In Production", key: "PROCESSING" },
    { label: "Packaging", key: "PACKAGING" },
    { label: "Ready to Ship", key: "READY_FOR_SHIPMENT" },
    { label: "Shipped", key: "SHIPPED" },
    { label: "Delivered", key: "DELIVERED" },
  ];

  const getStepIndex = (status) => {
    const s = (status || "").toUpperCase();
    if (s === "PENDING") return 0;
    if (s === "ACCEPTED") return 1;
    if (s === "PROCESSING") return 2;
    if (s === "PACKAGING") return 3;
    if (s === "READY_FOR_SHIPMENT") return 4;
    if (s === "SHIPPED") return 5;
    if (s === "DELIVERED") return 6;
    if (s === "CANCELLED") return -1;
    return 0;
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.manufacturer_name?.toLowerCase().includes(search.toLowerCase()) ||
      o.order_status?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (o.order_status || o.status || "").toUpperCase() === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
            <ShoppingBasket className="w-3.5 h-3.5 text-[#A68868]" /> Retailer Store Fulfillment
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Orders Through My Store
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Monitor real-time customer purchases, manufacturer production, and fulfillment progress.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Customer, Manufacturer, Product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>

      {/* Read-Only Restriction Callout Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs flex items-start gap-3 text-xs text-black font-bold">
        <div className="p-2 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868] shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-black text-black block flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-[#A68868]" /> Read-Only Manufacturing Monitor Mode
          </span>
          <p className="text-black/70 font-bold leading-relaxed">
            As a Retailer, you monitor fulfillment progress in real-time. Manufacturing and shipment statuses are updated exclusively by the artisan manufacturer. Retailers cannot modify manufacturing status.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#CDD5DB]">
        {["ALL", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === tab
                ? "bg-[#A68868] text-white shadow-xs"
                : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
            }`}
          >
            {tab === "ALL" ? "All Orders" : tab}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading store orders & fulfillment progress...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const currentStatus = (order.order_status || order.status || "PENDING").toUpperCase();
            const stepIdx = getStepIndex(currentStatus);
            const isCancelled = currentStatus === "CANCELLED";

            return (
              <div
                key={order.id}
                className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-6 hover:border-[#A68868] transition-all"
              >
                {/* Order Top Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CDD5DB]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-black tracking-tight">
                        {order.order_number || `ORD-${order.id?.slice(0, 8)}`}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-black border uppercase ${
                          isCancelled
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : currentStatus === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                            : currentStatus === "SHIPPED"
                            ? "bg-blue-100 text-blue-950 border-blue-300"
                            : currentStatus === "PROCESSING"
                            ? "bg-amber-100 text-amber-950 border-amber-300"
                            : "bg-[#E3C39D]/40 text-black border-[#A68868]/40"
                        }`}
                      >
                        Fulfillment: {currentStatus}
                      </span>
                    </div>
                    <span className="text-[11px] text-black/70 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A68868]" />
                      Placed on {new Date(order.created_at || Date.now()).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[11px] text-black/70 font-black block">Order Total</span>
                      <span className="text-2xl font-black text-black">
                        ₹{Number(order.total_amount || order.total || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Fulfillment Status Progress Tracker (Read-Only Progress Monitoring) */}
                <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-3 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-black font-black flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#A68868]" /> Manufacturing & Fulfillment Tracker
                    </span>
                    <span className="text-[10px] text-black/70 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#A68868]" /> Read-Only Progress Monitor
                    </span>
                  </div>

                  {isCancelled ? (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-black flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>This customer order was cancelled. Manufacturing production halted.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                      {statusSteps.map((step, idx) => {
                        const isCompleted = stepIdx > idx;
                        const isCurrent = stepIdx === idx;
                        return (
                          <div
                            key={step.key}
                            className={`p-2.5 rounded-2xl border flex items-center gap-2 transition-all font-black ${
                              isCurrent
                                ? "bg-[#A68868] text-white border-[#A68868] shadow-xs"
                                : isCompleted
                                ? "bg-[#E3C39D]/30 border-[#A68868]/40 text-black"
                                : "bg-white border-[#CDD5DB] text-black/40"
                            }`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-[#A68868] shrink-0" />
                            ) : isCurrent ? (
                              <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded-full border border-current shrink-0" />
                            )}
                            <div className="overflow-hidden">
                              <span className="text-[10px] font-black block truncate">{step.label}</span>
                              <span className="text-[9px] block opacity-90 font-bold">
                                {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Pending"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 5 Mandatory Section Grid: Customer, Manufacturer, Product, Total, Fulfillment Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1 & 2: Products & Manufacturer Details */}
                  <div className="md:col-span-2 space-y-4">
                    <span className="text-xs uppercase font-black text-black tracking-wider flex items-center gap-1.5">
                      <Package className="w-4 h-4 text-[#A68868]" /> Ordered Products & Manufacturers
                    </span>

                    <div className="space-y-3">
                      {(order.items && order.items.length > 0 ? order.items : [
                        {
                          product_name: order.product_name || "Handcrafted Jewellery",
                          manufacturer_name: order.manufacturer_name || "Master Artisan",
                          quantity: 1,
                          price: order.total_amount || 0,
                          subtotal: order.total_amount || 0,
                          image_url: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
                        }
                      ]).map((item, idx) => (
                        <div
                          key={item.id || idx}
                          className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                        >
                          <div className="flex items-center gap-3.5">
                            <img
                              src={item.image_url || item.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600"}
                              alt={item.product_name}
                              className="w-14 h-14 rounded-2xl object-cover border border-[#CDD5DB] bg-white"
                            />
                            <div>
                              <h4 className="text-xs font-black text-black leading-snug">
                                {item.product_name || item.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="px-2.5 py-0.5 rounded-full bg-[#E3C39D]/30 text-black text-[10px] font-black border border-[#A68868]/30 inline-flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-[#A68868]" />
                                  Manufacturer: {item.manufacturer_name || item.manufacturer || "Master Artisan"}
                                </span>
                                <span className="text-[10px] text-black/70 font-bold">
                                  Qty: {item.quantity} × ₹{Number(item.price || 0).toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right sm:border-l border-[#CDD5DB] sm:pl-4">
                            <span className="text-[10px] text-black/70 font-black block">Item Total</span>
                            <span className="text-sm font-black text-black">
                              ₹{Number(item.subtotal || (item.price * item.quantity) || 0).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: Customer Information & Delivery Details */}
                  <div className="space-y-4">
                    <span className="text-xs uppercase font-black text-black tracking-wider flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#A68868]" /> Customer Information
                    </span>

                    <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-3 text-xs shadow-xs">
                      <div className="flex items-center gap-2.5 pb-2.5 border-b border-[#CDD5DB]">
                        <div className="w-8 h-8 rounded-full bg-[#A68868] text-white flex items-center justify-center shrink-0 font-black text-xs">
                          {(order.customer?.name || order.customer_name || "C")[0]}
                        </div>
                        <div className="overflow-hidden">
                          <span className="font-black text-black block truncate">
                            {order.customer?.name || order.customer_name || "Valued Customer"}
                          </span>
                          <span className="text-[10px] text-black/70 font-bold block">Store Customer</span>
                        </div>
                      </div>

                      {order.customer?.email && (
                        <div className="flex items-center gap-2 text-black/80 font-bold text-[11px]">
                          <Mail className="w-3.5 h-3.5 text-[#A68868]" />
                          <span className="truncate">{order.customer.email}</span>
                        </div>
                      )}

                      {order.customer?.phone && (
                        <div className="flex items-center gap-2 text-black/80 font-bold text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-[#A68868]" />
                          <span>{order.customer.phone}</span>
                        </div>
                      )}

                      <div className="pt-2 border-t border-[#CDD5DB] space-y-1">
                        <span className="text-[10px] uppercase font-black text-black/70 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#A68868]" /> Delivery Address
                        </span>
                        <p className="text-[11px] text-black font-extrabold leading-relaxed bg-[#CDD5DB]/20 p-2.5 rounded-2xl border border-[#CDD5DB]">
                          {order.shipping_address || order.customer?.address || "Address specified during checkout"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="py-20 text-center text-xs font-bold text-black/70 bg-white rounded-3xl border border-[#CDD5DB] space-y-3">
              <ShoppingBasket className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-sm text-black">No store orders found matching criteria.</p>
              <p className="text-xs text-black/70 font-bold max-w-sm mx-auto">
                Customer purchases made through your store listings will appear here automatically for order tracking.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RetailerOrders;
