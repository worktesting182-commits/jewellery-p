import React, { useState, useEffect } from "react";
import {
  Store,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Package,
  Phone,
  Mail,
  MapPin,
  X,
  Globe,
  FileText,
  AlertOctagon,
} from "lucide-react";
import { adminAPI } from "../../services/api";

const AdminRetailers = () => {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewRet, setViewRet] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchRetailers();
  }, [statusFilter]);

  const fetchRetailers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getRetailers({ status: statusFilter });
      const data = res.data?.data || res.data?.retailers || [];
      setRetailers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching retailers:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = async (retId, shopName, newStatus) => {
    try {
      setUpdatingId(retId);
      await adminAPI.updateRetailerStatus(retId, newStatus);
      showToast(`Retailer "${shopName}" status updated to ${newStatus}`);
      fetchRetailers();
    } catch (err) {
      console.error("Error updating retailer status:", err);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredRetailers = retailers.filter((r) => {
    const matchesSearch =
      r.shop_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.owner?.toLowerCase().includes(search.toLowerCase()) ||
      r.gst_number?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || (r.status || "").toUpperCase() === statusFilter;

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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
            <Store className="w-3.5 h-3.5 text-[#A68868]" /> Module 4 – Retail Store Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Retailer Management
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Audit commercial retail store partners, inspect store listings counts, verify business GST credentials, and manage activation or suspension status.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Shop Name, Owner, GST Number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#CDD5DB]">
        <span className="text-[10px] uppercase font-black text-black/70 shrink-0 mr-2">Filter Status:</span>
        {["ALL", "ACTIVE", "SUSPENDED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === tab
                ? "bg-[#A68868] text-white shadow-xs"
                : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
            }`}
          >
            {tab === "ALL" ? "All Retailers" : tab}
          </button>
        ))}
      </div>

      {/* Retailers Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading retail store partners...</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black">
              <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
                <tr>
                  <th className="px-6 py-4">Shop Name</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4 text-center">Listings</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#CDD5DB] font-bold">
                {filteredRetailers.map((ret) => {
                  const statusUpper = (ret.status || "ACTIVE").toUpperCase();

                  return (
                    <tr key={ret.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                      {/* 1. Shop Name */}
                      <td className="px-6 py-4 font-black text-black">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868] font-black shrink-0">
                            <Store className="w-4 h-4 text-[#A68868]" />
                          </div>
                          <div>
                            <span className="block font-black text-black">{ret.shop_name}</span>
                            <span className="block text-[10px] text-black/70 font-mono">GST: {ret.gst_number}</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Owner */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-black flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#A68868]" /> {ret.owner}
                          </span>
                          {ret.email && <span className="block text-[10px] text-black/70 font-bold">{ret.email}</span>}
                        </div>
                      </td>

                      {/* 3. Listings */}
                      <td className="px-6 py-4 text-center">
                        <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black font-black text-xs border border-[#A68868]/40">
                          {ret.listings} store items
                        </span>
                      </td>

                      {/* 4. Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-flex items-center gap-1 ${
                            statusUpper === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                              : "bg-rose-100 text-rose-950 border-rose-300"
                          }`}
                        >
                          {statusUpper === "ACTIVE" ? <ShieldCheck className="w-3 h-3 text-emerald-700" /> : <AlertOctagon className="w-3 h-3 text-rose-600" />}
                          {statusUpper}
                        </span>
                      </td>

                      {/* Actions: View, Activate, Suspend */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Action */}
                          <button
                            onClick={() => setViewRet(ret)}
                            className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="View Retailer Details"
                          >
                            <Eye className="w-4 h-4 text-[#A68868]" />
                          </button>

                          {/* Activate Action */}
                          {statusUpper !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(ret.id, ret.shop_name, "ACTIVE")}
                              disabled={updatingId === ret.id}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 text-xs font-black transition-all"
                            >
                              Activate
                            </button>
                          )}

                          {/* Suspend Action */}
                          {statusUpper === "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(ret.id, ret.shop_name, "SUSPENDED")}
                              disabled={updatingId === ret.id}
                              className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-black transition-all"
                            >
                              Suspend
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredRetailers.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white space-y-2">
              <Store className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No retailers found matching current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View Retailer Details Modal */}
      {viewRet && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868] font-black text-lg">
                  <Store className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">{viewRet.shop_name}</h3>
                  <span className="text-[11px] text-black/70 font-bold">Commercial Retail Store Profile</span>
                </div>
              </div>

              <button
                onClick={() => setViewRet(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Store Owner</span>
                  <span className="font-black text-black block mt-0.5">{viewRet.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">GST Number</span>
                  <span className="font-mono text-black font-black block mt-0.5">{viewRet.gst_number}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Status</span>
                  <span
                    className={`font-black block mt-0.5 ${
                      viewRet.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {viewRet.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div className="flex items-center gap-2 text-black">
                  <Mail className="w-4 h-4 text-[#A68868]" />
                  <span className="font-bold">{viewRet.email || "Email Not Registered"}</span>
                </div>

                <div className="flex items-center gap-2 text-black">
                  <Phone className="w-4 h-4 text-[#A68868]" />
                  <span className="font-bold">{viewRet.phone}</span>
                </div>

                {viewRet.website && (
                  <div className="flex items-center gap-2 text-black">
                    <Globe className="w-4 h-4 text-[#A68868]" />
                    <a href={viewRet.website} target="_blank" rel="noreferrer" className="text-[#A68868] underline font-bold">
                      {viewRet.website}
                    </a>
                  </div>
                )}

                <div className="flex items-start gap-2 text-black/80">
                  <MapPin className="w-4 h-4 text-[#A68868] shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-bold">{viewRet.address}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 space-y-1">
                <span className="text-[10px] uppercase font-black text-black/70 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#A68868]" /> Active Store Inventory
                </span>
                <p className="text-sm font-black text-black">
                  {viewRet.listings} active products listed in retailer shop catalog
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {viewRet.status !== "ACTIVE" ? (
                <button
                  onClick={() => {
                    handleStatusChange(viewRet.id, viewRet.shop_name, "ACTIVE");
                    setViewRet(null);
                  }}
                  className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black hover:bg-emerald-100"
                >
                  Activate Retailer
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleStatusChange(viewRet.id, viewRet.shop_name, "SUSPENDED");
                    setViewRet(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black hover:bg-rose-100"
                >
                  Suspend Retailer
                </button>
              )}

              <button
                onClick={() => setViewRet(null)}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRetailers;
