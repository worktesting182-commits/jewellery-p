import React, { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  CreditCard,
  ArrowLeft,
  Download,
  Gem,
  Calendar,
  ShieldCheck,
  Sparkles,
  Check,
  Play,
  Box,
  CheckCheck,
} from "lucide-react";
import { orderAPI } from "../../services/api";

export default function CustomerOrderDetails() {
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const isJustPlaced = location.state?.orderPlaced;

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      let foundOrder = null;

      // 1. Fetch from backend orderAPI
      try {
        const res = await orderAPI.getOrderById(id);
        foundOrder = res.data?.order || res.data?.data;
      } catch (apiErr) {
        console.warn("Backend order details fetch warning, checking local storage:", apiErr);
      }

      // 2. Fallback to local storage if backend call returned null
      if (!foundOrder) {
        const localOrders = JSON.parse(localStorage.getItem("aura_orders") || "[]");
        foundOrder = localOrders.find((o) => o.id === id || o.order_number === id);
      }

      setOrder(foundOrder);
    } catch (err) {
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#8EB69B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-[#8EB69B] font-semibold uppercase tracking-wider">
          Loading order details...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <Package className="w-12 h-12 text-[#8EB69B]/40 mx-auto" />
        <h2 className="text-xl font-bold text-[#DAF1DE]">Order Not Found</h2>
        <p className="text-xs text-[#8EB69B]/70">We couldn't find an order matching reference #{id}.</p>
        <Link
          to="/customer/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#163832] text-[#DAF1DE] border border-[#8EB69B]/30 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Orders List
        </Link>
      </div>
    );
  }

  const status = (order.order_status || order.status || "PENDING").toUpperCase();
  const createdAt = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recent";

  const items = order.items || order.order_items || [];
  const subtotal = order.subtotal || items.reduce((acc, curr) => acc + Number(curr.price || 0) * (curr.quantity || 1), 0);
  const tax = order.tax || Math.round(subtotal * 0.03);
  const totalAmount = Number(order.total_amount || subtotal + tax);

  // Module 10 Full 7-Stage Order Lifecycle Progression
  const lifecycleOrder = ["PENDING", "ACCEPTED", "PROCESSING", "PACKAGING", "READY_FOR_SHIPMENT", "SHIPPED", "DELIVERED"];
  const currentIdx = status === "CANCELLED" ? -1 : lifecycleOrder.indexOf(status);

  const steps = [
    { label: "Order Placed", statusKey: "PENDING", icon: CheckCircle2 },
    { label: "Accepted", statusKey: "ACCEPTED", icon: Check },
    { label: "In Production", statusKey: "PROCESSING", icon: Play },
    { label: "Packaging", statusKey: "PACKAGING", icon: Box },
    { label: "Ready to Ship", statusKey: "READY_FOR_SHIPMENT", icon: CheckCheck },
    { label: "In Transit", statusKey: "SHIPPED", icon: Truck },
    { label: "Delivered", statusKey: "DELIVERED", icon: Package },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Just Placed Success Banner */}
      {isJustPlaced && (
        <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-emerald-950">Order Placed Successfully!</h2>
              <p className="text-xs font-bold text-emerald-900">
                Thank you for your purchase. Order #{order.order_number || order.id} has been registered and sent to manufacturer.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#CDD5DB] pb-6">
        <div>
          <Link
            to="/customer/orders"
            className="inline-flex items-center gap-1.5 text-xs text-[#A68868] hover:text-black font-extrabold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-black">
              Order #{order.order_number || order.id}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                status === "DELIVERED"
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : status === "CANCELLED"
                  ? "bg-rose-100 text-rose-900 border-rose-300"
                  : "bg-amber-100 text-amber-900 border-amber-300"
              }`}
            >
              {status}
            </span>
          </div>
          <p className="text-xs font-bold text-black/80 mt-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#A68868]" /> Placed on {createdAt}
          </p>
        </div>

        <button
          onClick={() => alert("Invoice PDF generation simulated.")}
          className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black text-xs font-black transition-all shadow-xs"
        >
          <Download className="w-4 h-4 text-[#A68868]" /> Download Invoice
        </button>
      </div>

      {/* Module 10 Order Lifecycle Progress Tracker */}
      <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] space-y-6 shadow-xs">
        <h2 className="text-sm font-black text-black flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#A68868]" /> Order Lifecycle Progress Tracker
        </h2>

        {status === "CANCELLED" ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-black">
            <CheckCircle2 className="w-4 h-4 text-rose-600 rotate-45 shrink-0" />
            <span>This order was cancelled while in PENDING status.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isCompleted = currentIdx >= idx;
              const isCurrent = currentIdx === idx;

              return (
                <div
                  key={step.statusKey}
                  className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                    isCurrent
                      ? "bg-[#A68868] border-[#A68868] text-white shadow-xs scale-105"
                      : isCompleted
                      ? "bg-[#E3C39D]/30 border-[#CDD5DB] text-black font-black"
                      : "bg-white border-[#CDD5DB] text-black/40 font-bold"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs ${
                      isCurrent
                        ? "border-white bg-white/20 text-white"
                        : isCompleted
                        ? "border-[#A68868] bg-[#A68868] text-white"
                        : "border-black/30 text-black/50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="block text-[10px] font-black leading-tight">{step.label}</span>
                    <span className="block text-[9px] font-bold opacity-75 mt-0.5">
                      {isCompleted ? "Done" : isCurrent ? "Active" : "Wait"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Details & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Itemized List */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] space-y-4 shadow-xs">
            <h2 className="text-base font-black text-black flex items-center gap-2 border-b border-[#CDD5DB] pb-3">
              <Gem className="w-5 h-5 text-[#A68868]" /> Itemized Products ({items.length})
            </h2>

            <div className="divide-y divide-[#CDD5DB]">
              {items.map((item, index) => {
                const name = item.name || item.product?.name || "Certified Fine Jewellery";
                const imageUrl = item.image_url || item.product?.image_url;
                const price = Number(item.price || item.product?.price || 0);
                const qty = item.quantity || 1;

                return (
                  <div key={index} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-14 h-14 rounded-xl bg-white border border-[#CDD5DB] overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {imageUrl ? (
                          <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                        ) : (
                          <Gem className="w-6 h-6 text-[#A68868]" />
                        )}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <span className="font-black text-sm text-black truncate block">
                          {name}
                        </span>
                        <p className="text-xs font-bold text-black/70">
                          Unit Price: ₹{price.toLocaleString("en-IN")} × {qty}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-sm font-black text-black">
                        ₹{(price * qty).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Payment Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-3xl bg-white border border-[#CDD5DB] space-y-2 shadow-xs">
              <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#A68868]" /> Delivery Address
              </h3>
              <p className="text-xs text-black font-extrabold leading-relaxed pt-1">
                {order.shipping_address || order.shippingAddress || "Customer Delivery Address Provided"}
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-[#CDD5DB] space-y-2 shadow-xs">
              <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-[#A68868]" /> Payment & Order Status
              </h3>
              <div className="text-xs space-y-1.5 pt-1">
                <p className="text-black font-extrabold">
                  Payment Method: <span className="font-black text-[#A68868]">{order.payment_method || "Simulated Online Payment"}</span>
                </p>
                <p className="text-black font-extrabold flex items-center gap-1">
                  Payment Status:{" "}
                  <span
                    className={`font-black px-2.5 py-0.5 rounded-full border text-[11px] ${
                      (order.payment_status || "PAID").toUpperCase() === "PAID"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                        : "bg-amber-100 border-amber-300 text-amber-900"
                    }`}
                  >
                    {(order.payment_status || (order.payment_method === "Cash on Delivery" ? "PENDING" : "PAID")).toUpperCase()}
                  </span>
                </p>
                <p className="text-black font-extrabold flex items-center gap-1">
                  Order Status:{" "}
                  <span className="font-black px-2.5 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px]">
                    {status}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] space-y-4 shadow-xs">
            <h2 className="text-base font-black text-black border-b border-[#CDD5DB] pb-3">
              Order Summary & Total
            </h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between text-black/80 font-bold">
                <span>Items Subtotal</span>
                <span className="font-black text-black">₹{subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-black/80 font-bold">
                <span>GST (3%)</span>
                <span className="font-black text-black">₹{tax.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-black/80 font-bold">
                <span>Insured Courier Shipping</span>
                <span className="font-black text-emerald-700">FREE</span>
              </div>
            </div>

            <div className="border-t border-[#CDD5DB] pt-3 flex justify-between items-baseline">
              <span className="text-sm font-black text-black">Total</span>
              <span className="text-xl font-black text-black">
                ₹{totalAmount.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-[#CDD5DB]/30 border border-[#CDD5DB] text-[11px] font-bold text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A68868] flex-shrink-0" />
              <span>Verified Eco-score certification included with invoice</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
