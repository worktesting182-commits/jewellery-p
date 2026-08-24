import React from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  ChevronRight,
  Gem,
  MapPin,
} from "lucide-react";

export default function OrderCard({ order, onCancelOrder }) {
  if (!order) return null;

  const orderId = order.id || order.order_id;
  const displayId = order.order_number || (orderId ? orderId.substring(0, 10).toUpperCase() : "ORD-000");
  const createdAt = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recent";

  const totalAmount = Number(order.total_amount || order.total || 0);
  const items = order.items || order.order_items || [];
  const status = (order.status || "PENDING").toUpperCase();
  const paymentStatus = (order.payment_status || (order.payment_method === "Cash on Delivery" ? "PENDING" : "PAID")).toUpperCase();
  const isPending = status === "PENDING";

  const getStatusBadge = (statusStr) => {
    switch (statusStr) {
      case "DELIVERED":
        return {
          label: "Delivered",
          icon: CheckCircle2,
          classes: "bg-emerald-100 border-emerald-300 text-emerald-900 font-black",
        };
      case "SHIPPED":
        return {
          label: "In Transit",
          icon: Truck,
          classes: "bg-sky-100 border-sky-300 text-sky-900 font-black",
        };
      case "PROCESSING":
      case "PENDING":
        return {
          label: statusStr === "PENDING" ? "Pending" : "Processing",
          icon: Clock,
          classes: "bg-amber-100 border-amber-300 text-amber-900 font-black",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          icon: XCircle,
          classes: "bg-rose-100 border-rose-300 text-rose-900 font-black",
        };
      default:
        return {
          label: "Pending",
          icon: Package,
          classes: "bg-[#E3C39D]/40 border-[#A68868]/40 text-black font-black",
        };
    }
  };

  const statusConfig = getStatusBadge(status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="rounded-3xl bg-white border border-[#CDD5DB] hover:border-[#A68868] transition-all p-5 sm:p-6 space-y-4 shadow-xs group">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#CDD5DB] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-black/70">Order ID:</span>
            <span className="text-sm font-black text-black tracking-wider">{displayId}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-black/70 font-bold">
            <Calendar className="w-3.5 h-3.5 text-[#A68868]" />
            <span>Date: <strong className="text-black font-black">{createdAt}</strong></span>
          </div>
        </div>

        {/* Badges: Status & Payment Status */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Order Status */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs tracking-wide ${statusConfig.classes}`}
          >
            <StatusIcon className="w-3.5 h-3.5" />
            <span>Status: {statusConfig.label}</span>
          </span>

          {/* Payment Status */}
          <span
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-black ${
              paymentStatus === "PAID"
                ? "bg-emerald-100 border-emerald-300 text-emerald-900"
                : "bg-amber-100 border-amber-300 text-amber-900"
            }`}
          >
            <span>Payment Status: {paymentStatus}</span>
          </span>
        </div>
      </div>

      {/* Items Preview */}
      <div className="space-y-2">
        {items.slice(0, 3).map((item, idx) => {
          const product = item.product || item;
          const imageUrl = item.image || item.image_url || product.image_url || product.image;
          const name = item.name || item.productName || product.name || "Handcrafted Jewellery";
          const qty = item.quantity || 1;
          const price = Number(item.price || item.unitPrice || product.price || 0);

          return (
            <div key={idx} className="flex items-center justify-between gap-3 py-1 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-white border border-[#CDD5DB] flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                  ) : (
                    <Gem className="w-5 h-5 text-[#A68868]" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="font-black text-black truncate block">{name}</span>
                  <span className="text-black/70 text-[11px] font-bold">Qty: {qty}</span>
                </div>
              </div>
              <span className="font-black text-black flex-shrink-0">
                ₹{(price * qty).toLocaleString("en-IN")}
              </span>
            </div>
          );
        })}

        {items.length > 3 && (
          <p className="text-xs font-bold text-black/70 italic pt-1">
            + {items.length - 3} more items in this order
          </p>
        )}
      </div>

      {/* Footer Info & Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#CDD5DB] pt-4">
        <div>
          <span className="text-black/70 text-xs block font-black">Total:</span>
          <span className="text-lg font-black text-black">
            ₹{totalAmount.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Action Buttons: View Details & Cancel (only when Pending) */}
        <div className="flex items-center gap-2">
          {isPending && onCancelOrder && (
            <button
              type="button"
              onClick={() => onCancelOrder(orderId || displayId)}
              className="inline-flex items-center gap-1 px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black transition-all shadow-xs"
            >
              <XCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Cancel Order</span>
            </button>
          )}

          <Link
            to={`/customer/orders/${orderId || displayId}`}
            className="inline-flex items-center gap-1.5 px-4.5 py-2 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white hover:text-white text-xs font-black transition-all shadow-xs"
          >
            <span>View Details</span>
            <ChevronRight className="w-4 h-4 text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}
