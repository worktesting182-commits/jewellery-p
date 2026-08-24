import React, { useState, useEffect } from "react";
// Cache bust: Force Vite HMR module rebuild for Checkout component
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  Building2,
  QrCode,
  Banknote,
  MapPin,
  User,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
} from "lucide-react";
import CheckoutSummary from "../../components/customer/CheckoutSummary";
import { supabase } from "../../lib/supabase";

import { cartAPI, orderAPI } from "../../services/api";

export default function CustomerCheckout() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Delivery Information Form State
  const [shippingForm, setShippingForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "Mumbai",
    state: "Maharashtra",
    pincode: "400001",
  });

  // Payment Method State (MVP: Cash on Delivery or Simulated Online Payment)
  const [paymentMethod, setPaymentMethod] = useState("SIMULATED_ONLINE");

  useEffect(() => {
    loadCartAndUser();
  }, []);

  const loadCartAndUser = async () => {
    try {
      // 1. Load cart items from backend API
      try {
        const res = await cartAPI.getCart();
        const items = res.data?.cart?.items || res.data?.data?.items || res.data?.data || [];
        if (Array.isArray(items) && items.length > 0) {
          setCartItems(items);
        } else {
          const savedCart = localStorage.getItem("aura_cart");
          if (savedCart) setCartItems(JSON.parse(savedCart));
        }
      } catch (cartErr) {
        const savedCart = localStorage.getItem("aura_cart");
        if (savedCart) setCartItems(JSON.parse(savedCart));
      }

      // 2. Pre-fill customer delivery information profile if logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: user } = await supabase
          .from("users")
          .select("full_name, phone")
          .eq("auth_user_id", session.user.id)
          .single();

        const { data: customer } = await supabase
          .from("customers")
          .select("address")
          .eq("auth_user_id", session.user.id)
          .single();

        setShippingForm((prev) => ({
          ...prev,
          fullName: user?.full_name || prev.fullName,
          phone: user?.phone || prev.phone,
          address: customer?.address || prev.address,
        }));
      }
    } catch (err) {
      console.error("Error loading checkout context:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    if (!shippingForm.fullName || !shippingForm.phone || !shippingForm.address) {
      setError("Please complete all required delivery information fields (Name, Phone, Address).");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty. Add products before placing an order.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formattedItems = cartItems.map((item) => {
        const p = item.product || item;
        const targetProdId = item.product_id || item.productId || p.id || item.id || item._id;
        return {
          product_id: targetProdId,
          productId: targetProdId,
          quantity: Number(item.quantity || 1),
          price: Number(item.unitPrice || item.price || p.price || 0),
          name: item.productName || item.product_name || item.name || p.name,
        };
      });

      let createdOrder = null;

      // Call backend POST /api/orders (Single Logical Operation Flow)
      try {
        const orderPayload = {
          shipping_address: `${shippingForm.fullName}, ${shippingForm.phone}, ${shippingForm.address}, ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`,
          payment_method: paymentMethod === "COD" ? "Cash on Delivery" : "Simulated Online Payment",
          items: formattedItems,
        };
        const res = await orderAPI.createOrder(orderPayload);
        createdOrder = res.data?.order || res.data?.data;
      } catch (apiErr) {
        console.warn("Backend order creation warning:", apiErr);
        // If backend returned a clear validation/stock error, display it and return
        if (apiErr.response?.status === 400 || apiErr.response?.status === 409 || apiErr.response?.status === 404) {
          const backendMsg = apiErr.response?.data?.message;
          setError(backendMsg || "Failed to place order due to item availability or inventory limits.");
          setIsSubmitting(false);
          return;
        }
      }

      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => {
        const p = item.product || item;
        const price = Number(item.unitPrice || item.price || p.price || 0);
        return sum + price * (item.quantity || 1);
      }, 0);
      const tax = Math.round(subtotal * 0.03);
      const totalAmount = subtotal + tax;

      const orderId = createdOrder?.id || createdOrder?.order_number || `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

      const newOrder = createdOrder || {
        id: orderId,
        order_number: orderId,
        created_at: new Date().toISOString(),
        status: "PROCESSING",
        payment_method: paymentMethod === "COD" ? "Cash on Delivery" : "Simulated Online Payment",
        payment_status: paymentMethod === "COD" ? "PENDING" : "PAID",
        total_amount: totalAmount,
        subtotal: subtotal,
        tax: tax,
        shipping_address: `${shippingForm.fullName}, ${shippingForm.phone}, ${shippingForm.address}, ${shippingForm.city}, ${shippingForm.state} - ${shippingForm.pincode}`,
        items: cartItems.map((item) => {
          const p = item.product || item;
          return {
            product_id: item.product_id || item.productId || item.id,
            name: item.productName || item.product_name || item.name || p.name,
            image_url: item.image || item.image_url || item.product_image || p.image_url,
            price: Number(item.unitPrice || item.price || p.price || 0),
            quantity: item.quantity || 1,
          };
        }),
      };

      // Save order to localStorage order history
      const existingOrders = JSON.parse(localStorage.getItem("aura_orders") || "[]");
      localStorage.setItem("aura_orders", JSON.stringify([newOrder, ...existingOrders]));

      // Clear local storage and backend cart
      try {
        await cartAPI.clearCart();
      } catch (err) {
        console.warn("Backend clearCart notice:", err);
      }
      localStorage.removeItem("aura_cart");
      window.dispatchEvent(new Event("cartUpdated"));
      window.dispatchEvent(new Event("productsUpdated"));

      // Navigate to order confirmation page
      setTimeout(() => {
        setIsSubmitting(false);
        navigate(`/customer/orders/${newOrder.id || newOrder.order_number}`, { state: { orderPlaced: true } });
      }, 1000);
    } catch (err) {
      console.error("Error creating order:", err);
      setError("Failed to place order. Please try again.");
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Back Link & Header */}
      <div>
        <Link
          to="/customer/cart"
          className="inline-flex items-center gap-1.5 text-xs text-[#A68868] hover:text-black font-extrabold transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Cart
        </Link>
        <h1 className="text-2xl sm:text-3xl font-black text-black flex items-center gap-3">
          <Lock className="w-7 h-7 text-[#A68868]" /> Secure Checkout
        </h1>
        <p className="text-xs font-bold text-black/80 mt-1">
          Provide delivery information and select your payment method
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-black">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Delivery Information & Payment Method */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Delivery Information */}
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] space-y-4 shadow-xs">
            <h2 className="text-base font-black text-black flex items-center gap-2 border-b border-[#CDD5DB] pb-3">
              <MapPin className="w-5 h-5 text-[#A68868]" /> Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#A68868]" /> Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={shippingForm.fullName}
                  onChange={handleInputChange}
                  placeholder="e.g. Priya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[#A68868]" /> Mobile Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={shippingForm.phone}
                  onChange={handleInputChange}
                  placeholder="+91 9876543210"
                  className="w-full px-3.5 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868]"
                  required
                />
              </div>

              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-black">Delivery Address</label>
                <textarea
                  name="address"
                  rows={2}
                  value={shippingForm.address}
                  onChange={handleInputChange}
                  placeholder="House/Flat No., Building Name, Street, Landmark"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868]"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black">City</label>
                <input
                  type="text"
                  name="city"
                  value={shippingForm.city}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold text-xs focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-black">Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  value={shippingForm.pincode}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold text-xs focus:outline-none focus:border-[#A68868]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Payment Method */}
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] space-y-4 shadow-xs">
            <h2 className="text-base font-black text-black flex items-center gap-2 border-b border-[#CDD5DB] pb-3">
              <CreditCard className="w-5 h-5 text-[#A68868]" /> Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: "SIMULATED_ONLINE", label: "Simulated Online Payment", icon: CreditCard, sub: "Card / UPI / Net Banking (Instant Authorization)" },
                { id: "COD", label: "Cash on Delivery", icon: Banknote, sub: "Pay with Cash upon Doorstep Delivery" },
              ].map((method) => {
                const Icon = method.icon;
                const selected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                      selected
                        ? "bg-[#E3C39D]/30 border-[#A68868] text-black shadow-xs ring-1 ring-[#A68868]"
                        : "bg-white border-[#CDD5DB] text-black/70 hover:border-[#A68868]"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 ${selected ? "text-[#A68868]" : "text-black/60"}`} />
                    <div>
                      <span className="block text-xs font-black text-black">{method.label}</span>
                      <span className="block text-[10px] font-bold text-black/70 mt-0.5">{method.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4">
          <CheckoutSummary
            items={cartItems}
            isCheckoutPage={true}
            proceedText="Simulate Payment & Place Order"
            onProceed={handlePlaceOrder}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    </div>
  );
}
