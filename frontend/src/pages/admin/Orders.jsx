import React, { useState, useEffect } from "react";
import {
  ShoppingBasket,
  Search,
  Eye,
  Edit2,
  Download,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  XCircle,
  Building2,
  Store,
  User,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  X,
  Sparkles,
  FileSpreadsheet,
} from "lucide-react";
import { adminAPI } from "../../services/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modals
  const [viewOrder, setViewOrder] = useState(null);
  const [updateOrder, setUpdateOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("PROCESSING");
  const [newPaymentStatus, setNewPaymentStatus] = useState("PAID");
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getAdminOrders({ status: statusFilter });
      const data = res.data?.data || res.data?.orders || [];
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching admin orders:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenUpdate = (order) => {
    setUpdateOrder(order);
    setNewStatus(order.order_status || "PROCESSING");
    setNewPaymentStatus(order.payment_status || "PAID");
  };

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!updateOrder) return;

    try {
      setUpdating(true);
      await adminAPI.updateAdminOrderStatus(updateOrder.id, {
        order_status: newStatus,
        payment_status: newPaymentStatus,
      });
      showToast(`Order ${updateOrder.order_number} status updated to ${newStatus}`);
      setUpdateOrder(null);
      fetchOrders();
    } catch (err) {
      console.error("Error updating order status:", err);
      showToast(err.response?.data?.message || "Failed to update order status", "error");
    } finally {
      setUpdating(false);
    }
  };

  // CSV Report Export (Future Enhancement Feature)
  const handleExportCSV = () => {
    if (orders.length === 0) {
      showToast("No orders available to export", "error");
      return;
    }

    const headers = ["Order ID", "Customer", "Retailer", "Manufacturer", "Total Amount (INR)", "Payment Status", "Fulfillment Status", "Date"];
    const rows = orders.map((o) => [
      o.order_number || o.id,
      `"${o.customer || ""}"`,
      `"${o.retailer || ""}"`,
      `"${o.manufacturer || ""}"`,
      o.total,
      o.payment_status,
      o.order_status,
      new Date(o.created_at).toLocaleDateString("en-IN"),
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Platform_Orders_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Platform orders report exported to CSV successfully!");
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.id?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.toLowerCase().includes(search.toLowerCase()) ||
      o.retailer?.toLowerCase().includes(search.toLowerCase()) ||
      o.manufacturer?.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
            <ShoppingBasket className="w-3.5 h-3.5 text-[#A68868]" /> Module 8 – Order Lifecycle Oversight
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Order Management
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Monitor overall platform order throughput, inspect customer-retailer-manufacturer assignments, override status if needed, and export analytical reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Order ID, Customer, Retailer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
            />
          </div>

          {/* Export CSV Report Button */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
            title="Export Orders Report to CSV"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Filters: Status Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#CDD5DB]">
        <span className="text-[10px] uppercase font-black text-black/70 shrink-0 mr-2">Filter Fulfillment:</span>
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

      {/* Orders Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading platform orders...</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black">
              <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
                <tr>
                  <th className="px-6 py-4">Order ID</th>
                  <th className="px-6 py-4">Customer</th>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Payment Status</th>
                  <th className="px-6 py-4">Fulfillment Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#CDD5DB] font-bold">
                {filteredOrders.map((order) => {
                  const statusUpper = (order.fulfillment_status || order.order_status || "PENDING").toUpperCase();
                  const payUpper = (order.payment_status || "PAID").toUpperCase();

                  return (
                    <tr key={order.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                      {/* 1. Order ID */}
                      <td className="px-6 py-4 font-mono font-black text-black">
                        {order.order_number || `ORD-${order.id?.slice(0, 8)}`}
                      </td>

                      {/* 2. Customer */}
                      <td className="px-6 py-4 font-black text-black">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-[#A68868] shrink-0" />
                          <span>{order.customer}</span>
                        </div>
                      </td>

                      {/* 3. Retailer */}
                      <td className="px-6 py-4 font-black text-black">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#A68868] shrink-0" />
                          <span>{order.retailer}</span>
                        </div>
                      </td>

                      {/* 4. Manufacturer */}
                      <td className="px-6 py-4 font-black text-[#A68868]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-[#A68868]" />
                          <span>{order.manufacturer}</span>
                        </div>
                      </td>

                      {/* 5. Total */}
                      <td className="px-6 py-4 font-black text-black font-mono text-sm">
                        ₹{Number(order.total || 0).toLocaleString("en-IN")}
                      </td>

                      {/* 6. Payment Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                            payUpper === "PAID"
                              ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                              : payUpper === "REFUNDED"
                              ? "bg-amber-100 text-amber-950 border-amber-300"
                              : "bg-blue-100 text-blue-950 border-blue-300"
                          }`}
                        >
                          {payUpper}
                        </span>
                      </td>

                      {/* 7. Fulfillment Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-flex items-center gap-1 ${
                            statusUpper === "DELIVERED"
                              ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                              : statusUpper === "SHIPPED"
                              ? "bg-blue-100 text-blue-950 border-blue-300"
                              : statusUpper === "CANCELLED"
                              ? "bg-rose-100 text-rose-950 border-rose-300"
                              : "bg-amber-100 text-amber-950 border-amber-300"
                          }`}
                        >
                          {statusUpper}
                        </span>
                      </td>

                      {/* Actions: View, Update status */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View */}
                          <button
                            onClick={() => setViewOrder(order)}
                            className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="Inspect Order Details"
                          >
                            <Eye className="w-4 h-4 text-[#A68868]" />
                          </button>

                          {/* Update Status (if needed) */}
                          <button
                            onClick={() => handleOpenUpdate(order)}
                            className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="Override Order Status"
                          >
                            <Edit2 className="w-4 h-4 text-[#A68868]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredOrders.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white space-y-2">
              <ShoppingBasket className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No platform orders found matching current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View Order Inspection Modal */}
      {viewOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
                  <ShoppingBasket className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">{viewOrder.order_number}</h3>
                  <span className="text-[11px] text-black/70 font-bold">Platform Order Inspection</span>
                </div>
              </div>

              <button
                onClick={() => setViewOrder(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Customer</span>
                  <span className="font-black text-black block mt-0.5">{viewOrder.customer}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Retailer Store</span>
                  <span className="font-black text-black block mt-0.5">{viewOrder.retailer}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Master Manufacturer</span>
                  <span className="font-black text-[#A68868] block mt-0.5">{viewOrder.manufacturer}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Order Total Amount</span>
                  <span className="font-mono text-xl font-black text-black block mt-0.5">
                    ₹{Number(viewOrder.total || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Fulfillment Status</span>
                  <span className="font-black text-amber-700 block mt-0.5">{viewOrder.fulfillment_status}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-2">
                <span className="text-[10px] uppercase font-black text-black/70 block">Customer Contact & Address</span>
                <p className="text-black font-bold">{viewOrder.customer_email} • {viewOrder.customer_phone}</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewOrder(null)}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Order Status Modal (Admin Override if needed) */}
      {updateOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleStatusSubmit}
            className="w-full max-w-md rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
                  <Edit2 className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Update Order Status</h3>
                  <span className="text-[11px] text-black/70 font-bold">{updateOrder.order_number}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUpdateOrder(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-black">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Fulfillment Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACCEPTED">ACCEPTED</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="PACKAGING">PACKAGING</option>
                  <option value="READY_FOR_SHIPMENT">READY_FOR_SHIPMENT</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Payment Status</label>
                <select
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                >
                  <option value="PAID">PAID</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REFUNDED">REFUNDED</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUpdateOrder(null)}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-black text-xs hover:bg-[#E3C39D]/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {updating ? "Updating..." : "Save Status"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
