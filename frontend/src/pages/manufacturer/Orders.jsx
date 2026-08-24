import React, { useState, useEffect } from "react";
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Calendar,
  CreditCard,
  MapPin,
  RefreshCw,
  Store,
  User,
  Layers,
  Box,
  CheckCheck,
  Play,
  Check,
} from "lucide-react";
import { orderAPI } from "../../services/api";

const STAGES = [
  "PENDING",
  "ACCEPTED",
  "PROCESSING",
  "PACKAGING",
  "READY_FOR_SHIPMENT",
  "SHIPPED",
  "DELIVERED",
];

const ManufacturerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  const [shipModalOrder, setShipModalOrder] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    carrier_name: "BlueDart Express",
    tracking_number: "",
    estimated_delivery_date: "",
  });

  useEffect(() => {
    fetchManufacturerOrders();
  }, []);

  const fetchManufacturerOrders = async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getManufacturerOrders();
      const data = res.data?.orders || res.data?.data || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching manufacturer orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleUpdateStatus = async (orderId, currentStatus, newStatus) => {
    try {
      setUpdatingId(orderId);
      await orderAPI.updateOrderStatus(orderId, newStatus);
      showToast(`Order status updated to ${newStatus}`);
      fetchManufacturerOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      showToast(err.response?.data?.message || "Failed to update order status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openShipModal = (order) => {
    const defaultDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    setShippingForm({
      carrier_name: order.carrier_name || "BlueDart Express",
      tracking_number: order.tracking_number || `BD-${Math.floor(100000 + Math.random() * 900000)}`,
      estimated_delivery_date: order.estimated_delivery_date || defaultDate,
    });
    setShipModalOrder(order);
  };

  const handleConfirmShipment = async (e) => {
    e.preventDefault();
    if (!shipModalOrder) return;
    try {
      setUpdatingId(shipModalOrder.id);
      await orderAPI.updateOrderStatus(shipModalOrder.id, "SHIPPED", shippingForm);
      showToast(`Order dispatched with tracking #${shippingForm.tracking_number}`);
      setShipModalOrder(null);
      fetchManufacturerOrders();
    } catch (err) {
      console.error("Error dispatching order:", err);
      showToast(err.response?.data?.message || "Failed to dispatch order", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStageIndex = (status) => {
    const idx = STAGES.indexOf(String(status).toUpperCase());
    return idx === -1 ? 0 : idx;
  };

  const filteredOrders = orders.filter((o) => {
    const status = (o.order_status || o.status || "PENDING").toUpperCase();
    const matchesSearch =
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      status.toLowerCase().includes(search.toLowerCase()) ||
      o.product_name?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
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

      {/* Dispatch & Logistics Modal */}
      {shipModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setShipModalOrder(null)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white border border-[#CDD5DB] shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#CDD5DB]">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#A68868]" />
                <h3 className="text-base font-black text-black">Dispatch & Ship Order</h3>
              </div>
              <button
                type="button"
                onClick={() => setShipModalOrder(null)}
                className="text-black/60 hover:text-black font-black text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmShipment} className="space-y-4 text-xs font-black">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black/70 mb-1">
                  Logistics Carrier Company
                </label>
                <select
                  value={shippingForm.carrier_name}
                  onChange={(e) => setShippingForm({ ...shippingForm, carrier_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDD5DB] bg-white text-black font-black text-xs focus:outline-none focus:border-[#A68868]"
                >
                  <option value="BlueDart Express">BlueDart Express</option>
                  <option value="Delhivery Gold Logistics">Delhivery Gold Logistics</option>
                  <option value="Sequel Secure Logistics">Sequel Secure Logistics</option>
                  <option value="FedEx Secure Armour">FedEx Secure Armour</option>
                  <option value="Artisan In-House Courier">Artisan In-House Courier</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black/70 mb-1">
                  Air Waybill (AWB) / Tracking Code
                </label>
                <input
                  type="text"
                  required
                  value={shippingForm.tracking_number}
                  onChange={(e) => setShippingForm({ ...shippingForm, tracking_number: e.target.value })}
                  placeholder="e.g. BD-884920"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDD5DB] bg-white text-black font-black text-xs focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-black/70 mb-1">
                  Estimated Delivery Date
                </label>
                <input
                  type="date"
                  required
                  value={shippingForm.estimated_delivery_date}
                  onChange={(e) => setShippingForm({ ...shippingForm, estimated_delivery_date: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#CDD5DB] bg-white text-black font-black text-xs focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShipModalOrder(null)}
                  className="flex-1 py-2.5 rounded-full border border-[#CDD5DB] text-black text-xs font-black hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === shipModalOrder.id}
                  className="flex-1 py-2.5 rounded-full bg-[#A68868] text-white text-xs font-black hover:bg-[#8A6D4F] transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Truck className="w-4 h-4 text-white" /> Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
            <Truck className="w-3.5 h-3.5 text-[#A68868]" /> Order Lifecycle & Fulfillment
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Manufacturer Incoming Orders
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Manage fulfillment progression across the 7 lifecycle stages: PENDING → ACCEPTED → PROCESSING → PACKAGING → READY_FOR_SHIPMENT → SHIPPED → DELIVERED.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order number or status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#CDD5DB]">
        {["ALL", "PENDING", "ACCEPTED", "PROCESSING", "PACKAGING", "READY_FOR_SHIPMENT", "SHIPPED", "DELIVERED", "CANCELLED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === tab
                ? "bg-[#A68868] text-white shadow-xs"
                : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
            }`}
          >
            {tab === "ALL" ? "All Queue" : tab}
          </button>
        ))}
      </div>

      {/* Incoming Orders Queue List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading order queue & lifecycle status...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const currentStatus = (order.order_status || order.status || "PENDING").toUpperCase();
            const orderNum = order.order_number || (order.id?.startsWith("ORD-") ? order.id : `ORD-${order.id?.slice(0, 8)}`);
            const stageIdx = getStageIndex(currentStatus);

            return (
              <div
                key={order.id}
                className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-6 hover:border-[#A68868] transition-all"
              >
                {/* Header: Order Number & Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#CDD5DB]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-black">
                        {orderNum}
                      </span>
                      <span
                        className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                          currentStatus === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                            : currentStatus === "SHIPPED"
                            ? "bg-blue-100 text-blue-900 border-blue-300"
                            : currentStatus === "READY_FOR_SHIPMENT"
                            ? "bg-cyan-100 text-cyan-900 border-cyan-300"
                            : currentStatus === "PACKAGING"
                            ? "bg-purple-100 text-purple-900 border-purple-300"
                            : currentStatus === "PROCESSING"
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : currentStatus === "ACCEPTED"
                            ? "bg-indigo-100 text-indigo-900 border-indigo-300"
                            : currentStatus === "CANCELLED" || currentStatus === "REJECTED"
                            ? "bg-rose-100 text-rose-900 border-rose-300"
                            : "bg-[#E3C39D]/40 text-black border-[#A68868]/40"
                        }`}
                      >
                        {currentStatus}
                      </span>
                    </div>

                    <span className="text-[11px] text-black/70 font-bold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#A68868]" />
                      Ordered on {order.date || new Date(order.created_at || Date.now()).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  {/* Module 10 Sequential Lifecycle Action Controls */}
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Stage 1: PENDING -> ACCEPTED */}
                    {currentStatus === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(order.id, currentStatus, "ACCEPTED")}
                          disabled={updatingId === order.id}
                          className="px-4 py-2 rounded-full bg-[#A68868] text-white hover:bg-[#8A6D4F] text-xs font-black transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-white" /> Accept Order
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, currentStatus, "CANCELLED")}
                          disabled={updatingId === order.id}
                          className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-black border border-rose-200 transition-all cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {/* Stage 2: ACCEPTED -> PROCESSING */}
                    {currentStatus === "ACCEPTED" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, currentStatus, "PROCESSING")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-full bg-amber-100 text-amber-900 hover:bg-amber-200 text-xs font-black border border-amber-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Processing
                      </button>
                    )}

                    {/* Stage 3: PROCESSING -> PACKAGING */}
                    {currentStatus === "PROCESSING" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, currentStatus, "PACKAGING")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-full bg-purple-100 text-purple-900 hover:bg-purple-200 text-xs font-black border border-purple-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Box className="w-3.5 h-3.5" /> Package Item
                      </button>
                    )}

                    {/* Stage 4: PACKAGING -> READY_FOR_SHIPMENT */}
                    {currentStatus === "PACKAGING" && (
                      <button
                        onClick={() => handleUpdateStatus(order.id, currentStatus, "READY_FOR_SHIPMENT")}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-full bg-cyan-100 text-cyan-900 hover:bg-cyan-200 text-xs font-black border border-cyan-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark Ready for Shipment
                      </button>
                    )}

                    {/* Stage 5: READY_FOR_SHIPMENT -> SHIPPED */}
                    {currentStatus === "READY_FOR_SHIPMENT" && (
                      <button
                        onClick={() => openShipModal(order)}
                        disabled={updatingId === order.id}
                        className="px-4 py-2 rounded-full bg-blue-100 text-blue-900 hover:bg-blue-200 text-xs font-black border border-blue-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" /> Dispatch & Ship Order
                      </button>
                    )}

                    {/* Stage 6: SHIPPED -> DELIVERED */}
                    {currentStatus === "SHIPPED" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openShipModal(order)}
                          className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-800 text-[11px] font-black border border-blue-200 hover:bg-blue-100 transition-all"
                        >
                          Edit Tracking
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(order.id, currentStatus, "DELIVERED")}
                          disabled={updatingId === order.id}
                          className="px-4 py-2 rounded-full bg-emerald-100 text-emerald-900 hover:bg-emerald-200 text-xs font-black border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                      </div>
                    )}

                    {/* Final Terminal States */}
                    {currentStatus === "DELIVERED" && (
                      <span className="text-xs text-emerald-800 font-black flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Order Fulfilled & Delivered
                      </span>
                    )}

                    {(currentStatus === "CANCELLED" || currentStatus === "REJECTED") && (
                      <span className="text-xs text-rose-700 font-black flex items-center gap-1">
                        <XCircle className="w-4 h-4 text-rose-600" /> Order Rejected / Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Visual Order Movement Stepper */}
                {currentStatus !== "CANCELLED" && currentStatus !== "REJECTED" && (
                  <div className="py-2 border-y border-[#CDD5DB]/60 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase text-black/60 tracking-wider">
                      <span>Order Fulfillment Movement</span>
                      <span className="text-[#A68868]">Stage {stageIdx + 1} of {STAGES.length}</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {STAGES.map((stg, i) => (
                        <div key={stg} className="space-y-1">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              i <= stageIdx
                                ? "bg-[#A68868]"
                                : "bg-[#CDD5DB]/40"
                            }`}
                          />
                          <p className={`text-[9px] font-black truncate text-center ${i <= stageIdx ? "text-black" : "text-black/40"}`}>
                            {stg.replace(/_/g, " ")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* Retailer */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                    <span className="text-[10px] uppercase text-black/70 font-black flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-[#A68868]" /> Retailer Shop
                    </span>
                    <p className="text-xs font-black text-black">
                      {order.retailer_name || order.retailer?.shop_name || "Aura Partner Retailer"}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                    <span className="text-[10px] uppercase text-black/70 font-black flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-[#A68868]" /> Customer Destination
                    </span>
                    <p className="text-xs text-black font-extrabold line-clamp-1">
                      {order.shipping_address || "Registered Customer Delivery Address"}
                    </p>
                  </div>

                  {/* Product */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                    <span className="text-[10px] uppercase text-black/70 font-black flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-[#A68868]" /> Product Item
                    </span>
                    <p className="text-xs font-black text-black line-clamp-1">
                      {order.product_name || "Handcrafted Jewellery Item"}
                    </p>
                  </div>

                  {/* Quantity & Tracking Info */}
                  <div className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                    <span className="text-[10px] uppercase text-black/70 font-black block">Logistics & Tracking</span>
                    {order.tracking_number ? (
                      <div className="space-y-0.5 text-[11px] font-black text-black">
                        <p className="text-blue-900 font-black truncate">{order.carrier_name || "Express Courier"}</p>
                        <p className="text-black/70 font-bold truncate">AWB: {order.tracking_number}</p>
                      </div>
                    ) : (
                      <p className="text-xs font-black text-black">
                        {order.quantity || order.total_quantity || 1} units ordered
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white rounded-3xl border border-[#CDD5DB]">
              No incoming orders in queue matching selected status.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManufacturerOrders;
