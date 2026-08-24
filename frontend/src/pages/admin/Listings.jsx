import React, { useState, useEffect } from "react";
import {
  Package,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Store,
  Building2,
  Tag,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  X,
  AlertOctagon,
} from "lucide-react";
import { adminAPI } from "../../services/api";
import ListingTable from "../../components/admin/ListingTable";

const AdminListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewListing, setViewListing] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchListings();
  }, [statusFilter]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getListings({ status: statusFilter });
      const data = res.data?.data || res.data?.listings || [];
      setListings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching admin listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (listingId, prodName, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      setUpdatingId(listingId);
      await adminAPI.updateListingStatus(listingId, newStatus);
      showToast(`Listing for "${prodName}" set to ${newStatus}`);
      fetchListings();
    } catch (err) {
      console.error("Error updating listing status:", err);
      showToast(err.response?.data?.message || "Failed to update listing status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredListings = listings.filter((l) => {
    const matchesSearch =
      l.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.retailer?.toLowerCase().includes(search.toLowerCase()) ||
      l.manufacturer?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || (l.status || "").toUpperCase() === statusFilter;

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
            <Package className="w-3.5 h-3.5 text-[#A68868]" /> Module 7 – Commercial Marketplace Moderation
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Retailer Listings
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Audit store listings published by retailers on the public marketplace, inspect selling prices, stock inventory, and moderate listing availability.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Product, Retailer, Manufacturer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#CDD5DB]">
        <span className="text-[10px] uppercase font-black text-black/70 shrink-0 mr-2">Filter Status:</span>
        {["ALL", "ACTIVE", "DISABLED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
              statusFilter === tab
                ? "bg-[#A68868] text-white shadow-xs"
                : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
            }`}
          >
            {tab === "ALL" ? "All Listings" : tab}
          </button>
        ))}
      </div>

      {/* Listings Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading marketplace retailer listings...</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black">
              <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
                <tr>
                  <th className="px-6 py-4">Product</th>
                  <th className="px-6 py-4">Retailer</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4">Selling Price</th>
                  <th className="px-6 py-4 text-center">Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#CDD5DB] font-bold">
                {filteredListings.map((listing) => {
                  const statusUpper = (listing.status || "ACTIVE").toUpperCase();

                  return (
                    <tr key={listing.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                      {/* 1. Product */}
                      <td className="px-6 py-4 font-black text-black">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-white border border-[#CDD5DB] overflow-hidden shrink-0">
                            <img
                              src={listing.image}
                              alt={listing.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src =
                                  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80";
                              }}
                            />
                          </div>
                          <div>
                            <span className="block font-black text-black">{listing.product_name}</span>
                            <span className="block text-[10px] text-black/70 font-mono">Listing ID: {listing.id?.slice(0, 8)}...</span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Retailer */}
                      <td className="px-6 py-4 font-black text-black">
                        <div className="flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#A68868] shrink-0" />
                          <span>{listing.retailer}</span>
                        </div>
                      </td>

                      {/* 3. Manufacturer */}
                      <td className="px-6 py-4 font-black text-[#A68868]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-[#A68868]" />
                          <span>{listing.manufacturer}</span>
                        </div>
                      </td>

                      {/* 4. Selling Price */}
                      <td className="px-6 py-4 font-black text-black font-mono text-sm">
                        ₹{Number(listing.selling_price || 0).toLocaleString("en-IN")}
                      </td>

                      {/* 5. Stock */}
                      <td className="px-6 py-4 text-center">
                        <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black font-black text-xs border border-[#A68868]/40">
                          {listing.stock} in stock
                        </span>
                      </td>

                      {/* 6. Status */}
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

                      {/* Actions: View, Disable Listing, Enable Listing */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View */}
                          <button
                            onClick={() => setViewListing(listing)}
                            className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="Inspect Listing Details"
                          >
                            <Eye className="w-4 h-4 text-[#A68868]" />
                          </button>

                          {/* Enable Listing */}
                          {statusUpper !== "ACTIVE" && (
                            <button
                              onClick={() => handleToggleStatus(listing.id, listing.product_name, statusUpper)}
                              disabled={updatingId === listing.id}
                              className="px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 text-xs font-black transition-all"
                            >
                              Enable Listing
                            </button>
                          )}

                          {/* Disable Listing */}
                          {statusUpper === "ACTIVE" && (
                            <button
                              onClick={() => handleToggleStatus(listing.id, listing.product_name, statusUpper)}
                              disabled={updatingId === listing.id}
                              className="px-3.5 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-xs font-black transition-all"
                            >
                              Disable Listing
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

          {filteredListings.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white space-y-2">
              <Package className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No retailer listings found matching current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View Listing Details Modal */}
      {viewListing && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#CDD5DB] overflow-hidden shrink-0">
                  <img
                    src={viewListing.image}
                    alt={viewListing.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">{viewListing.product_name}</h3>
                  <span className="text-[11px] text-black/70 font-bold">Public Marketplace Retail Listing</span>
                </div>
              </div>

              <button
                onClick={() => setViewListing(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Retailer Store</span>
                  <span className="font-black text-black block mt-0.5">{viewListing.retailer}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Master Manufacturer</span>
                  <span className="font-black text-[#A68868] block mt-0.5">{viewListing.manufacturer}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Selling Price</span>
                  <span className="font-mono text-base font-black text-black block">
                    ₹{Number(viewListing.selling_price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Wholesale Price</span>
                  <span className="font-mono text-sm font-black text-black/70 block">
                    ₹{Number(viewListing.wholesale_price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Available Stock</span>
                  <span className="font-black text-black block">{viewListing.stock} items</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] text-[11px] text-black font-bold flex items-center justify-between">
                <span>Moderation Status</span>
                <span className={`font-black uppercase ${viewListing.status === "ACTIVE" ? "text-emerald-700" : "text-rose-700"}`}>
                  {viewListing.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              {viewListing.status !== "ACTIVE" ? (
                <button
                  onClick={() => {
                    handleToggleStatus(viewListing.id, viewListing.product_name, "DISABLED");
                    setViewListing(null);
                  }}
                  className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-black hover:bg-emerald-100"
                >
                  Enable Listing
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleToggleStatus(viewListing.id, viewListing.product_name, "ACTIVE");
                    setViewListing(null);
                  }}
                  className="px-4 py-2 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-black hover:bg-rose-100"
                >
                  Disable Listing
                </button>
              )}

              <button
                onClick={() => setViewListing(null)}
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

export default AdminListings;
