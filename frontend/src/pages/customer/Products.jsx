import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../services/api";
import ProductCard from "../../components/customer/ProductCard";
import SearchBar from "../../components/customer/SearchBar";
import CategoryFilter from "../../components/customer/CategoryFilter";
import PriceFilter from "../../components/customer/PriceFilter";
import MaterialFilter from "../../components/customer/MaterialFilter";
import StockFilter from "../../components/customer/StockFilter";
import SortDropdown from "../../components/customer/SortDropdown";
import { Package, Sparkles, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const PRODUCTS_PER_PAGE = 8;

export default function CustomerProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const initialCategory = searchParams.get("category") || "ALL";

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state (Category, Material, Price range, Stock status)
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedMaterial, setSelectedMaterial] = useState("ALL");
  const [selectedStock, setSelectedStock] = useState("ALL");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  // Mobile Filter Overlay Toggle
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchProducts();
    fetchCategories();

    window.addEventListener("productsUpdated", fetchProducts);
    window.addEventListener("focus", fetchProducts);
    return () => {
      window.removeEventListener("productsUpdated", fetchProducts);
      window.removeEventListener("focus", fetchProducts);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/products");
      const data = res.data?.data || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Failed to load products from marketplace API.");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const data = res.data?.data || res.data || [];
      if (Array.isArray(data) && data.length > 0) {
        setCategories(data);
      } else {
        setCategories([
          { name: "Rings" },
          { name: "Necklaces" },
          { name: "Earrings" },
          { name: "Bracelets" },
          { name: "Pendants" },
          { name: "Bangles" },
          { name: "Anklets" },
        ]);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Combinable Filter & Sort Logic
  const filteredAndSortedProducts = useMemo(() => {
    let list = [...products];

    // 1. Search Query Filter (Name, Category, Material)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const nameMatch = (p.name || "").toLowerCase().includes(q);
        const categoryMatch = (p.categories?.name || p.category_name || "").toLowerCase().includes(q);
        const materialMatch = (
          (p.metal_type || "") +
          " " +
          (p.material || "") +
          " " +
          (p.purity || "") +
          " " +
          (p.description || "")
        ).toLowerCase().includes(q);

        return nameMatch || categoryMatch || materialMatch;
      });
    }

    // 2. Category Filter
    if (selectedCategory && selectedCategory !== "ALL" && selectedCategory !== "All Categories") {
      const sel = selectedCategory.trim().toLowerCase();
      const selStem = sel.replace(/s$/, "");
      const selWords = selStem.split(/[\s&,/]+/).filter((w) => w.length > 2);

      list = list.filter((p) => {
        const catName = (
          p.category_name ||
          p.categories?.name ||
          p.category?.name ||
          p.manufacturer_product?.category?.name ||
          ""
        ).toLowerCase();

        const catId = (p.category_id || p.categories?.id || "").toLowerCase();
        const prodName = (p.name || "").toLowerCase();

        // A. Direct exact match
        if (catName === sel || catId === sel) return true;

        // B. Stem match on category name
        const catStem = catName.replace(/s$/, "");
        if (catStem === selStem) return true;

        const catWords = catStem.split(/[\s&,/]+/).filter((w) => w.length > 2);
        if (selWords.some((w) => catWords.includes(w)) || catWords.some((w) => selWords.includes(w))) {
          return true;
        }

        // C. Stem match on product name (only if full word matches, e.g. "Gold Ring" matches "Ring", but NOT "Earring")
        const prodWords = prodName.replace(/s$/, "").split(/[\s&,/]+/).filter((w) => w.length > 2);
        if (selWords.some((w) => prodWords.includes(w))) {
          return true;
        }

        return false;
      });
    }

    // 3. Material Filter
    if (selectedMaterial !== "ALL") {
      const m = selectedMaterial.toLowerCase();
      list = list.filter((p) => {
        const metal = (p.metal_type || "").toLowerCase();
        const mat = (p.material || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        return metal.includes(m) || mat.includes(m) || desc.includes(m);
      });
    }

    // 4. Stock Status Filter
    if (selectedStock !== "ALL") {
      list = list.filter((p) => {
        const count = p.stock !== undefined ? p.stock : p.stock_quantity !== undefined ? p.stock_quantity : 1;
        if (selectedStock === "IN_STOCK") return count > 0;
        if (selectedStock === "OUT_OF_STOCK") return count <= 0;
        return true;
      });
    }

    // 5. Min Price Filter
    if (minPrice && !isNaN(minPrice)) {
      list = list.filter((p) => Number(p.price) >= Number(minPrice));
    }

    // 6. Max Price Filter
    if (maxPrice && !isNaN(maxPrice)) {
      list = list.filter((p) => Number(p.price) <= Number(maxPrice));
    }

    // 7. Sort logic
    list.sort((a, b) => {
      if (sortBy === "price_asc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price_desc") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "name_asc") return (a.name || "").localeCompare(b.name || "");
      // Default: newest
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    return list;
  }, [products, searchQuery, selectedCategory, selectedMaterial, selectedStock, minPrice, maxPrice, sortBy]);

  // Reset Page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedMaterial, selectedStock, minPrice, maxPrice, sortBy]);

  // Pagination bounds
  const totalPages = Math.ceil(filteredAndSortedProducts.length / PRODUCTS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredAndSortedProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [filteredAndSortedProducts, currentPage]);

  const hasActiveFilters =
    searchQuery ||
    selectedCategory !== "ALL" ||
    selectedMaterial !== "ALL" ||
    selectedStock !== "ALL" ||
    minPrice ||
    maxPrice;

  const handleClearAllFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setSelectedMaterial("ALL");
    setSelectedStock("ALL");
    setMinPrice("");
    setMaxPrice("");
    setSortBy("newest");
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Header Banner */}
      <div className="relative rounded-3xl bg-[#CDD5DB]/30 border border-[#CDD5DB] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-black text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#A68868]" />
              <span>Full Marketplace Catalogue</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-black">
              Handcrafted Jewellery Collection
            </h1>
            <p className="text-xs sm:text-sm text-black/80 mt-1 font-bold">
              Browse hallmarked gold, silver, and diamond designs from verified artisans.
            </p>
          </div>

          {/* Quick Search */}
          <div className="w-full md:w-80">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </div>

      {/* Category Bar */}
      <div className="space-y-4">
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            setSelectedCategory(cat);
            setSearchParams(cat !== "ALL" ? { category: cat } : {});
          }}
        />
      </div>

      {/* Main Content Layout (Left Filter Sidebar + Right Products Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Desktop Left Combinable Filter Sidebar */}
        <aside className="hidden lg:block space-y-6">
          <div className="sticky top-24 space-y-6 bg-white p-5 rounded-3xl border border-[#CDD5DB] shadow-xs">
            
            {/* Price Filter */}
            <PriceFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onReset={() => {
                setMinPrice("");
                setMaxPrice("");
              }}
            />

            {/* Material Filter */}
            <MaterialFilter
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
            />

            {/* Stock Status Filter */}
            <StockFilter
              selectedStock={selectedStock}
              onSelectStock={setSelectedStock}
            />

            {/* Clear All Filters Button */}
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="w-full py-2.5 rounded-full bg-[#CDD5DB]/40 hover:bg-[#E3C39D]/50 border border-[#CDD5DB] text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <X className="w-4 h-4 text-[#A68868]" /> Clear All Filters
              </button>
            )}
          </div>
        </aside>

        {/* Right Main Grid */}
        <main className="lg:col-span-3 space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB] shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden px-3.5 py-2 rounded-full bg-[#A68868] text-white text-xs font-black flex items-center gap-2"
              >
                <Filter className="w-4 h-4 text-white" /> Filters
              </button>
              <span className="text-xs font-black text-black">
                Showing <strong className="text-black">{filteredAndSortedProducts.length}</strong> products
              </span>
            </div>

            <SortDropdown value={sortBy} onChange={setSortBy} />
          </div>

          {/* Error Alert View */}
          {error ? (
            <div className="text-center py-16 px-6 rounded-3xl bg-rose-50 border border-rose-200 space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <X className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-rose-900">Unable to load products</h3>
              <p className="text-xs font-bold text-rose-700 max-w-sm mx-auto">{error}</p>
              <button
                onClick={fetchProducts}
                className="px-5 py-2.5 rounded-full bg-rose-600 text-white text-xs font-black transition-all shadow-xs"
              >
                Try Again
              </button>
            </div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="rounded-3xl bg-white border border-[#CDD5DB] p-4 animate-pulse">
                  <div className="aspect-square rounded-2xl bg-[#CDD5DB]/40 mb-4" />
                  <div className="h-4 w-3/4 bg-[#CDD5DB]/40 rounded mb-2" />
                  <div className="h-3 w-1/2 bg-[#CDD5DB]/40 rounded mb-4" />
                  <div className="h-5 w-1/3 bg-[#CDD5DB]/40 rounded" />
                </div>
              ))}
            </div>
          ) : paginatedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-6 rounded-3xl bg-white border border-[#CDD5DB] space-y-4 shadow-xs">
              <Package className="w-12 h-12 text-[#A68868] mx-auto" />
              <h3 className="text-lg font-black text-black">No products found</h3>
              <p className="text-xs font-bold text-black/80 max-w-sm mx-auto">
                No products match your current search query or active filter combination.
              </p>
              <button
                onClick={handleClearAllFilters}
                className="px-6 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black shadow-xs transition-all"
              >
                Clear all filters
              </button>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#CDD5DB]">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black text-xs font-black disabled:opacity-40 flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4 text-[#A68868]" /> Previous
              </button>

              <span className="text-xs font-black text-black">
                Page <strong className="text-black">{currentPage}</strong> of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black text-xs font-black disabled:opacity-40 flex items-center gap-1 shadow-xs"
              >
                Next <ChevronRight className="w-4 h-4 text-[#A68868]" />
              </button>
            </div>
          )}

        </main>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs lg:hidden">
          <div className="w-full max-w-xs bg-[#F8F6F2] border-l border-[#CDD5DB] p-6 space-y-6 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <h3 className="text-base font-black text-black">Filter Products</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-1.5 rounded-full bg-[#CDD5DB]/50 text-[#A68868]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <PriceFilter
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onReset={() => {
                setMinPrice("");
                setMaxPrice("");
              }}
            />

            <MaterialFilter
              selectedMaterial={selectedMaterial}
              onSelectMaterial={setSelectedMaterial}
            />

            <StockFilter
              selectedStock={selectedStock}
              onSelectStock={setSelectedStock}
            />

            <div className="flex gap-2">
              <button
                onClick={handleClearAllFilters}
                className="flex-1 py-3 rounded-full bg-[#CDD5DB]/40 text-black text-xs font-black border border-[#CDD5DB]"
              >
                Reset All
              </button>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 py-3 rounded-full bg-[#A68868] text-white text-xs font-black shadow-xs"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
