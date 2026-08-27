import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/manufacturer/Navbar";
import Sidebar from "../../components/manufacturer/Sidebar";
import {
  Package,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  X,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const PRODUCTS_PER_PAGE = 8;

const STATUS_STYLES = {
  active: "bg-[#E3C39D]/40 text-black border border-[#A68868]/40 font-black",
  draft: "bg-white text-black/70 border border-[#CDD5DB] font-bold",
  "out of stock": "bg-rose-100 text-rose-900 border border-rose-300 font-black",
  discontinued: "bg-rose-100 text-rose-900 border border-rose-300 font-black",
  inactive: "bg-white text-black/50 border border-[#CDD5DB] font-bold",
};

const getStatusStyle = (status) =>
  STATUS_STYLES[String(status).toLowerCase()] || STATUS_STYLES.inactive;

function SkeletonCard() {
  return (
    <div className="rounded-3xl bg-white border border-[#CDD5DB] p-4 animate-pulse">
      <div className="h-44 w-full rounded-2xl bg-[#CDD5DB]/30 mb-4" />
      <div className="h-4 w-3/4 rounded bg-[#CDD5DB]/30 mb-2" />
      <div className="h-3 w-1/2 rounded bg-[#CDD5DB]/30 mb-4" />
      <div className="h-3 w-1/3 rounded bg-[#CDD5DB]/30 mb-2" />
      <div className="h-3 w-1/4 rounded bg-[#CDD5DB]/30 mb-4" />
      <div className="flex gap-2">
        <div className="h-9 w-full rounded-full bg-[#CDD5DB]/30" />
        <div className="h-9 w-full rounded-full bg-[#CDD5DB]/30" />
      </div>
    </div>
  );
}

function EmptyState({ hasFilters, onClearFilters, onAddProduct }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6 rounded-3xl bg-[#CDD5DB]/20 border border-[#CDD5DB]">
      <div className="h-16 w-16 rounded-full bg-[#E3C39D]/40 flex items-center justify-center mb-5 border border-[#A68868]/40 text-[#A68868]">
        <Package className="w-8 h-8" />
      </div>
      <h3 className="text-black text-lg font-black mb-1">
        {hasFilters ? "No products match your filters" : "No products found"}
      </h3>
      <p className="text-black/70 text-xs font-bold max-w-sm mb-6">
        {hasFilters
          ? "Try adjusting your search query or category & status filters."
          : "Add your first handcrafted jewellery piece to publish it to retailers."}
      </p>
      {hasFilters ? (
        <button
          onClick={onClearFilters}
          className="px-5 py-2.5 rounded-full bg-[#A68868] text-white text-xs font-black hover:bg-[#8A6D4F] transition-all shadow-xs"
        >
          Clear filters
        </button>
      ) : (
        <button
          onClick={onAddProduct}
          className="px-5 py-2.5 rounded-full bg-[#A68868] text-white text-xs font-black hover:bg-[#8A6D4F] transition-all flex items-center gap-2 shadow-xs"
        >
          <Plus className="w-4 h-4 text-white" /> Add Product
        </button>
      )}
    </div>
  );
}

function ConfirmDeleteModal({ product, onConfirm, onCancel, isDeleting }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs"
        onClick={!isDeleting ? onCancel : undefined}
      />
      <div className="relative w-full max-w-sm rounded-3xl bg-white border border-[#CDD5DB] shadow-md p-6">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h3 className="text-black text-lg font-black mb-2">
          Discontinue product?
        </h3>
        <p className="text-black/70 text-xs font-bold mb-6 leading-relaxed">
          This will set <span className="text-black font-black">{product.name}</span> to discontinued status in your catalogue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-full border border-[#CDD5DB] text-black text-xs font-black hover:bg-[#E3C39D]/30 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 rounded-full bg-rose-600 text-white text-xs font-black hover:bg-rose-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductDetailsModal({ product, onClose, onEdit }) {
  if (!product) return null;

  const categoryName = product.category?.name || product.category_name || product.categories?.name || "Jewellery";
  const priceVal = parseFloat(product.manufacturer_price || product.price || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-3xl bg-white border border-[#CDD5DB] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#CDD5DB] bg-[#F8F6F2]">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-[#A68868] bg-[#E3C39D]/30 px-3 py-1 rounded-full border border-[#A68868]/30">
              {categoryName}
            </span>
            <h2 className="text-xl font-black text-black mt-1.5">{product.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 text-black/70 hover:text-black transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <div className="relative h-64 rounded-2xl overflow-hidden bg-white border border-[#CDD5DB]">
              <img
                src={product.image_url || product.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60"}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#E3C39D]/20 border border-[#A68868]/30">
                <span className="text-[10px] font-black text-[#A68868] uppercase tracking-wider">Master Wholesale Price</span>
                <p className="text-2xl font-black text-black mt-1">₹{priceVal.toLocaleString("en-IN")}</p>
              </div>

              <div className="space-y-2 text-xs font-bold text-black/80">
                <div className="flex justify-between py-1.5 border-b border-[#CDD5DB]">
                  <span>Status</span>
                  <span className="font-black text-black uppercase">{product.status || "ACTIVE"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#CDD5DB]">
                  <span>Material</span>
                  <span className="font-black text-black">{product.material || "Gold"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#CDD5DB]">
                  <span>Purity / Karat</span>
                  <span className="font-black text-black">{product.purity || "22K"}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#CDD5DB]">
                  <span>Weight</span>
                  <span className="font-black text-black">{product.weight ? `${product.weight} g` : "N/A"}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span>Stock Quantity</span>
                  <span className="font-black text-black">{product.stock ?? 1} units</span>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h4 className="text-xs font-black uppercase text-black/60 tracking-wider mb-2">Description</h4>
              <p className="text-xs font-bold text-black/80 leading-relaxed bg-[#F8F6F2] p-4 rounded-2xl border border-[#CDD5DB]">
                {product.description}
              </p>
            </div>
          )}

          {/* Pricing & Stone Specs */}
          {(product.making_charge_value != null || product.stone_price > 0 || product.stone_details) && (
            <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#CDD5DB] space-y-2">
              <h4 className="text-xs font-black uppercase text-[#A68868] tracking-wider mb-1">Making Charges & Stone Specs</h4>
              {product.making_charge_value != null && (
                <div className="flex justify-between text-xs font-bold">
                  <span>Making Charge:</span>
                  <span className="font-black">{product.making_charge_value} ({product.making_charge_type || "PERCENTAGE"})</span>
                </div>
              )}
              {product.stone_price > 0 && (
                <div className="flex justify-between text-xs font-bold">
                  <span>Stone Price:</span>
                  <span className="font-black">₹{product.stone_price}</span>
                </div>
              )}
              {product.stone_details && (
                <div className="text-xs font-bold pt-1.5 border-t border-[#CDD5DB]">
                  <span className="text-black/60">Stone Specs: </span>
                  <span>{product.stone_details}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#CDD5DB] bg-[#F8F6F2] flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-full border border-[#CDD5DB] text-black text-xs font-black hover:bg-white transition-all cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="flex-1 py-2.5 rounded-full bg-[#A68868] text-white text-xs font-black hover:bg-[#8A6D4F] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Edit className="w-4 h-4" /> Edit Product
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onDeleteRequest, onViewDetails }) {
  const categoryName = product.category?.name || product.category_name || product.categories?.name || "Jewellery";
  return (
    <div className="group relative rounded-3xl bg-white border border-[#CDD5DB] overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between">
      <div>
        {/* Image Header */}
        <div
          onClick={() => onViewDetails && onViewDetails(product)}
          className="relative h-48 w-full overflow-hidden bg-white cursor-pointer"
        >
          <img
            src={product.image_url || product.image || product.img_url || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60"}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60";
            }}
          />
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${getStatusStyle(
                product.status
              )}`}
            >
              {product.status || "ACTIVE"}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#A68868] bg-[#E3C39D]/30 px-2.5 py-0.5 rounded-full border border-[#A68868]/30">
              {categoryName}
            </span>
            <span className="text-xs font-black text-black">
              ₹{parseFloat(product.manufacturer_price || product.price || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <h3
            onClick={() => onViewDetails && onViewDetails(product)}
            className="text-base font-black text-black line-clamp-1 group-hover:text-[#A68868] transition-colors cursor-pointer"
          >
            {product.name}
          </h3>

          <p className="text-xs text-black/70 font-bold line-clamp-2 leading-relaxed">
            {product.description || "Handcrafted fine jewellery design."}
          </p>

          <div className="pt-2 border-t border-[#CDD5DB] flex items-center justify-between text-xs text-black/70 font-bold">
            <span>Stock: {product.stock ?? 1}</span>
            <span>{product.material || "Gold"} • {product.purity || "22K"}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 pt-0 flex items-center gap-2">
        <button
          onClick={() => onViewDetails && onViewDetails(product)}
          className="flex-1 py-2 rounded-full bg-[#E3C39D]/30 border border-[#A68868]/30 hover:bg-[#A68868] hover:text-white text-black text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer group/btn"
        >
          <Eye className="w-3.5 h-3.5 text-[#A68868] group-hover/btn:text-white transition-colors" /> View Details
        </button>
        <button
          onClick={() => onEdit(product)}
          className="p-2 rounded-full bg-white border border-[#CDD5DB] hover:bg-[#E3C39D]/30 text-black transition-all shadow-xs cursor-pointer"
          title="Edit Product"
        >
          <Edit className="w-3.5 h-3.5 text-[#A68868]" />
        </button>
        <button
          onClick={() => onDeleteRequest(product)}
          className="p-2 rounded-full bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all cursor-pointer"
          title="Discontinue Product"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [productToDelete, setProductToDelete] = useState(null);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleViewDetails = (prod) => {
    setSelectedProductDetails(prod);
  };

  const handleCloseDetails = () => {
    setSelectedProductDetails(null);
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Primary path: Attempt Express API backend
      try {
        const res = await api.get("/products/my-products");
        const fetched = res.data?.data || res.data || [];
        setProducts(Array.isArray(fetched) ? fetched : []);
        return;
      } catch (apiErr) {
        console.warn("Backend API fetch /products/my-products failed, executing direct Supabase fallback:", apiErr?.response?.data?.message || apiErr.message);
      }

      // 2. Fallback path: Direct Supabase Client query
      const { data: { session } } = await supabase.auth.getSession();
      const authUser = session?.user;
      if (!authUser) {
        setProducts([]);
        return;
      }

      // Fetch manufacturer profile
      const { data: mfg } = await supabase
        .from("manufacturers")
        .select("id")
        .eq("user_id", authUser.id)
        .maybeSingle();

      if (!mfg) {
        setProducts([]);
        return;
      }

      // Fetch products for this manufacturer from unified products table
      const { data: prods, error: prodErr } = await supabase
        .from("products")
        .select("*, category:categories(id, name)")
        .eq("manufacturer_id", mfg.id)
        .order("created_at", { ascending: false });

      if (prodErr) {
        // Try fallback table manufacturer_products
        const { data: legacyProds } = await supabase
          .from("manufacturer_products")
          .select("*, category:categories(id, name)")
          .eq("manufacturer_id", mfg.id)
          .order("created_at", { ascending: false });

        setProducts(Array.isArray(legacyProds) ? legacyProds : []);
      } else {
        setProducts(Array.isArray(prods) ? prods : []);
      }
    } catch (err) {
      console.error("Fetch products error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to load products.");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      const c = p.category?.name || p.category_name || p.categories?.name;
      if (c) set.add(c);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());
      const cat = p.category?.name || p.category_name || p.categories?.name;
      const matchesCategory =
        categoryFilter === "all" || cat === categoryFilter;
      const pStatus = String(p.status || "active").toLowerCase();
      const matchesStatus =
        statusFilter === "all"
          ? pStatus !== "discontinued"
          : pStatus === statusFilter.toLowerCase();

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const activeProductCount = useMemo(() => {
    return products.filter((p) => String(p.status || "").toLowerCase() !== "discontinued").length;
  }, [products]);

  const hasActiveFilters =
    searchTerm !== "" || categoryFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const handleEdit = (prod) => {
    const id = prod.id || prod._id;
    navigate(`/manufacturer/products/edit/${id}`);
  };

  const handleDeleteRequest = (prod) => {
    setProductToDelete(prod);
  };

  const handleCancelDelete = () => {
    setProductToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    const targetId = productToDelete.id || productToDelete._id;
    try {
      await api.delete(`/products/${targetId}`);
      setProducts((prev) => prev.filter((p) => p.id !== targetId && p._id !== targetId));
      setProductToDelete(null);
      await fetchProducts();
    } catch (err) {
      console.error("Error deleting product:", err);
      setError(err?.response?.data?.message || "Failed to delete product.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black">
      <Navbar />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-black">
                Product Catalogue
              </h1>
              <p className="text-xs text-black/70 font-bold mt-1">
                Manage products, inventory levels, and pricing — {activeProductCount} active item
                {activeProductCount !== 1 ? "s" : ""} total
              </p>
            </div>
            <button
              onClick={() => navigate("/manufacturer/products/add")}
              className="px-5 py-2.5 rounded-full bg-[#A68868] text-white text-xs font-black hover:bg-[#8A6D4F] transition-all flex items-center justify-center gap-2 self-start sm:self-auto shadow-md active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              Add Product
            </button>
          </div>

          {/* Filters Bar */}
          <div className="rounded-3xl bg-white border border-[#CDD5DB] p-4 mb-6 shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68868]" />
              <input
                type="text"
                placeholder="Search jewellery by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] transition-all"
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3.5 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold text-xs focus:outline-none focus:border-[#A68868] transition-all"
              >
                <option value="all" className="bg-white">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-white">
                    {cat}
                  </option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold text-xs focus:outline-none focus:border-[#A68868] transition-all"
              >
                <option value="all" className="bg-white">All Statuses</option>
                <option value="active" className="bg-white">Active</option>
                <option value="discontinued" className="bg-white">Discontinued</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="px-3.5 py-2 rounded-full bg-[#CDD5DB]/30 hover:bg-[#CDD5DB]/50 text-black text-xs font-black transition-all"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Content Area */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center">
              <p className="text-rose-900 text-xs font-black mb-3">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-4 py-2 rounded-full bg-[#A68868] text-xs font-black text-white hover:bg-[#8A6D4F]"
              >
                Retry
              </button>
            </div>
          ) : paginatedProducts.length === 0 ? (
            <EmptyState
              hasFilters={hasActiveFilters}
              onClearFilters={clearFilters}
              onAddProduct={() => navigate("/manufacturer/products/add")}
            />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {paginatedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id || prod._id}
                    product={prod}
                    onEdit={handleEdit}
                    onDeleteRequest={handleDeleteRequest}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-[#CDD5DB]">
                  <p className="text-xs font-black text-black">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30 disabled:opacity-40 transition-all shadow-xs"
                    >
                      <ChevronLeft className="w-4 h-4 text-[#A68868]" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30 disabled:opacity-40 transition-all shadow-xs"
                    >
                      <ChevronRight className="w-4 h-4 text-[#A68868]" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          <ConfirmDeleteModal
            product={productToDelete}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
            isDeleting={isDeleting}
          />

          <ProductDetailsModal
            product={selectedProductDetails}
            onClose={handleCloseDetails}
            onEdit={handleEdit}
          />
        </main>
      </div>
    </div>
  );
}