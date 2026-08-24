import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  PlusCircle,
  Search,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Store,
  Tag,
  PackageCheck,
  Filter,
  Mic,
  Camera,
  Eye,
  Zap,
  ShieldCheck,
  Edit,
  Plus,
} from "lucide-react";
import { retailerAPI } from "../../services/api";
import VirtualTryOnModal from "../../components/retailer/VirtualTryOnModal";
import AddCustomProductModal from "../../components/retailer/AddCustomProductModal";

const RetailerCatalog = () => {
  const [catalog, setCatalog] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPurity, setSelectedPurity] = useState("All");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [tryOnProduct, setTryOnProduct] = useState(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [addCustomOpen, setAddCustomOpen] = useState(false);

  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [status, setStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);

  const [toast, setToast] = useState(null);
  const [bullionRates, setBullionRates] = useState({ gold22k: 6640, gold24k: 7245 });

  useEffect(() => {
    fetchCatalogAndListings();
  }, []);

  const fetchCatalogAndListings = async () => {
    try {
      setLoading(true);
      const [catRes, listRes, rateRes] = await Promise.all([
        retailerAPI.getCatalog().catch(() => null),
        retailerAPI.getListings().catch(() => null),
        retailerAPI.getBullionRates().catch(() => null),
      ]);

      const catData = catRes?.data?.catalog || catRes?.data?.data || [];
      const listData = listRes?.data?.data || listRes?.data?.listings || [];

      setCatalog(Array.isArray(catData) ? catData : []);
      setMyListings(Array.isArray(listData) ? listData : []);
      if (rateRes?.data?.data) {
        setBullionRates(rateRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching wholesale catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenAddModal = (product) => {
    setSelectedProduct(product);
    const mPrice = Number(product.manufacturer_price || product.price || 10000);
    const suggestedRetailPrice = Math.round(mPrice * 1.15); // Suggested 15% markup
    setSellingPrice(suggestedRetailPrice.toString());
    setStock("10");
    setModalOpen(true);
  };

  const handleAddToListings = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !sellingPrice || !stock) return;

    try {
      setSubmitting(true);
      const payload = {
        manufacturer_product_id: selectedProduct.id,
        selling_price: Number(sellingPrice),
        stock: Number(stock),
        status: status,
      };

      await retailerAPI.createListing(payload);
      showToast(`Successfully listed "${selectedProduct.name}" in your store!`);
      setModalOpen(false);
      fetchCatalogAndListings();
    } catch (err) {
      console.error("Error creating store listing:", err);
      showToast(err.response?.data?.message || "Failed to add listing", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Check if product is already in retailer's store
  const isAlreadyListed = (mProductId) => {
    return myListings.some((l) => l.manufacturer_product_id === mProductId);
  };

  const filteredCatalog = catalog.filter((item) => {
    const matchesSearch =
      item.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.material?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
      item.category_name?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesPurity =
      selectedPurity === "All" || item.purity === selectedPurity;

    return matchesSearch && matchesCategory && matchesPurity;
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

      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="px-3.5 py-1 rounded-full bg-[#FFF8E7] text-[#C99A2C] text-[11px] font-bold uppercase tracking-wider border border-amber-200 inline-flex items-center gap-1.5">
            <ShoppingBag className="w-3.5 h-3.5 text-[#C99A2C]" /> B2B Wholesale Cloud Exchange
          </span>
          <h1 className="text-3xl font-serif font-bold text-gray-900 tracking-tight">
            Wholesale Jewellery Marketplace
          </h1>
          <p className="text-xs text-gray-500 max-w-xl">
            Discover gold, diamond, silver, and platinum designs from India's top certified manufacturers. Add items directly to your store catalog with custom margins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddCustomOpen(true)}
            className="px-5 py-3 rounded-full bg-[#C99A2C] hover:bg-[#B8860B] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 font-bold text-white" /> + Add Custom Product
          </button>
        </div>
      </div>

      {/* Search & Filter Control Bar */}
      <div className="p-4 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Luxe Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-[#C99A2C] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rings, necklaces, 22K gold, diamonds..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-20 py-3 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C99A2C]"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-400">
              <Mic className="w-3.5 h-3.5 hover:text-[#C99A2C] cursor-pointer" />
              <Camera className="w-3.5 h-3.5 hover:text-[#C99A2C] cursor-pointer" />
            </div>
          </div>

          {/* Metal Purity Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-500 font-bold mr-1">Purity:</span>
            {["All", "24K", "22K", "18K", "14K"].map((purity) => (
              <button
                key={purity}
                onClick={() => setSelectedPurity(purity)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedPurity === purity
                    ? "bg-[#C99A2C] text-white shadow-xs"
                    : "bg-[#FAF8F5] text-gray-700 border border-[#EFEBE4] hover:bg-gray-100"
                }`}
              >
                {purity}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#EFEBE4]">
          <span className="text-[11px] text-gray-500 font-bold mr-1">Categories:</span>
          {["All", "Necklaces", "Rings", "Earrings", "Bangles", "Gold", "Silver", "Diamond", "Platinum"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-[#FFF8E7] border border-amber-300 text-[#C99A2C]"
                  : "bg-white text-gray-600 border border-[#EFEBE4] hover:bg-[#FAF8F5]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Cards Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-[#EFEBE4] shadow-sm">
          <div className="w-10 h-10 border-4 border-[#C99A2C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-600">Loading wholesale catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCatalog.map((product) => {
            const listed = isAlreadyListed(product.id);
            const mPrice = Number(product.manufacturer_price || product.price || 0);

            return (
              <div
                key={product.id}
                className="rounded-3xl bg-white border border-[#EFEBE4] overflow-hidden shadow-sm hover:border-[#C99A2C] transition-all flex flex-col justify-between group"
              >
                {/* Product Image & Badges */}
                <div className="h-52 w-full relative overflow-hidden bg-[#FAF8F5]">
                  <img
                    src={
                      product.image_url ||
                      product.image ||
                      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600"
                    }
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Floating Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <button
                      onClick={() => {
                        setTryOnProduct(product);
                        setTryOnOpen(true);
                      }}
                      className="px-2.5 py-1 rounded-full bg-white/90 border border-amber-300 text-[#C99A2C] text-[10px] font-bold flex items-center gap-1 backdrop-blur-md hover:bg-[#C99A2C] hover:text-white transition-all shadow-xs"
                    >
                      <Sparkles className="w-3 h-3 text-[#C99A2C]" /> Virtual Try-On
                    </button>
                  </div>

                  <div className="absolute top-3 right-3">
                    {listed ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1 backdrop-blur-md">
                        <PackageCheck className="w-3.5 h-3.5 text-emerald-600" /> In Store
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-white/90 text-gray-700 text-[10px] font-bold border border-gray-200 flex items-center gap-1 backdrop-blur-md shadow-xs">
                        <ShieldCheck className="w-3 h-3 text-[#C99A2C]" /> BIS Hallmark
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Info Details */}
                <div className="p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#C99A2C] bg-[#FFF8E7] px-2.5 py-0.5 rounded-full border border-amber-200">
                        {product.category || product.category_name || "Gold"}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-full border border-gray-200">
                        {product.weight || "12.5"}g
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-gray-900 line-clamp-1 group-hover:text-[#C99A2C] transition-colors">
                      {product.name}
                    </h3>

                    <p className="text-[11px] text-gray-500 font-medium">
                      Manufacturer: <strong className="text-gray-900 font-semibold">{product.manufacturer || product.manufacturer_name || "Master Artisan"}</strong>
                    </p>

                    <div className="text-[11px] text-gray-600 font-medium">
                      Material: <span className="text-[#C99A2C] font-bold">{product.material || "Gold"} ({product.purity || "22K"})</span>
                    </div>
                  </div>

                  {/* Wholesale Pricing Box */}
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] uppercase text-gray-400 font-bold block">Wholesale Price</span>
                      <span className="text-base font-serif font-bold text-gray-900">
                        ₹{mPrice.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] uppercase text-[#C99A2C] font-bold block">Est. Retail @ 15%</span>
                      <span className="text-xs font-mono font-bold text-[#C99A2C]">
                        ₹{Math.round(mPrice * 1.15).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleOpenAddModal(product)}
                    className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                      listed
                        ? "bg-white text-gray-800 border border-[#EFEBE4] hover:bg-gray-50"
                        : "bg-[#C99A2C] hover:bg-[#B8860B] text-white shadow-xs"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    {listed ? "Update Retail Margin" : "Add to Retail Store"}
                  </button>
                </div>
              </div>
            );
          })}

          {filteredCatalog.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs font-bold text-gray-500 bg-white rounded-3xl border border-[#EFEBE4]">
              No manufacturer products match your filters.
            </div>
          )}
        </div>
      )}

      {/* List in Store Modal */}
      {modalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#EFEBE4] p-6 sm:p-8 space-y-6 shadow-xl relative text-gray-900">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-[#C99A2C]">
                Store Listing Configuration
              </span>
              <h2 className="text-xl font-bold font-serif text-gray-900">
                Add "{selectedProduct.name}" to Store
              </h2>
            </div>

            <form onSubmit={handleAddToListings} className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] flex justify-between text-xs">
                <div>
                  <span className="text-gray-500 block">Wholesale Price:</span>
                  <span className="font-bold text-gray-900 text-sm font-mono">
                    ₹{(selectedProduct.manufacturer_price || selectedProduct.price || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 block">Gold Purity:</span>
                  <span className="font-bold text-[#C99A2C]">{selectedProduct.purity || "22K"}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Retail Selling Price (₹)
                </label>
                <input
                  type="number"
                  required
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EFEBE4] text-gray-900 font-mono text-base font-bold focus:outline-none focus:border-[#C99A2C]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Initial Store Inventory Stock
                </label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-[#C99A2C] hover:bg-[#B8860B] text-white text-xs font-bold shadow-xs"
                >
                  {submitting ? "Saving..." : "Confirm & List Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Virtual Try-On Modal */}
      <VirtualTryOnModal
        isOpen={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        product={tryOnProduct}
      />

      {/* Add Custom Product Modal */}
      <AddCustomProductModal
        isOpen={addCustomOpen}
        onClose={() => setAddCustomOpen(false)}
        onSuccess={() => fetchCatalogAndListings()}
        bullionRates={bullionRates}
      />
    </div>
  );
};

export default RetailerCatalog;
