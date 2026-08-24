import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, ArrowLeft, ShieldCheck, Sparkles, Gem, RefreshCw, AlertTriangle } from "lucide-react";
import CartItem from "../../components/customer/CartItem";
import CheckoutSummary from "../../components/customer/CheckoutSummary";
import { cartAPI } from "../../services/api";

export default function CustomerCart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCart();

    const handleCartUpdated = () => {
      loadCart();
    };
    window.addEventListener("cartUpdated", handleCartUpdated);
    return () => window.removeEventListener("cartUpdated", handleCartUpdated);
  }, []);

  const loadCart = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartAPI.getCart();
      const items = res.data?.cart?.items || res.data?.data?.items || res.data?.data || [];
      if (Array.isArray(items) && items.length > 0) {
        setCartItems(items);
      } else {
        const savedCart = localStorage.getItem("aura_cart");
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      }
    } catch (err) {
      console.error("Error fetching cart from backend API:", err);
      const errMsg = err.response?.data?.message || err.message || "Failed to load shopping cart from server.";
      setError(errMsg);
      const savedCart = localStorage.getItem("aura_cart");
      setCartItems(savedCart ? JSON.parse(savedCart) : []);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    try {
      setUpdating(true);
      await cartAPI.updateQuantity(itemId, newQuantity);
      await loadCart();
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error updating cart quantity:", err);
      alert(err.response?.data?.message || "Failed to update item quantity");
      
      // Fallback optimistic update
      const updated = cartItems.map((item) => {
        const id = item._id || item.id || item.product_id || item.productId;
        if (id === itemId) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      setCartItems(updated);
      localStorage.setItem("aura_cart", JSON.stringify(updated));
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (!itemId) return;
    try {
      setUpdating(true);
      // Optimistic removal from UI state and local storage immediately
      const updated = cartItems.filter(
        (item) => (item._id || item.id || item.product_id || item.productId) !== itemId
      );
      setCartItems(updated);
      localStorage.setItem("aura_cart", JSON.stringify(updated));
      window.dispatchEvent(new Event("cartUpdated"));

      // Send removal request to backend API
      await cartAPI.removeFromCart(itemId);
    } catch (err) {
      console.error("Error removing cart item from backend:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm("Are you sure you want to clear your shopping cart?")) {
      try {
        setUpdating(true);
        // Optimistic clear from UI state and local storage immediately
        setCartItems([]);
        localStorage.removeItem("aura_cart");
        window.dispatchEvent(new Event("cartUpdated"));

        // Send clear request to backend API
        await cartAPI.clearCart();
      } catch (err) {
        console.error("Error clearing cart on backend:", err);
      } finally {
        setUpdating(false);
      }
    }
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const price = Number(item.unitPrice || item.price || item.product?.price || 0);
    return sum + price * (item.quantity || 1);
  }, 0);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center space-y-4 py-20">
        <div className="w-12 h-12 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-black font-black tracking-wider uppercase">Loading your cart...</p>
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
            <ShoppingBag className="w-7 h-7 text-[#A68868]" /> Shopping Cart
          </h1>
          <p className="text-xs font-bold text-black/80 mt-1">
            Review your selected handcrafted items before proceeding to checkout
          </p>
        </div>

        {cartItems.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={loadCart}
              disabled={updating}
              className="p-2.5 rounded-full bg-white border border-[#CDD5DB] text-[#A68868] hover:text-black transition-all shadow-xs"
              title="Refresh Cart"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? "animate-spin" : ""}`} />
            </button>

            <button
              onClick={handleClearCart}
              disabled={updating}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-black transition-all shadow-xs"
            >
              <Trash2 className="w-4 h-4" /> Clear Cart
            </button>
          </div>
        )}
      </div>

      {/* API Error Notification Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-black text-amber-900">API Synchronization Warning</p>
              <p className="text-amber-800 font-bold">{error}</p>
            </div>
          </div>
          <button
            onClick={loadCart}
            className="px-3 py-1.5 rounded-full bg-amber-200 hover:bg-amber-300 text-amber-950 font-black transition-all"
          >
            Try Again
          </button>
        </div>
      )}

      {cartItems.length === 0 ? (
        /* Empty State */
        <div className="p-8 sm:p-16 text-center rounded-3xl bg-white border border-[#CDD5DB] space-y-6 max-w-2xl mx-auto shadow-xs">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#E3C39D]/30 border border-[#CDD5DB] flex items-center justify-center text-[#A68868] shadow-xs">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-black">Your Cart is Empty</h2>
            <p className="text-xs sm:text-sm text-black/80 font-bold max-w-md mx-auto leading-relaxed">
              Explore our certified eco-friendly gold, silver, and gemstone jewellery collection direct from master artisans.
            </p>
          </div>
          <Link
            to="/customer/products"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black transition-all shadow-md"
          >
            <Gem className="w-4 h-4 text-white" /> Explore Catalogue
          </Link>
        </div>
      ) : (
        /* Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Cart Item List */}
          <div className="lg:col-span-8 space-y-4">
            {cartItems.map((item, index) => (
              <CartItem
                key={item._id || item.id || item.product_id || item.productId || index}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemoveItem}
              />
            ))}

            {/* Trust Assurance Banner */}
            <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] flex flex-wrap items-center justify-between gap-4 text-xs font-black text-black shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#A68868]" />
                <span>Hallmark Certified Quality Assurance</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#A68868]" />
                <span>Insured Doorstep Delivery</span>
              </div>
            </div>
          </div>

          {/* Checkout Summary Sidebar */}
          <div className="lg:col-span-4">
            <CheckoutSummary
              items={cartItems}
              subtotal={subtotal}
              proceedText="Proceed to Checkout"
              proceedLink="/customer/checkout"
            />
          </div>
        </div>
      )}
    </div>
  );
}
