import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  Ban,
  Building2,
  Layers,
  Tag,
  DollarSign,
  Package,
  Lock,
  Sparkles,
  X,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { adminAPI, categoryAPI } from "../../services/api";
import ProductTable from "../../components/admin/ProductTable";

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewProd, setViewProd] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [categoryFilter, statusFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        adminAPI.getProducts({ category: categoryFilter, status: statusFilter }),
        categoryAPI.getCategories(),
      ]);

      const prodData = prodRes.data?.data || prodRes.data?.products || [];
      const catData = catRes.data?.data || catRes.data || [];

      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err) {
      console.error("Error fetching admin products:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleToggleStatus = async (prodId, prodTitle, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      setUpdatingId(prodId);
      await adminAPI.updateProductStatus(prodId, newStatus);
      showToast(`Product "${prodTitle}" status updated to ${newStatus}`);
      fetchInitialData();
    } catch (err) {
      console.error("Error updating product status:", err);
      showToast(err.response?.data?.message || "Failed to update product status", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.manufacturer?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = categoryFilter === "ALL" || p.category_id === categoryFilter || p.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesStatus = statusFilter === "ALL" || (p.status || "").toUpperCase() === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
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
            <ShoppingBag className="w-3.5 h-3.5 text-[#A68868]" /> Module 6 – Master Catalog Quality & Compliance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Manufacturer Products
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Monitor wholesale master products created by artisan manufacturers, inspect pricing, categories, and manage product compliance or active status.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Product, Manufacturer, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>

      {/* Admin Ownership Policy Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs flex items-start gap-3 text-xs text-black font-bold">
        <div className="p-2 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868] shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-black text-black block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A68868]" /> Product Ownership Rule
          </span>
          <p className="text-black/70 font-bold leading-relaxed">
            Admin should not edit product details owned by manufacturers. Product titles, pricing, descriptions, and master specifications remain under the exclusive control of manufacturer owners. Admin can inspect or disable non-compliant listings.
          </p>
        </div>
      </div>

      {/* Filters: Category & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs">
        {/* Category Filter */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-black text-black/70 shrink-0">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-1.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-black text-black/70 shrink-0 mr-1">Status:</span>
          {["ALL", "ACTIVE", "DISABLED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-[#A68868] text-white shadow-xs"
                  : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
              }`}
            >
              {s === "ALL" ? "All Statuses" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading manufacturer master catalog products...</p>
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-black">
              <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Manufacturer</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Manufacturer Price</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#CDD5DB] font-bold">
                {filteredProducts.map((prod) => {
                  const statusUpper = (prod.status || "ACTIVE").toUpperCase();

                  return (
                    <tr key={prod.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                      {/* 1. Image */}
                      <td className="px-6 py-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#CDD5DB] overflow-hidden shrink-0">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80";
                            }}
                          />
                        </div>
                      </td>

                      {/* 2. Product Name */}
                      <td className="px-6 py-4 font-black text-black">
                        <div>
                          <span className="block font-black text-black">{prod.title}</span>
                          <span className="block text-[10px] text-black/70 font-mono">SKU: {prod.sku}</span>
                        </div>
                      </td>

                      {/* 3. Manufacturer */}
                      <td className="px-6 py-4 font-black text-[#A68868]">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-[#A68868]" />
                          <span>{prod.manufacturer}</span>
                        </div>
                      </td>

                      {/* 4. Category */}
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-[#E3C39D]/40 text-black font-black text-[11px] border border-[#A68868]/40 inline-flex items-center gap-1">
                          <Layers className="w-3 h-3 text-[#A68868]" /> {prod.category}
                        </span>
                      </td>

                      {/* 5. Manufacturer Price */}
                      <td className="px-6 py-4 font-black text-black font-mono text-sm">
                        ₹{Number(prod.manufacturer_price || 0).toLocaleString("en-IN")}
                      </td>

                      {/* 6. Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                            statusUpper === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                              : "bg-rose-100 text-rose-950 border-rose-300"
                          }`}
                        >
                          {statusUpper}
                        </span>
                      </td>

                      {/* Actions: View, Disable/Enable */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* View */}
                          <button
                            onClick={() => setViewProd(prod)}
                            className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="View Product Details"
                          >
                            <Eye className="w-4 h-4 text-[#A68868]" />
                          </button>

                          {/* Disable / Enable Action */}
                          <button
                            onClick={() => handleToggleStatus(prod.id, prod.title, statusUpper)}
                            disabled={updatingId === prod.id}
                            className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                              statusUpper === "ACTIVE"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300"
                            }`}
                          >
                            {statusUpper === "ACTIVE" ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No products found matching current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View Product Modal (Read-Only Inspection) */}
      {viewProd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868] font-black">
                  <ShoppingBag className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">{viewProd.title}</h3>
                  <span className="text-[11px] text-black/70 font-bold">Master Wholesale Catalog Item</span>
                </div>
              </div>

              <button
                onClick={() => setViewProd(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs font-bold">
              {/* Image Preview */}
              <div className="rounded-2xl bg-white border border-[#CDD5DB] overflow-hidden aspect-square">
                <img
                  src={viewProd.image}
                  alt={viewProd.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-2">
                  <div>
                    <span className="text-[10px] uppercase font-black text-black/70 block">Manufacturer</span>
                    <span className="font-black text-black text-sm block mt-0.5">{viewProd.manufacturer}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-black/70 block">Category</span>
                    <span className="font-black text-[#A68868] block">{viewProd.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-black/70 block">Wholesale Price</span>
                    <span className="font-mono text-lg font-black text-black block">
                      ₹{Number(viewProd.manufacturer_price || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                  <div>
                    <span className="text-[10px] uppercase font-black text-black/70 block">Stock Qty</span>
                    <span className="font-black text-black block">{viewProd.stock_quantity} units</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-black/70 block">Minimum Order</span>
                    <span className="font-black text-black block">{viewProd.moq} units</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                  <span className="text-[10px] uppercase font-black text-black/70 block">Eco Materials</span>
                  <span className="font-black text-black">{viewProd.materials}</span>
                </div>
              </div>
            </div>

            {viewProd.description && (
              <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-1 text-xs font-bold">
                <span className="text-[10px] uppercase font-black text-black/70 block">Product Description</span>
                <p className="text-black/80 leading-relaxed font-bold">{viewProd.description}</p>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[11px] text-black font-bold flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#A68868] shrink-0" />
              <span>Admin cannot edit product details owned by manufacturers.</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setViewProd(null)}
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

export default AdminProducts;
