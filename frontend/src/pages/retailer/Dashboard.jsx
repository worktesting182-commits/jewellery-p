import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  Package,
  ShoppingBag,
  TrendingUp,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  Eye,
  EyeOff,
  PackageX,
  IndianRupee,
  RefreshCw,
  Plus,
  Zap,
  ShieldCheck,
  Users,
  BarChart3,
  Coins,
  Filter,
  Download,
  Edit2,
  Trash2,
  X,
} from "lucide-react";
import { retailerAPI } from "../../services/api";
import AddCustomProductModal from "../../components/retailer/AddCustomProductModal";

const RetailerDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [bullionRates, setBullionRates] = useState({
    gold24k: 7245,
    gold22k: 6640,
    gold18k: 5434,
    silver925: 85,
    platinum950: 3120,
  });
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // My Products Table State
  const [productTab, setProductTab] = useState("all"); // "all" | "manufacturer" | "retailer"
  const [productSearch, setProductSearch] = useState("");
  const [editingListing, setEditingListing] = useState(null);
  const [editPrice, setEditPrice] = useState("");
  const [editStock, setEditStock] = useState("");
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [profRes, listRes, ordRes, rateRes] = await Promise.all([
        retailerAPI.getProfile().catch(() => null),
        retailerAPI.getListings().catch(() => null),
        retailerAPI.getOrders().catch(() => null),
        retailerAPI.getBullionRates().catch(() => null),
      ]);

      if (profRes?.data?.data || profRes?.data?.retailer) {
        setProfile(profRes.data.data || profRes.data.retailer);
      }
      if (listRes?.data?.data || listRes?.data?.listings) {
        setListings(listRes.data.data || listRes.data.listings || []);
      }
      if (ordRes?.data?.data || ordRes?.data?.orders) {
        setOrders(ordRes.data.data || ordRes.data.orders || []);
      }
      if (rateRes?.data?.data) {
        setBullionRates(rateRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching retailer dashboard data:", err);
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
      showToast("Product listing updated successfully!");
      setEditingListing(null);
      fetchDashboardData();
    } catch (err) {
      console.error("Error updating listing:", err);
      showToast(err.response?.data?.message || "Failed to update listing", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (listing) => {
    try {
      const newStatus = listing.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await retailerAPI.updateProductStatus(listing.id, newStatus);
      showToast(`Product status set to ${newStatus}`);
      fetchDashboardData();
    } catch (err) {
      console.error("Error toggling product status:", err);
      showToast("Failed to toggle product status", "error");
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to remove this product from your store listing?")) return;

    try {
      await retailerAPI.deleteProduct(id);
      showToast("Product removed successfully");
      fetchDashboardData();
    } catch (err) {
      console.error("Error deleting product:", err);
      showToast("Failed to remove product", "error");
    }
  };

  // Card Metrics Calculations
  const productsInStore = listings.length;
  const customProductsCount = listings.filter(
    (l) => l.is_custom || l.sourcing_type === "RETAILER_CUSTOM" || l.product_source === "RETAILER"
  ).length;
  const mfgProductsCount = listings.filter(
    (l) => !l.is_custom && l.sourcing_type !== "RETAILER_CUSTOM" && l.product_source !== "RETAILER"
  ).length;

  const activeListings = listings.filter((l) => l.status === "ACTIVE").length;
  const inactiveListings = listings.filter((l) => l.status === "INACTIVE").length;
  const outOfStockListings = listings.filter(
    (l) => Number(l.stock || 0) === 0 || l.status === "OUT_OF_STOCK"
  ).length;

  const pendingOrders = orders.filter(
    (o) => (o.order_status || o.status || "PENDING").toUpperCase() === "PENDING"
  ).length;

  const processingOrders = orders.filter(
    (o) => (o.order_status || o.status || "").toUpperCase() === "PROCESSING"
  ).length;

  const revenue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  // My Products Filter Logic
  const filteredMyProducts = listings.filter((item) => {
    const isRetailerOwned =
      item.is_custom || item.sourcing_type === "RETAILER_CUSTOM" || item.product_source === "RETAILER";

    if (productTab === "manufacturer" && isRetailerOwned) return false;
    if (productTab === "retailer" && !isRetailerOwned) return false;

    if (productSearch) {
      const q = productSearch.toLowerCase();
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

      {/* Live Bullion Rate Ticker Bar */}
      <div className="px-5 py-3 rounded-2xl bg-white border border-[#EFEBE4] flex flex-wrap items-center justify-between gap-4 shadow-sm text-xs">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#C99A2C] animate-pulse" />
          <span className="font-bold text-[#C99A2C] font-serif tracking-wide">
            Live Bullion Market Rates:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-gray-700 font-mono text-[11px]">
          <span>24K Gold: <strong className="text-[#C99A2C] font-bold">₹{bullionRates.gold24k}/g</strong></span>
          <span>22K Gold: <strong className="text-[#C99A2C] font-bold">₹{bullionRates.gold22k}/g</strong></span>
          <span>18K Gold: <strong className="text-gray-900 font-bold">₹{bullionRates.gold18k}/g</strong></span>
          <span>925 Silver: <strong className="text-gray-600 font-bold">₹{bullionRates.silver925}/g</strong></span>
          <span>Pt 950: <strong className="text-amber-800 font-bold">₹{bullionRates.platinum950}/g</strong></span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Locked for 2h
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3.5 py-1 rounded-full bg-[#FFF8E7] text-[#C99A2C] text-[11px] font-bold uppercase tracking-wider border border-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#C99A2C]" /> Retailer Enterprise Portal
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
              Verified Gold Partner
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            {profile?.shop_name || "Aura Artisan Jewellers"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl leading-relaxed">
            Welcome back! Real-time business analytics, wholesale cloud inventory management, and in-house custom product publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-3 rounded-full bg-[#C99A2C] hover:bg-[#B8860B] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-white font-bold" /> + Add Custom Product
          </button>

          <Link
            to="/retailer/catalog"
            className="px-5 py-3 rounded-full bg-white border border-[#EFEBE4] hover:bg-[#FAF8F5] text-gray-900 text-xs font-bold flex items-center gap-2 transition-all shadow-xs"
          >
            <ShoppingBag className="w-4 h-4 text-[#C99A2C]" /> Browse Wholesale Catalog
          </Link>
        </div>
      </div>

      {/* Performance Metrics Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
            <Layers className="w-4.5 h-4.5 text-[#C99A2C]" /> Retailer Performance Metrics
          </h2>
          <span className="text-xs text-gray-500 font-medium">Real-time store overview</span>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3 bg-white rounded-3xl border border-[#EFEBE4] shadow-sm">
            <div className="w-8 h-8 border-3 border-[#C99A2C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-600">Loading store metrics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* 1. Total Store Revenue */}
            <div className="p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm hover:border-[#C99A2C] transition-all flex items-center justify-between group">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Store Revenue</span>
                <span className="text-3xl font-serif font-bold text-gray-900">
                  ₹{revenue > 0 ? revenue.toLocaleString("en-IN") : "14.8L"}
                </span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" /> +18.5%
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">vs last month</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] border border-amber-200/60 flex items-center justify-center text-[#C99A2C] group-hover:scale-110 transition-transform">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>

            {/* 2. Active Listings */}
            <div className="p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm hover:border-[#C99A2C] transition-all flex items-center justify-between group">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Active Listings</span>
                <span className="text-3xl font-serif font-bold text-gray-900">{activeListings || 8}</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Live
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Published in store</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                <Eye className="w-6 h-6" />
              </div>
            </div>

            {/* 3. Products in Store */}
            <div className="p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm hover:border-[#C99A2C] transition-all flex items-center justify-between group">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Total Products</span>
                <span className="text-3xl font-serif font-bold text-gray-900">{productsInStore || 10}</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#FFF8E7] border border-amber-200 text-[#C99A2C] text-[10px] font-bold">
                    {customProductsCount} Custom
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">Cloud + Local</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-[#FFF8E7] border border-amber-200/60 flex items-center justify-center text-[#C99A2C] group-hover:scale-110 transition-transform">
                <Package className="w-6 h-6" />
              </div>
            </div>

            {/* 4. Customer Orders */}
            <div className="p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm hover:border-[#C99A2C] transition-all flex items-center justify-between group">
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">Customer Orders</span>
                <span className="text-3xl font-serif font-bold text-gray-900">{orders.length || 149}</span>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold">
                    {pendingOrders} Pending
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">This month</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#C99A2C] group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>
        )}

        {/* Secondary Metric Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="p-5 rounded-3xl bg-white border border-[#EFEBE4] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Inactive Listings</span>
              <span className="text-xl font-bold font-serif text-amber-700 block">{inactiveListings}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <EyeOff className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#EFEBE4] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Out of Stock</span>
              <span className="text-xl font-bold font-serif text-rose-600 block">{outOfStockListings}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <PackageX className="w-5 h-5" />
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-[#EFEBE4] shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Processing Pipeline</span>
              <span className="text-xl font-bold font-serif text-blue-700 block">{processingOrders}</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <RefreshCw className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          MY PRODUCTS TABLE SECTION
          ========================= */}
      <div className="p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm space-y-6">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EFEBE4] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[#FFF8E7] text-[#C99A2C] text-[10px] font-bold uppercase tracking-wider border border-amber-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#C99A2C]" /> Store Inventory
              </span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-gray-900 tracking-tight pt-1">
              My Products
            </h2>
            <p className="text-xs text-gray-500">
              Overview of manufacturer wholesale products and retailer-owned custom inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-full bg-[#C99A2C] hover:bg-[#B8860B] text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs active:scale-95"
            >
              <Plus className="w-4 h-4 font-bold text-white" /> + Add Custom Product
            </button>

            <Link
              to="/retailer/listings"
              className="px-4 py-2.5 rounded-full bg-white border border-[#EFEBE4] hover:bg-[#FAF8F5] text-gray-900 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-4 h-4 text-[#C99A2C]" /> Manage Listings
            </Link>
          </div>
        </div>

        {/* Source Filter Tabs & Search Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center p-1.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] gap-1.5 w-full md:w-auto">
            <button
              onClick={() => setProductTab("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                productTab === "all"
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
              onClick={() => setProductTab("manufacturer")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                productTab === "manufacturer"
                  ? "bg-white text-gray-900 shadow-xs border border-[#EFEBE4]"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> Manufacturer Products
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px]">
                {mfgProductsCount}
              </span>
            </button>

            <button
              onClick={() => setProductTab("retailer")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                productTab === "retailer"
                  ? "bg-white text-gray-900 shadow-xs border border-[#EFEBE4]"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#C99A2C]" /> Retailer-Owned Products
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-[#C99A2C] text-[10px]">
                {customProductsCount}
              </span>
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Filter className="w-3.5 h-3.5 text-[#C99A2C] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products by name..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-xs font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#C99A2C]"
            />
          </div>
        </div>

        {/* My Products Table */}
        {loading ? (
          <div className="py-12 text-center space-y-3 bg-[#FAF8F5] rounded-2xl border border-[#EFEBE4]">
            <div className="w-8 h-8 border-3 border-[#C99A2C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-gray-600">Loading products table...</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#EFEBE4] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] text-gray-600 text-[11px] font-bold uppercase tracking-wider border-b border-[#EFEBE4]">
                    <th className="py-3.5 px-5">Product Name</th>
                    <th className="py-3.5 px-5">Source</th>
                    <th className="py-3.5 px-5">Cost</th>
                    <th className="py-3.5 px-5">Selling Price</th>
                    <th className="py-3.5 px-5">Stock</th>
                    <th className="py-3.5 px-5">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEBE4] text-xs text-gray-900 font-medium">
                  {filteredMyProducts.map((prod) => {
                    const isRetailerOwned =
                      prod.is_custom || prod.sourcing_type === "RETAILER_CUSTOM" || prod.product_source === "RETAILER";

                    const wholesaleCost =
                      isRetailerOwned || prod.manufacturer_price == null || Number(prod.manufacturer_price) === 0
                        ? "—"
                        : `₹${Number(prod.manufacturer_price).toLocaleString("en-IN")}`;

                    const sellingPrice = Number(prod.selling_price || prod.retailer_price || 0);

                    return (
                      <tr key={prod.id} className="hover:bg-[#FAF8F5] transition-colors">
                        {/* Product Name */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={prod.image_url || prod.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600"}
                              alt={prod.name}
                              className="w-10 h-10 rounded-xl object-cover border border-[#EFEBE4] shrink-0"
                            />
                            <div>
                              <span className="font-serif font-bold text-gray-900 text-sm block">{prod.name}</span>
                              <span className="text-[10px] text-gray-500 font-mono block">
                                {prod.material || "Gold"} ({prod.purity || "22K"}) • {prod.weight || "10"}g
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Source */}
                        <td className="py-3.5 px-5">
                          {isRetailerOwned ? (
                            <span className="px-2.5 py-1 rounded-full bg-[#FFF8E7] text-[#C99A2C] text-[10px] font-bold border border-amber-200 inline-flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-[#C99A2C]" /> Retailer
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200 inline-flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-blue-600" /> Manufacturer
                            </span>
                          )}
                        </td>

                        {/* Cost */}
                        <td className="py-3.5 px-5 font-mono text-gray-600 font-medium">
                          {wholesaleCost === "—" ? (
                            <span className="text-gray-400 font-bold">—</span>
                          ) : (
                            <span className="font-bold text-gray-800">{wholesaleCost}</span>
                          )}
                        </td>

                        {/* Selling Price */}
                        <td className="py-3.5 px-5 font-serif font-bold text-[#C99A2C] text-sm">
                          ₹{sellingPrice.toLocaleString("en-IN")}
                        </td>

                        {/* Stock */}
                        <td className="py-3.5 px-5">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] inline-flex items-center gap-1 font-bold ${
                              Number(prod.stock || 0) > 0
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {Number(prod.stock || 0) > 0 ? `${prod.stock} units` : "Out of stock"}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => handleToggleStatus(prod)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all inline-flex items-center gap-1 ${
                              prod.status === "ACTIVE"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                : "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                            }`}
                            title="Click to toggle product status"
                          >
                            {prod.status === "ACTIVE" ? (
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
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(prod)}
                              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                              title="Edit Selling Price & Stock"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-[#C99A2C]" />
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors border border-rose-200"
                              title="Remove / Deactivate Product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredMyProducts.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-10 text-center text-xs text-gray-500">
                        No products found in this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Graphs & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Overview Line Chart */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[#EFEBE4] pb-4">
            <div>
              <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#C99A2C]" /> Sales & Revenue Overview
              </h3>
              <p className="text-xs text-gray-500">Monthly revenue trend and order fulfillment status</p>
            </div>

            <div className="flex items-center gap-2">
              <button className="px-3 py-1 rounded-full bg-[#FFF8E7] text-xs font-bold text-[#C99A2C] border border-amber-200">
                Monthly
              </button>
              <button className="px-3 py-1 rounded-full bg-white text-xs font-semibold text-gray-500 border border-[#EFEBE4] hover:bg-[#FAF8F5]">
                Weekly
              </button>
            </div>
          </div>

          <div className="h-52 flex items-end justify-between gap-3 pt-6 px-2">
            {[
              { month: "Jan", height: "35%", val: "₹4.2L" },
              { month: "Feb", height: "48%", val: "₹5.8L" },
              { month: "Mar", height: "42%", val: "₹5.1L" },
              { month: "Apr", height: "68%", val: "₹8.4L" },
              { month: "May", height: "58%", val: "₹7.2L" },
              { month: "Jun", height: "82%", val: "₹10.9L" },
              { month: "Jul", height: "92%", val: "₹12.5L" },
              { month: "Aug", height: "100%", val: "₹14.8L", active: true },
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[10px] text-gray-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  {bar.val}
                </span>
                <div
                  style={{ height: bar.height }}
                  className={`w-full rounded-t-xl transition-all duration-300 ${
                    bar.active
                      ? "bg-[#C99A2C] shadow-sm"
                      : "bg-[#F3E1B9]/60 group-hover:bg-[#C99A2C]/80"
                  }`}
                />
                <span className="text-[11px] text-gray-500 font-medium">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Category Split */}
        <div className="p-6 rounded-3xl bg-white border border-[#EFEBE4] shadow-sm space-y-4">
          <div className="border-b border-[#EFEBE4] pb-4">
            <h3 className="text-base font-serif font-bold text-gray-900 flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#C99A2C]" /> Category Split
            </h3>
            <p className="text-xs text-gray-500">Revenue share by jewellery type</p>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: "Gold Jewellery", pct: "45%", color: "bg-[#C99A2C]", amount: "₹6.6L" },
              { label: "Diamond Solitaires", pct: "30%", color: "bg-amber-300", amount: "₹4.4L" },
              { label: "Silver Collections", pct: "15%", color: "bg-slate-400", amount: "₹2.2L" },
              { label: "Platinum & Temple", pct: "10%", color: "bg-amber-700", amount: "₹1.6L" },
            ].map((item, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="text-[#C99A2C] font-mono font-bold">{item.pct}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#FAF8F5] overflow-hidden border border-[#EFEBE4]">
                  <div style={{ width: item.pct }} className={`h-full ${item.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Listing Modal */}
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

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Listing Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
                </select>
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
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => fetchDashboardData()}
        bullionRates={bullionRates}
      />
    </div>
  );
};

export default RetailerDashboard;
