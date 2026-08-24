import React, { useState, useEffect } from "react";
import {
  Package,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  PlusCircle,
  Tag,
  Layers,
  Plus,
  Zap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { retailerAPI } from "../../services/api";
import AddCustomProductModal from "../../components/retailer/AddCustomProductModal";

const RetailerListings = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingListing, setEditingListing] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [addCustomOpen, setAddCustomOpen] = useState(false);
  const [bullionRates, setBullionRates] = useState({ gold22k: 6640, gold24k: 7245 });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const [res, rateRes] = await Promise.all([
        retailerAPI.getListings().catch(() => null),
        retailerAPI.getBullionRates().catch(() => null),
      ]);

      const data = res?.data?.data || res?.data?.listings || [];
      setListings(Array.isArray(data) ? data : []);
      if (rateRes?.data?.data) setBullionRates(rateRes.data.data);
    } catch (err) {
      console.error("Error fetching store listings:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenEditModal = (listing) => {
    setEditingListing(listing);
    setEditPrice(listing.selling_price?.toString() || "");
    setEditStock(listing.stock?.toString() || "0");
    setEditStatus(listing.status || "ACTIVE");
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    if (!editingListing) return;

    try {
      setSaving(true);
      const payload = {
        selling_price: Number(editPrice),
        stock: Number(editStock),
        status: editStatus,
      };

      await retailerAPI.updateListing(editingListing.id, payload);
      showToast("Listing updated successfully!");
      setEditingListing(null);
      fetchListings();
    } catch (err) {
      console.error("Error updating listing:", err);
      showToast(err.response?.data?.message || "Failed to update listing", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (listing) => {
    try {
      const newStatus = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await retailerAPI.updateListing(listing.id, { status: newStatus });
      showToast(`Listing status set to ${newStatus}`);
      fetchListings();
    } catch (err) {
      console.error("Error toggling publish status:", err);
      showToast("Failed to toggle listing status", "error");
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm("Are you sure you want to remove this product from your store listing?")) return;

    try {
      await retailerAPI.deleteListing(id);
      showToast("Product removed from store successfully");
      fetchListings();
    } catch (err) {
      console.error("Error deleting listing:", err);
      showToast("Failed to remove listing", "error");
    }
  };

  const [tab, setTab] = useState("all");

  const mfgProductsCount = listings.filter(
    (l) => !l.is_custom && l.sourcing_type !== "RETAILER_CUSTOM" && l.product_source !== "RETAILER"
  ).length;

  const retailerOwnedCount = listings.filter(
    (l) => l.is_custom || l.sourcing_type === "RETAILER_CUSTOM" || l.product_source === "RETAILER"
  ).length;

  const filteredListings = listings.filter((item) => {
    const isRetailerOwned =
      item.is_custom || item.sourcing_type === "RETAILER_CUSTOM" || item.product_source === "RETAILER";

    if (tab === "manufacturer" && isRetailerOwned) return false;
    if (tab === "retailer" && !isRetailerOwned) return false;

    if (search) {
      const q = search.toLowerCase();
      return (
        item.name?.toLowerCase().includes(q) ||
        item.material?.toLowerCase().includes(q) ||
        item.status?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-fadeIn text-gray-900">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all font-bold text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-[#FFF8E7] text-[#C99A2C] text-[11px] font-bold uppercase tracking-wider border border-amber-200 inline-flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#C99A2C]" /> Store Inventory & Listings
          </span>
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
            My Products & Store Listings
          </h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Manage active storefront products, adjust retail prices, monitor stock, and list new local/custom inventory.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddCustomOpen(true)}
            className="px-5 py-3 rounded-full bg-[#C99A2C] hover:bg-[#B8860B] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 font-bold text-white" /> + Add Custom Product
          </button>

          <Link
            to="/retailer/catalog"
            className="px-5 py-3 rounded-full bg-white border border-[#EFEBE4] hover:bg-gray-50 text-gray-900 text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-[#C99A2C]" /> Wholesale Catalog
          </Link>
        </div>
      </div>

      {/* Control & Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Source Tabs */}
        <div className="flex flex-wrap items-center p-1.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === "all"
                ? "bg-white text-gray-900 shadow-xs border border-[#EFEBE4]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#C99A2C]" /> All Products
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#C99A2C] text-[10px]">
              {listings.length}
            </span>
          </button>

          <button
            onClick={() => setTab("manufacturer")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === "manufacturer"
                ? "bg-white text-gray-900 shadow-xs border border-[#EFEBE4]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Manufacturer Products
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
              {mfgProductsCount}
            </span>
          </button>

          <button
            onClick={() => setTab("retailer")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              tab === "retailer"
                ? "bg-white text-gray-900 shadow-xs border border-[#EFEBE4]"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C99A2C]" /> Retailer-Owned Products
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#C99A2C] text-[10px]">
              {retailerOwnedCount}
            </span>
          </button>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-[#C99A2C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C99A2C]"
          />
        </div>
      </div>

      {/* Inventory Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#EFEBE4] shadow-sm">
          <div className="w-10 h-10 border-4 border-[#C99A2C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-600">Loading store inventory...</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#EFEBE4] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] text-gray-600 text-[11px] font-bold uppercase tracking-wider border-b border-[#EFEBE4]">
                  <th className="py-4 px-6">Image</th>
                  <th className="py-4 px-6">Product Name</th>
                  <th className="py-4 px-6">Source</th>
                  <th className="py-4 px-6">Cost</th>
                  <th className="py-4 px-6">Selling Price</th>
                  <th className="py-4 px-6">Stock</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFEBE4] text-xs text-gray-900 font-medium">
                {filteredListings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-[#FAF8F5] transition-colors">
                    {/* Image */}
                    <td className="py-4 px-6">
                      <img
                        src={listing.image_url || listing.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600"}
                        alt={listing.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-[#EFEBE4]"
                      />
                    </td>

                    {/* Product Name */}
                    <td className="py-4 px-6">
                      <span className="font-serif font-bold text-gray-900 text-sm block">{listing.name}</span>
                      <span className="text-[10px] text-gray-500 block font-mono">
                        {listing.material || "Gold"} ({listing.purity || "22K"}) • {listing.weight || "12.5"}g
                      </span>
                    </td>

                    {/* Sourcing */}
                    <td className="py-4 px-6">
                      {listing.is_custom || listing.sourcing_type === "RETAILER_CUSTOM" || listing.product_source === "RETAILER" ? (
                        <span className="px-2.5 py-1 rounded-full bg-[#FFF8E7] text-[#C99A2C] text-[10px] font-bold border border-amber-200 flex items-center gap-1 w-fit">
                          <Sparkles className="w-3 h-3 text-[#C99A2C]" /> Local Custom
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Cloud Wholesale
                        </span>
                      )}
                    </td>

                    {/* Wholesale Cost (Manufacturer Price) */}
                    <td className="py-4 px-6 font-mono text-gray-600 text-xs">
                      {listing.product_source === "RETAILER" || listing.is_custom || listing.manufacturer_price == null || Number(listing.manufacturer_price) === 0 ? (
                        <span className="text-gray-400 font-mono text-[11px]">N/A (Self Owned)</span>
                      ) : (
                        <span className="font-bold text-gray-800">₹{Number(listing.manufacturer_price).toLocaleString("en-IN")}</span>
                      )}
                    </td>

                    {/* Selling Price (Retailer Price to Customer) */}
                    <td className="py-4 px-6 font-serif font-bold text-[#C99A2C] text-sm">
                      ₹{Number(listing.selling_price || listing.retailer_price || 0).toLocaleString("en-IN")}
                    </td>

                    {/* Stock */}
                    <td className="py-4 px-6 font-bold">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] inline-flex items-center gap-1.5 font-bold ${
                          (listing.stock || 0) > 0
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {(listing.stock || 0) > 0 ? `${listing.stock} units` : "0 (Out of Stock)"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleTogglePublish(listing)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1.5 ${
                          listing.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Click to toggle status"
                      >
                        {listing.status === "ACTIVE" ? (
                          <>
                            <Eye className="w-3 h-3 text-emerald-600" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 text-amber-600" /> INACTIVE
                          </>
                        )}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(listing)}
                          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          title="Edit Listing"
                        >
                          <Edit2 className="w-4 h-4 text-[#C99A2C]" />
                        </button>

                        <button
                          onClick={() => handleDeleteListing(listing.id)}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                          title="Remove Listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredListings.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-xs text-gray-500">
                      No products found in your store inventory.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white border border-[#EFEBE4] p-6 space-y-6 shadow-xl relative text-gray-900">
            <button
              onClick={() => setEditingListing(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C99A2C]">
                Update Store Listing
              </span>
              <h2 className="text-xl font-serif font-bold text-gray-900">
                Edit {editingListing.name}
              </h2>
            </div>

            <form onSubmit={handleSaveListing} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Selling Price (₹)
                </label>
                <input
                  type="number"
                  required
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EFEBE4] text-gray-900 font-mono text-base font-bold focus:outline-none focus:border-[#C99A2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stock Units
                </label>
                <input
                  type="number"
                  required
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingListing(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#C99A2C] hover:bg-[#B8860B] text-white text-xs font-bold shadow-xs"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Custom Product Modal */}
      <AddCustomProductModal
        isOpen={addCustomOpen}
        onClose={() => setAddCustomOpen(false)}
        onSuccess={() => fetchListings()}
        bullionRates={bullionRates}
      />
    </div>
  );
};

export default RetailerListings;
