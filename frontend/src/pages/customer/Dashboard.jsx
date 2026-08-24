import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { cartAPI } from "../../services/api";
import { supabase } from "../../lib/supabase";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Gem,
  Award,
  Truck,
  Heart,
  Plus,
  Coffee,
  CheckCircle2,
  Flame,
  UserCheck,
  Home,
  Check,
} from "lucide-react";
import heroImg from "../../assets/hero.png";
import threeWomenBanner from "../../assets/three women_banner.png";
import product1Ring from "../../assets/Product 1-ring.png";
import product2Bangle from "../../assets/Product 2-bangle.png";
import product3Jewel from "../../assets/Product 3-jewel.png";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addedItem, setAddedItem] = useState(null);

  useEffect(() => {
    fetchUserData();
    fetchProducts();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("users")
          .select("full_name")
          .eq("auth_user_id", session.user.id)
          .single();
        if (data) setUser(data);
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/products");
      const data = res.data?.data || res.data || [];
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAdd = async (productId, name) => {
    try {
      await cartAPI.addToCart(productId || "feat-1", 1);
      window.dispatchEvent(new Event("cartUpdated"));
      setAddedItem(name);
      setTimeout(() => setAddedItem(null), 2500);
    } catch (err) {
      // Local fallback
      try {
        const saved = localStorage.getItem("aura_cart");
        let items = saved ? JSON.parse(saved) : [];
        items.push({ product_id: productId, quantity: 1, name });
        localStorage.setItem("aura_cart", JSON.stringify(items));
        window.dispatchEvent(new Event("cartUpdated"));
        setAddedItem(name);
        setTimeout(() => setAddedItem(null), 2500);
      } catch (e) {}
    }
  };

  // Preset fallback popular items using provided assets
  const popularItems = [
    { id: "p1", name: "Latte Royal Gold Ring", desc: "Soft, delicate & silky finish", price: "250 ₹", image: product1Ring },
    { id: "p2", name: "Matcha Emerald Bangle", desc: "Green harmony & natural luster", price: "280 ₹", image: product2Bangle },
    { id: "p3", name: "Ice Filter Diamond Pendant", desc: "Refreshing brilliant sparkle", price: "260 ₹", image: product3Jewel },
  ];

  // Preset fallback recommended items using provided assets
  const recommendedItems = [
    { id: "r1", name: "Almond Croissant Ring", desc: "Crispy on the outside, delicate inside", price: "220 ₹", image: product1Ring },
    { id: "r2", name: "Berry Cheesecake Bangle", desc: "Sweet dessert with seasonal stones", price: "260 ₹", image: product2Bangle },
    { id: "r3", name: "Chocolate Cookie Jewel", desc: "Warm, rich and full of sparkles", price: "160 ₹", image: product3Jewel },
  ];

  return (
    <div className="space-y-16 py-4">

      {/* Added to Cart Toast Notification */}
      {addedItem && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#A68868] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#E3C39D]" />
          <span className="text-xs font-bold">Added "{addedItem}" to your cart!</span>
        </div>
      )}

      {/* 1. Hero Section */}
      <section className="relative rounded-3xl bg-[#CDD5DB]/30 p-6 sm:p-10 border border-[#CDD5DB] shadow-xs overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-black text-xs font-black tracking-wide">
              <Gem className="w-3.5 h-3.5 text-[#A68868]" />
              <span>Specialty Crafts & Jewellery</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-tight">
              Jewellery You Fall in Love With From the First Glance
            </h1>

            <p className="text-xs sm:text-sm text-black/80 font-bold leading-relaxed max-w-lg">
              Specialty handcrafted gold, fine gemstones, and a cozy luxury atmosphere crafted direct from master artisans for {user?.full_name || "you"}.
            </p>

            <div>
              <Link
                to="/customer/products"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black tracking-wide shadow-md hover:shadow-lg transition-all duration-200"
              >
                <span>Browse Menu</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </Link>
            </div>

            {/* 3 Pill Badges */}
            <div className="flex flex-wrap items-center gap-3 pt-4">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black">
                <Gem className="w-3.5 h-3.5 text-[#A68868]" />
                <span>Specialty Jewels</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black">
                <Heart className="w-3.5 h-3.5 text-[#A68868]" />
                <span>Made with Love</span>
              </div>
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black">
                <Coffee className="w-3.5 h-3.5 text-[#A68868]" />
                <span>Daily Elegance</span>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/3] rounded-[2.5rem] bg-[#A68868] p-3 shadow-xl overflow-hidden group">
              
              {/* Image Container */}
              <div className="w-full h-full rounded-[2rem] overflow-hidden bg-white/10 relative">
                <img
                  src={threeWomenBanner}
                  alt="AuraCraft Specialty Jewellery Showcase"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Floating Quality Badge */}
              <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-[#E3C39D] shadow-lg flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#A68868] text-white flex items-center justify-center text-xs font-bold">
                  <Award className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="block text-[10px] font-black text-black uppercase tracking-wider">100% Certified</span>
                  <span className="block text-[9px] font-extrabold text-[#A68868]">Hallmark Guarantee</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 2. 4-Card Feature Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 flex items-center justify-center text-[#A68868]">
            <Gem className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-black">Selected Metals</h3>
          <p className="text-xs font-bold text-black/70 leading-relaxed">
            We work exclusively with certified mines and ethically sourced specialty lots.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 flex items-center justify-center text-[#A68868]">
            <Flame className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-black">Fresh Crafting</h3>
          <p className="text-xs font-bold text-black/70 leading-relaxed">
            Hand-cut and polished in small artisan batches every single week.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 flex items-center justify-center text-[#A68868]">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-black">Master Artisans</h3>
          <p className="text-xs font-bold text-black/70 leading-relaxed">
            Professional jewelers crafting with soul, care, and utmost precision.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 flex items-center justify-center text-[#A68868]">
            <Home className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-black">Cozy Experience</h3>
          <p className="text-xs font-bold text-black/70 leading-relaxed">
            Bright, calm, and exquisite — your place of inspiration and elegance.
          </p>
        </div>

      </section>

      {/* 3. Popular Collections Section */}
      <section className="rounded-3xl bg-[#A68868] p-8 sm:p-10 border border-[#8A6D4F] shadow-md text-white">
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-white">Popular Collections</h2>
            <p className="text-xs text-[#E3C39D] mt-1 font-extrabold">
              Classic and author signature designs for every taste.
            </p>
          </div>
          <Link
            to="/customer/products"
            className="px-6 py-2.5 rounded-full bg-[#E3C39D] hover:bg-white text-black text-xs font-black transition-all shadow-xs"
          >
            View Full Menu
          </Link>
        </div>

        {/* 3 Circular Product Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {popularItems.map((item) => (
            <div
              key={item.id}
              className="bg-white/15 backdrop-blur-md rounded-3xl p-5 border border-white/30 hover:bg-white/25 transition-all flex flex-col items-center text-center space-y-4 group"
            >
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white shadow-md bg-white p-1 group-hover:scale-105 transition-transform duration-300">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-sm font-black text-white tracking-wide">{item.name}</h3>
                <p className="text-[11px] text-[#E3C39D] font-bold">{item.desc}</p>
              </div>

              <div className="text-sm font-black text-white pt-1">{item.price}</div>
            </div>
          ))}
        </div>

      </section>

      {/* 4. "Recommended to Try" Section */}
      <section className="space-y-8">
        
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-[#A68868] text-xs font-black uppercase tracking-widest">
            <span>♥</span>
            <h2>Recommended to Try</h2>
            <span>♥</span>
          </div>
          <p className="text-xs font-bold text-black/70">Handpicked customer favorites with instant cart access</p>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {recommendedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl p-5 border border-[#CDD5DB] shadow-xs flex items-center gap-4 hover:shadow-md transition-all group"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden border border-[#CDD5DB] bg-white shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-xs font-black text-black truncate">{item.name}</h3>
                <p className="text-[10px] text-black/70 font-bold line-clamp-2 leading-relaxed">{item.desc}</p>
                
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-black text-black">{item.price}</span>
                  
                  <button
                    onClick={() => handleQuickAdd(item.id, item.name)}
                    className="w-8 h-8 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white flex items-center justify-center shadow-xs transition-transform active:scale-95"
                    title="Add to Cart"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* 5. Highlight Craft Section */}
      <section className="rounded-3xl bg-[#CDD5DB]/30 p-8 sm:p-10 border border-[#CDD5DB] shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          <div className="lg:col-span-6 space-y-6">
            <h2 className="text-2xl font-black text-black tracking-tight">
              Jewels We Are Proud Of
            </h2>
            <p className="text-xs text-black/80 leading-relaxed font-bold">
              We travel, select the finest raw materials, refine every detail with perfection, and reveal the brilliant spark in every single piece.
            </p>

            <div>
              <Link
                to="/customer/products"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black transition-all shadow-xs"
              >
                <span>Select Jewels</span>
              </Link>
            </div>

            {/* 3 Feature Pills */}
            <div className="grid grid-cols-3 gap-3 pt-4 text-center">
              <div className="p-3 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                <Gem className="w-4 h-4 mx-auto text-[#A68868]" />
                <span className="block text-[10px] font-black text-black">Direct Supply</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                <Flame className="w-4 h-4 mx-auto text-[#A68868]" />
                <span className="block text-[10px] font-black text-black">Custom Cut</span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-[#CDD5DB] space-y-1">
                <ShieldCheck className="w-4 h-4 mx-auto text-[#A68868]" />
                <span className="block text-[10px] font-black text-black">Purity Guarantee</span>
              </div>
            </div>
          </div>

          {/* Image Showcase */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="w-full max-w-md rounded-3xl overflow-hidden border border-[#CDD5DB] shadow-lg bg-white p-2">
              <img
                src={heroImg}
                alt="AuraCraft Product Showcase"
                className="w-full h-64 object-cover rounded-2xl"
              />
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

