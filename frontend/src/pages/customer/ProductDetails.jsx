import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api, { cartAPI } from "../../services/api";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Heart,
  ShoppingCart,
  CheckCircle2,
  Gem,
  Building,
  AlertCircle,
  Leaf,
  Recycle,
  Scale,
  Award,
  Layers,
  Plus,
  Minus,
} from "lucide-react";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [toast, setToast] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchProductDetails();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/products/${id}`);
      const data = res.data?.data || res.data;
      setProduct(data);
    } catch (err) {
      console.error("Error fetching product details:", err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      setAdding(true);
      const res = await cartAPI.addToCart(product.id, quantity);
      showToast("success", res.data?.message || `${product?.name || "Product"} added to Cart!`);

      // Update backup local storage for offline resilience
      const saved = JSON.parse(localStorage.getItem("aura_cart") || "[]");
      const existingIndex = saved.findIndex(i => (i.id || i.product_id) === product.id);
      if (existingIndex > -1) {
        saved[existingIndex].quantity += quantity;
      } else {
        saved.push({
          id: product.id,
          product_id: product.id,
          product_name: product.name,
          name: product.name,
          price: product.price,
          image_url: product.image_url || product.image || "",
          quantity: quantity,
          product: product
        });
      }
      localStorage.setItem("aura_cart", JSON.stringify(saved));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error adding product to cart:", err);
      showToast("error", err.response?.data?.message || "Failed to add product to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    showToast("success", isWishlisted ? "Removed from Wishlist" : "Saved to Wishlist!");
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 sm:p-12 animate-pulse space-y-8">
        <div className="h-6 w-32 bg-white/5 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-square bg-white/5 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 bg-white/5 rounded" />
            <div className="h-6 w-1/3 bg-white/5 rounded" />
            <div className="h-24 w-full bg-white/5 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-[#DAF1DE]">Product Not Found</h2>
        <p className="text-xs text-[#8EB69B]/70">The requested jewellery piece does not exist or was removed.</p>
        <button
          onClick={() => navigate("/customer/products")}
          className="px-6 py-2.5 rounded-xl bg-[#235347] text-[#DAF1DE] text-xs font-semibold hover:bg-[#2c6353] transition-all"
        >
          Back to Catalogue
        </button>
      </div>
    );
  }

  const {
    name,
    price,
    description,
    stock,
    stock_quantity,
    weight,
    material,
    purity,
    images,
    image_url,
    category_name,
    categories,
    manufacturers,
    carbon_score,
    recycled_percentage,
    dimensions,
  } = product;

  const stockCount = stock !== undefined ? stock : stock_quantity !== undefined ? stock_quantity : 10;
  const isAvailable = stockCount > 0;
  const categoryName = categories?.name || category_name || "Jewellery";
  const manufacturerName = manufacturers?.company_name || manufacturers?.users?.full_name || "Master Artisan";
  const materialDisplay = material || "22K Gold";
  const carbonDisplay = carbon_score || (weight ? `${(parseFloat(weight) * 0.15).toFixed(1)} kg CO₂e` : "1.8 kg CO₂e");
  const recycledDisplay = recycled_percentage !== undefined ? `${recycled_percentage}%` : "85%";

  const imageList =
    Array.isArray(images) && images.length > 0
      ? images
      : image_url
      ? [image_url]
      : ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=800"];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl border shadow-2xl flex items-center gap-3 backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "bg-emerald-800 text-white border-emerald-500"
              : "bg-rose-800 text-white border-rose-500"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
          <span className="text-xs font-black">{toast.message}</span>
        </div>
      )}

      <div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-[#A68868] hover:text-black font-extrabold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
        <div className="space-y-4">
          <div className="relative aspect-square w-full rounded-3xl overflow-hidden bg-white border border-[#CDD5DB] shadow-lg p-2">
            <img
              src={imageList[selectedImage] || imageList[0]}
              alt={name}
              className="w-full h-full object-cover rounded-2xl"
            />
            {purity && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md border border-[#CDD5DB] text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#A68868]" /> {purity}
              </span>
            )}
          </div>

          {imageList.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {imageList.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                    selectedImage === index
                      ? "border-[#A68868] scale-105 shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-xs font-black text-black uppercase tracking-wider">
                {categoryName}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border ${
                  isAvailable
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300"
                    : "bg-rose-50 text-rose-900 border-rose-300"
                }`}
              >
                {isAvailable ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> In Stock ({stockCount} units)
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Out of Stock
                  </>
                )}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight">
              {name}
            </h1>

            <div className="p-4 sm:p-5 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs uppercase text-black/60 font-black block">Retailer Selling Price</span>
                <span className="text-3xl font-black text-black">
                  ₹{Number(product.selling_price || price || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <span className="text-[11px] text-black font-extrabold bg-[#CDD5DB]/40 px-3 py-1 rounded-lg border border-[#CDD5DB]">
                GST Included
              </span>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-black/80 font-bold leading-relaxed">
              {description || "Handcrafted with precision and verified for hallmark quality."}
            </p>

            {/* Specifications Grid */}
            <div className="rounded-3xl bg-white border border-[#CDD5DB] p-5 space-y-3 shadow-xs">
              <h3 className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Gem className="w-4 h-4 text-[#A68868]" /> Material & Craft Specifications
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-black/60 font-black block">Material</span>
                  <span className="font-black text-black">{materialDisplay}</span>
                </div>
                <div>
                  <span className="text-black/60 font-black block">Purity Grade</span>
                  <span className="font-black text-black">{purity || "22K BIS Hallmarked"}</span>
                </div>
                <div>
                  <span className="text-black/60 font-black block">Weight</span>
                  <span className="font-black text-black">{weight ? `${weight} g` : "Standard Weight"}</span>
                </div>
                <div>
                  <span className="text-black/60 font-black block">Dimensions</span>
                  <span className="font-black text-black">{dimensions || "Standard Fit"}</span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            {isAvailable && (
              <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between shadow-xs">
                <span className="text-xs font-black text-black">Select Quantity</span>
                <div className="flex items-center gap-3 bg-[#CDD5DB]/30 px-3 py-1.5 rounded-full border border-[#CDD5DB]">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1 text-[#A68868] hover:text-black transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-black text-black w-6 text-center">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                    className="p-1 text-[#A68868] hover:text-black transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Verified Manufacturer Card */}
            <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#A68868] text-white flex items-center justify-center">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-black/60 font-black uppercase block">Verified Manufacturer</span>
                  <h4 className="text-xs font-black text-black">{manufacturerName}</h4>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[10px] font-black uppercase flex items-center gap-1 border border-[#A68868]/40">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A68868]" /> Certified
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-[#CDD5DB] flex gap-4">
            <button
              onClick={handleAddToCart}
              disabled={!isAvailable || adding}
              className="flex-1 py-4 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              <ShoppingCart className="w-5 h-5 text-white" />
              {adding ? "Adding..." : "Add to Cart"}
            </button>

            <button
              onClick={handleToggleWishlist}
              className={`p-4 rounded-full border transition-all ${
                isWishlisted
                  ? "bg-rose-100 border-rose-300 text-rose-600"
                  : "bg-white border-[#CDD5DB] text-[#A68868] hover:text-rose-600 hover:bg-rose-50"
              }`}
              title="Save to Wishlist"
            >
              <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-600 text-rose-600" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
