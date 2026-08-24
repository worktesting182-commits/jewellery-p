import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  PackageCheck,
  PackageX,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  Gem,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import StatsCard from "../../components/manufacturer/StatsCard";
import Navbar from "../../components/manufacturer/Navbar";
import Sidebar from "../../components/manufacturer/Sidebar";
import api from "../../services/api";

export default function Dashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await api.get("/products/my-products");
      const fetched = response.data?.data || response.data || [];
      setProducts(Array.isArray(fetched) ? fetched : []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  // Active non-discontinued products
  const activeProducts = useMemo(() => {
    return products.filter((p) => String(p.status || "").toUpperCase() !== "DISCONTINUED");
  }, [products]);

  // Metrics
  const totalProducts = activeProducts.length;
  const availableProducts = activeProducts.filter((p) => {
    const stockVal = p.stock != null ? Number(p.stock) : 1;
    return stockVal > 0;
  }).length;
  const outOfStock = activeProducts.filter((p) => {
    return p.stock != null && Number(p.stock) === 0;
  }).length;
  const totalInventoryValue = activeProducts.reduce(
    (acc, p) => acc + (parseFloat(p.manufacturer_price || p.price || 0) * (p.stock != null ? Number(p.stock) : 1)),
    0
  );

  // Categories list for quick filtering
  const categories = useMemo(() => {
    const set = new Set();
    activeProducts.forEach((p) => {
      const catName = p.categories?.name || p.category_name;
      if (catName) set.add(catName);
    });
    return Array.from(set);
  }, [activeProducts]);

  // Filtered recent products
  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const catName = p.categories?.name || p.category_name;
      const matchesCat = selectedCategory === "ALL" || catName === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [activeProducts, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black">
      <Navbar />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl space-y-8">
        
        {/* Top Header Banner */}
        <div className="relative rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#E3C39D]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-xs font-black text-black uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#A68868]" />
                <span>Manufacturer Workspace</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">
                Jewellery Portal Dashboard
              </h1>
              <p className="text-sm text-black/80 font-bold max-w-xl">
                Manage your handcrafted collections, track inventory stock, and publish new jewellery designs to authorized retailers.
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-3 rounded-full bg-white border border-[#CDD5DB] hover:bg-[#E3C39D]/30 text-[#A68868] hover:text-black transition-all cursor-pointer shadow-xs disabled:opacity-50"
                title="Refresh Data"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} />
              </button>

              <button
                onClick={() => navigate("/manufacturer/products/add")}
                className="flex items-center gap-2.5 px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs transition-all duration-300 shadow-md hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="w-5 h-5 stroke-[2.5]" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Catalog"
            value={totalProducts}
            icon={Boxes}
            loading={loading}
            subtitle="Registered items"
          />

          <StatsCard
            title="Active Inventory"
            value={availableProducts}
            icon={PackageCheck}
            loading={loading}
            subtitle="Ready for order"
          />

          <StatsCard
            title="Out of Stock"
            value={outOfStock}
            icon={PackageX}
            loading={loading}
            subtitle="Requires restocking"
          />

          <StatsCard
            title="Total Stock Value"
            value={`₹${totalInventoryValue.toLocaleString("en-IN")}`}
            icon={TrendingUp}
            loading={loading}
            subtitle="Estimated catalog worth"
          />
        </div>

        {/* Recent Products Section */}
        <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Section Header & Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#CDD5DB]">
            <div>
              <h2 className="text-xl font-black text-black flex items-center gap-2.5">
                <Gem className="w-5 h-5 text-[#A68868]" />
                Recent Product Catalog
              </h2>
              <p className="text-xs text-black/70 font-bold mt-0.5">
                Quick view of your active inventory items and stock levels
              </p>
            </div>

            {/* Search & Category Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search Bar */}
              <div className="relative flex items-center min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3.5 text-[#A68868] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 rounded-full bg-white border border-[#CDD5DB] focus:border-[#A68868] text-xs font-black text-black placeholder-black/40 outline-none transition-all"
                />
              </div>

              {/* Category Dropdown */}
              {categories.length > 0 && (
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3.5 py-2 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black outline-none cursor-pointer hover:border-[#A68868] transition-all"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <RefreshCw className="animate-spin h-8 w-8 text-[#A68868]" />
              <p className="text-xs font-black text-black">Loading catalog...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-14 px-4 rounded-3xl bg-[#CDD5DB]/20 border border-[#CDD5DB] space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#E3C39D]/40 flex items-center justify-center border border-[#A68868]/40 text-[#A68868]">
                <Gem className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-black">No Products Found</h3>
                <p className="text-xs text-black/70 font-bold max-w-sm">
                  {searchQuery || selectedCategory !== "ALL"
                    ? "No products match your search or filter criteria. Try clearing search filters."
                    : "You haven't added any products to your manufacturer catalog yet."}
                </p>
              </div>

              <button
                onClick={() => navigate("/manufacturer/products/add")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A68868] text-white font-black text-xs transition-all shadow-md hover:scale-105 cursor-pointer mt-2"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Add Your First Product</span>
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#CDD5DB]">
              <table className="w-full text-left text-xs text-black">
                <thead className="bg-[#CDD5DB]/30 text-black uppercase font-black text-[11px] tracking-wider border-b border-[#CDD5DB]">
                  <tr>
                    <th className="py-3.5 px-4">Product</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Specs</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Stock</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CDD5DB] bg-white">
                  {filteredProducts.slice(0, 8).map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-[#E3C39D]/20 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-black text-black flex items-center gap-3">
                        <img
                          src={product.image_url || "https://via.placeholder.com/80?text=Jewellery"}
                          alt={product.name}
                          className="w-10 h-10 rounded-xl object-cover bg-white border border-[#CDD5DB]"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/80?text=Jewellery";
                          }}
                        />
                        <div>
                          <p className="text-sm font-black text-black group-hover:text-[#A68868] transition-colors">
                            {product.name}
                          </p>
                          <p className="text-[10px] text-black/70 font-bold line-clamp-1">
                            {product.description || "Handcrafted jewellery piece"}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-black text-[#A68868]">
                        {product.categories?.name || product.category_name || "Jewellery"}
                      </td>

                      <td className="py-3.5 px-4 text-black">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#CDD5DB]/30 border border-[#CDD5DB] text-[11px] font-bold">
                          {product.material || "Gold"} • {product.purity || "22K"}
                          {product.weight && ` (${product.weight}g)`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-black text-black">
                        ₹{parseFloat(product.manufacturer_price || product.price || 0).toLocaleString("en-IN")}
                      </td>

                      <td className="py-3.5 px-4">
                        {(product.stock ?? 1) > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-black">
                            {product.stock ?? 1} available
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[11px] font-black">
                            Out of Stock
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                            product.status === "DISCONTINUED"
                              ? "bg-rose-100 text-rose-900 border-rose-300"
                              : "bg-[#E3C39D]/40 text-black border-[#A68868]/40"
                          }`}
                        >
                          {product.status || "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  </div>
  );
}