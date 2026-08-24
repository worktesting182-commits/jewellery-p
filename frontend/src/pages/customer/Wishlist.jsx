import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, ShoppingBag, Sparkles, Trash2, Gem, ArrowLeft } from "lucide-react";
import ProductCard from "../../components/customer/ProductCard";

export default function CustomerWishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();

    const handleWishlistUpdated = () => {
      loadWishlist();
    };
    window.addEventListener("wishlistUpdated", handleWishlistUpdated);
    return () => window.removeEventListener("wishlistUpdated", handleWishlistUpdated);
  }, []);

  const loadWishlist = () => {
    try {
      const saved = localStorage.getItem("aura_wishlist");
      if (saved) {
        setWishlistItems(JSON.parse(saved));
      } else {
        setWishlistItems([]);
      }
    } catch (err) {
      console.error("Error reading wishlist:", err);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = (product) => {
    try {
      const saved = JSON.parse(localStorage.getItem("aura_wishlist") || "[]");
      const productId = product.id || product.product_id;
      const index = saved.findIndex(i => (i.id || i.product_id) === productId);

      let updated;
      if (index > -1) {
        updated = saved.filter(i => (i.id || i.product_id) !== productId);
      } else {
        updated = [...saved, product];
      }

      localStorage.setItem("aura_wishlist", JSON.stringify(updated));
      setWishlistItems(updated);
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  const handleClearWishlist = () => {
    if (window.confirm("Are you sure you want to clear your wishlist?")) {
      localStorage.removeItem("aura_wishlist");
      setWishlistItems([]);
      window.dispatchEvent(new Event("wishlistUpdated"));
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center space-y-4 py-20">
        <div className="w-12 h-12 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-black font-black tracking-wider uppercase">Loading your wishlist...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#CDD5DB] pb-6">
        <div>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-1.5 text-xs text-[#A68868] hover:text-black font-extrabold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> Continue Shopping
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-black flex items-center gap-3">
            <Heart className="w-7 h-7 text-rose-500 fill-rose-500" /> My Saved Wishlist
          </h1>
          <p className="text-xs font-bold text-black/80 mt-1">
            Review your favorite handcrafted jewellery designs direct from master artisans
          </p>
        </div>

        {wishlistItems.length > 0 && (
          <button
            onClick={handleClearWishlist}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-700 text-xs font-extrabold transition-all shadow-xs"
          >
            <Trash2 className="w-4 h-4" /> Clear Wishlist
          </button>
        )}
      </div>

      {wishlistItems.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-16 text-center rounded-3xl bg-[#CDD5DB]/30 border border-[#CDD5DB] space-y-6 max-w-2xl mx-auto shadow-sm">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#E3C39D]/50 border border-[#A68868]/40 flex items-center justify-center text-rose-600 shadow-md">
            <Heart className="w-10 h-10 fill-rose-500 text-rose-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-black">Your Wishlist is Empty</h2>
            <p className="text-xs sm:text-sm font-bold text-black/80 max-w-md mx-auto leading-relaxed">
              Explore our certified eco-friendly gold, silver, and gemstone jewellery collection and save your favorites!
            </p>
          </div>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#A68868] text-white hover:bg-[#8A6D4F] text-xs font-black transition-all shadow-md"
          >
            <Gem className="w-4 h-4" /> Explore Catalogue
          </Link>
        </div>
      ) : (
        /* Wishlist Product Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((product) => (
            <ProductCard
              key={product.id || product.product_id}
              product={product}
              isWishlisted={true}
              onToggleWishlist={handleToggleWishlist}
            />
          ))}
        </div>
      )}
    </div>
  );
}
