import React, { useState, useEffect } from "react";
import {
  Building2,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  User,
  FileText,
  Package,
  Phone,
  Mail,
  MapPin,
  X,
  AlertOctagon,
} from "lucide-react";
import { adminAPI } from "../../services/api";

const AdminManufacturers = () => {
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMfg, setViewMfg] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchManufacturers();
  }, [statusFilter]);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getManufacturers({ status: statusFilter });
      const data = res.data?.data || res.data?.manufacturers || [];
      setManufacturers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching manufacturers:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleStatusChange = async (mfgId, companyName, newStatus) => {
    try {
      setUpdatingId(mfgId);
      await adminAPI.updateManufacturerStatus(mfgId, newStatus);
      showToast(`Manufacturer "${companyName}" status updated to ${newStatus}`);
      fetchManufacturers();
    } catch (err) {
      console.error("Error updating manufacturer status:", err);
      showToast(err.response?.data?.message || "Failed to update status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredManufacturers = manufacturers.filter((m) => {
    const matchesSearch =
      m.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      m.owner?.toLowerCase().includes(search.toLowerCase()) ||
      m.registration_number?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || (m.status || "").toUpperCase() === statusFilter;

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
            <Building2 className="w-3.5 h-3.5 text-[#A68868]" /> Module 3 – Master Artisan Audit & Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Manufacturer Management
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Audit artisan jewellery manufacturers, inspect company registration numbers, verify master products count, and manage activation or suspension status.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Company, Owner, Reg Number..."
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
            {tab === "ALL" ? "All Manufacturers" : tab}
          </button>
        ))}
      </div>

      {/* Manufacturers Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading artisan manufacturers...</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black">
              <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
                <tr>
                  <th className="px-6 py-4">Company Name</th>
                  <th className="px-6 py-4">Owner</th>
                  <th className="px-6 py-4">Registration Number</th>
                  <th className="px-6 py-4 text-center">Products</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#CDD5DB] font-bold">
                {filteredManufacturers.map((mfg) => {
                  const statusUpper = (mfg.status || "ACTIVE").toUpperCase();

                  return (
                    <tr key={mfg.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                      {/* 1. Company Name */}
                      <td className="px-6 py-4 font-black text-black">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868] font-black shrink-0">
                            <Building2 className="w-4 h-4 text-[#A68868]" />
                          </div>
                          <div>
                            <span className="block font-black text-black">{mfg.company_name}</span>
                            <span className="block text-[10px] text-black/70 font-mono">ID: {mfg.id?.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Owner */}
                      <td className="px-6 py-4">
                        <div className="space-y-0.5">
                          <span className="font-black text-black flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#A68868]" /> {mfg.owner}
                          </span>
                          {mfg.email && <span className="block text-[10px] text-black/70 font-bold">{mfg.email}</span>}
                        </div>
                      </td>

                      {/* 3. Registration Number */}
                      <td className="px-6 py-4 font-mono text-black font-black">
                        {mfg.registration_number}
                      </td>

                      {/* 4. Products */}
                      <td className="px-6 py-4 text-center">
                        <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black font-black text-xs border border-[#A68868]/40">
                          {mfg.products} catalog items
                        </span>
                      </td>

                      {/* 5. Status */}
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
                            onClick={() => setViewMfg(mfg)}
                            className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="View Manufacturer Details"
                          >
                            <Eye className="w-4 h-4 text-[#A68868]" />
                          </button>

                          {/* Activate Action */}
                          {statusUpper !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(mfg.id, mfg.company_name, "ACTIVE")}
                              disabled={updatingId === mfg.id}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 text-xs font-black transition-all"
                            >
                              Activate
                            </button>
                          )}

                          {/* Suspend Action */}
                          {statusUpper === "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(mfg.id, mfg.company_name, "SUSPENDED")}
                              disabled={updatingId === mfg.id}
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

          {filteredManufacturers.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white space-y-2">
              <Building2 className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No manufacturers found matching current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View Manufacturer Details Modal */}
      {viewMfg && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868] font-black text-lg">
                  <Building2 className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">{viewMfg.company_name}</h3>
                  <span className="text-[11px] text-black/70 font-bold">Master Artisan Enterprise Profile</span>
                </div>
              </div>

              <button
                onClick={() => setViewMfg(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Owner / Master Artisan</span>
                  <span className="font-black text-black block mt-0.5">{viewMfg.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Registration / GST</span>
                  <span className="font-mono text-black font-black block mt-0.5">{viewMfg.registration_number}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Status</span>
                  <span
                    className={`font-black block mt-0.5 ${
                      viewMfg.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {viewMfg.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div className="flex items-center gap-2 text-black">
                  <Mail className="w-4 h-4 text-[#A68868]" />
                  <span className="font-bold">{viewMfg.email || "Email Not Registered"}</span>
                </div>

                <div className="flex items-center gap-2 text-black">
                  <Phone className="w-4 h-4 text-[#A68868]" />
                  <span className="font-bold">{viewMfg.phone}</span>
                </div>

                <div className="flex items-start gap-2 text-black/80">
                  <MapPin className="w-4 h-4 text-[#A68868] shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-bold">{viewMfg.address}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 space-y-1">
                <span className="text-[10px] uppercase font-black text-black/70 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5 text-[#A68868]" /> Master Catalog Inventory
                </span>
                <p className="text-sm font-black text-black">
                  {viewMfg.products} wholesale products created in master catalog
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {viewMfg.status !== "ACTIVE" ? (
                <button
                  onClick={() => {
                    handleStatusChange(viewMfg.id, viewMfg.company_name, "ACTIVE");
                    setViewMfg(null);
                  }}
                  className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black hover:bg-emerald-100"
                >
                  Activate Manufacturer
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleStatusChange(viewMfg.id, viewMfg.company_name, "SUSPENDED");
                    setViewMfg(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black hover:bg-rose-100"
                >
                  Suspend Manufacturer
                </button>
              )}

              <button
                onClick={() => setViewMfg(null)}
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

export default AdminManufacturers;
