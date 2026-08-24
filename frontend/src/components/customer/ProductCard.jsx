import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Eye, ShieldCheck, Sparkles, Leaf, Recycle, CheckCircle2, AlertCircle, ShoppingCart, Check } from "lucide-react";
import { cartAPI } from "../../services/api";

export default function ProductCard({ product, onToggleWishlist, isWishlisted = false }) {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [wishlisted, setWishlisted] = useState(isWishlisted);

  if (!product) return null;

  const {
    id,
    name,
    price,
    images,
    image_url,
    category_name,
    categories,
    purity,
    weight,
    stock,
    stock_quantity,
    manufacturers,
    carbon_score,
    recycled_percentage,
    is_recyclable,
  } = product;

  useEffect(() => {
    checkWishlist();
    window.addEventListener("wishlistUpdated", checkWishlist);
    return () => window.removeEventListener("wishlistUpdated", checkWishlist);
  }, [id, isWishlisted]);

  const checkWishlist = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("aura_wishlist") || "[]");
      const exists = saved.some(i => (i.id || i.product_id) === id);
      setWishlisted(exists || isWishlisted);
    } catch {
      setWishlisted(isWishlisted);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    try {
      const saved = JSON.parse(localStorage.getItem("aura_wishlist") || "[]");
      const index = saved.findIndex(i => (i.id || i.product_id) === id);
      let updated;
      if (index > -1) {
        updated = saved.filter(i => (i.id || i.product_id) !== id);
        setWishlisted(false);
      } else {
        updated = [...saved, product];
        setWishlisted(true);
      }
      localStorage.setItem("aura_wishlist", JSON.stringify(updated));
      window.dispatchEvent(new Event("wishlistUpdated"));
      if (onToggleWishlist) onToggleWishlist(product);
    } catch (err) {
      console.error("Error toggling wishlist:", err);
    }
  };

  const displayImage =
    (Array.isArray(images) && images.length > 0 ? images[0] : null) ||
    image_url ||
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";

  const categoryName = categories?.name || category_name || "Jewellery";
  const retailerName = product.retailer_name || product.shop_name || manufacturers?.company_name || "Artisan Retailer";
  const stockCount = stock !== undefined ? stock : stock_quantity !== undefined ? stock_quantity : 10;
  const isAvailable = stockCount > 0;

  const carbonDisplay = carbon_score || (weight ? `${(parseFloat(weight) * 0.15).toFixed(1)} kg CO₂e` : "1.8 kg CO₂e");
  const recycledDisplay = recycled_percentage !== undefined ? `${recycled_percentage}%` : is_recyclable ? "85%" : "70%";

  const handleQuickAddToCart = async (e) => {
    e.stopPropagation();
    if (!isAvailable || adding) return;
    try {
      setAdding(true);
      await cartAPI.addToCart(id, 1);
      setAdded(true);
      
      // Update local storage backup
      const saved = JSON.parse(localStorage.getItem("aura_cart") || "[]");
      const existingIndex = saved.findIndex(i => (i.id || i.product_id) === id);
      if (existingIndex > -1) {
        saved[existingIndex].quantity += 1;
      } else {
        saved.push({
          id: id,
          product_id: id,
          product_name: name,
          name: name,
          price: price,
          image_url: displayImage,
          quantity: 1,
          product: product
        });
      }
      localStorage.setItem("aura_cart", JSON.stringify(saved));
      window.dispatchEvent(new Event("cartUpdated"));

      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Error adding to cart:", err);
      alert(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="group relative rounded-3xl bg-white border border-[#CDD5DB] hover:border-[#A68868] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl overflow-hidden flex flex-col justify-between">
      
      {/* Image Container */}
      <div className="relative aspect-square w-full bg-[#CDD5DB]/20 overflow-hidden p-2">
        <img
          src={displayImage}
          alt={name}
          className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
          {purity && (
            <span className="px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#CDD5DB] text-[10px] font-black text-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3 h-3 text-[#A68868]" /> {purity}
            </span>
          )}
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide border flex items-center gap-1 backdrop-blur-md shadow-xs ${
              isAvailable
                ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                : "bg-rose-50 text-rose-900 border-rose-300"
            }`}
          >
            {isAvailable ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> In Stock ({stockCount})
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-rose-500" /> Out of Stock
              </>
            )}
          </span>
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleWishlistClick}
          className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md border transition-all z-10 shadow-xs ${
            wishlisted
              ? "bg-rose-100 border-rose-300 text-rose-600"
              : "bg-white/90 border-[#CDD5DB] text-[#A68868] hover:text-rose-600 hover:bg-rose-50"
          }`}
          title={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-4 h-4 ${wishlisted ? "fill-rose-500 text-rose-500" : ""}`} />
        </button>

        {/* Quick View Overlay Button */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-4">
          <Link
            to={`/customer/products/${id}`}
            className="w-full py-2.5 rounded-full bg-[#A68868] border border-white/40 text-white text-xs font-black text-center flex items-center justify-center gap-2 hover:bg-[#8A6D4F] transition-all shadow-md"
          >
            <Eye className="w-4 h-4 text-white" /> View Details
          </Link>
        </div>
      </div>

      {/* Product Content Body */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          {/* Category & Weight Header */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-[#A68868] uppercase tracking-wider">
              {categoryName}
            </span>
            {weight && (
              <span className="text-[10px] text-black bg-[#E3C39D]/40 px-2 py-0.5 rounded-full font-black border border-[#CDD5DB]">
                {weight}g
              </span>
            )}
          </div>

          {/* Product Name */}
          <Link to={`/customer/products/${id}`}>
            <h3 className="text-sm font-black text-black line-clamp-1 group-hover:text-[#A68868] transition-colors">
              {name}
            </h3>
          </Link>

          {/* Retailer Name */}
          <p className="text-[11px] font-bold text-black/80 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A68868]" />
            <span>Listed by <strong className="text-black font-black">{retailerName}</strong></span>
          </p>

          {/* Eco / Sustainability Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <div className="p-2 rounded-2xl bg-[#CDD5DB]/30 border border-[#CDD5DB] flex items-center gap-1.5">
              <Leaf className="w-3.5 h-3.5 text-[#A68868] shrink-0" />
              <div>
                <span className="text-[9px] uppercase text-black/60 font-black block leading-none">Carbon Score</span>
                <span className="text-[10px] font-black text-black">{carbonDisplay}</span>
              </div>
            </div>

            <div className="p-2 rounded-2xl bg-[#CDD5DB]/30 border border-[#CDD5DB] flex items-center gap-1.5">
              <Recycle className="w-3.5 h-3.5 text-[#A68868] shrink-0" />
              <div>
                <span className="text-[9px] uppercase text-black/60 font-black block leading-none">Recycled Metal</span>
                <span className="text-[10px] font-black text-black">{recycledDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: Price & Add to Cart Button */}
        <div className="pt-3 border-t border-[#CDD5DB] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase text-black/60 font-black block">Price</span>
            <span className="text-base font-black text-black">
              ₹{Number(price || 0).toLocaleString("en-IN")}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleQuickAddToCart}
              disabled={!isAvailable || adding}
              className={`px-3.5 py-2 rounded-full text-xs font-black transition-all flex items-center gap-1.5 shadow-xs ${
                added
                  ? "bg-emerald-800 text-white"
                  : "bg-[#A68868] hover:bg-[#8A6D4F] text-white"
              } disabled:opacity-50`}
              title="Add to Cart"
            >
              {added ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-3.5 h-3.5" /> {adding ? "Adding..." : "Add"}
                </>
              )}
            </button>

            <Link
              to={`/customer/products/${id}`}
              className="p-2 rounded-full bg-[#CDD5DB]/40 hover:bg-[#E3C39D]/50 border border-[#CDD5DB] text-[#A68868] hover:text-black transition-all shadow-xs"
              title="View Details"
            >
              <Eye className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
