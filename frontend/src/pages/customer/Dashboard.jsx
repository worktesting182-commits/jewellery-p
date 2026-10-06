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
  Camera,
  TrendingUp,
  Coins,
  Layers,
  Brain,
  Shield,
} from "lucide-react";
import heroImg from "../../assets/hero.png";
import threeWomenBanner from "../../assets/three women_banner.png";
import luxeHeroBanner from "../../assets/luxe_hero_banner.jpg";
import product1Ring from "../../assets/Product 1-ring.png";
import product2Bangle from "../../assets/Product 2-bangle.png";
import product3Jewel from "../../assets/Product 3-jewel.png";
import { ParallaxComponent } from "../../components/ui/component";


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

  return (
    <div className="space-y-16 py-4">

      {/* Added to Cart Toast Notification */}
      {addedItem && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#A68868] text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#E3C39D]" />
          <span className="text-xs font-bold">Added "{addedItem}" to your cart!</span>
        </div>
      )}

      {/* 1. Luxe Hero Section (Styled matching Luxe Cloud Trade Hero) */}
      <section className="relative rounded-[2.5rem] bg-gradient-to-br from-[#FAF8F5] via-white to-[#E3C39D]/20 p-8 sm:p-12 border border-[#CDD5DB] shadow-md overflow-hidden min-h-[560px] flex items-center">
        
        {/* Ambient Radial Floating Glow Accents */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-[#A68868]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none animate-pulse" style={{ animationDelay: "2s" }} />

        <div className="relative w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center z-10">
          
          {/* Left Column: Heading, Subtitle, CTAs & Stats */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 glass-ivory px-4 py-2 rounded-full border border-[#D4AF37]/40 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#A68868]" />
              <span className="text-xs sm:text-sm font-black text-[#A68868] uppercase tracking-wider">
                India's #1 Specialty Jewellery Platform
              </span>
            </div>

            {/* Main Luxury Heading */}
            <h1 className="font-heading text-4xl sm:text-6xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-black">
              Jewellery You Fall in Love With <span className="text-gold-gradient">From the First Glance</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-black/80 font-semibold max-w-xl leading-relaxed">
              Specialty handcrafted gold, fine gemstones, and a cozy luxury atmosphere crafted direct from master artisans for {user?.full_name || "you"}.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/customer/products"
                className="bg-gradient-gold text-white px-7 py-3.5 rounded-full font-bold shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:scale-105 inline-flex items-center gap-2 text-xs uppercase tracking-wide"
              >
                <span>Explore Marketplace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/customer/products"
                className="glass border border-[#CDD5DB] px-7 py-3.5 rounded-full font-bold text-black hover:bg-white/80 transition-all duration-300 inline-flex items-center gap-2 text-xs uppercase tracking-wide shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#A68868]" />
                <span>Watch Demo</span>
              </Link>
            </div>

            {/* KPI Stat Row */}
            <div className="mt-8 flex flex-wrap items-center gap-6 sm:gap-8 pt-6 border-t border-[#CDD5DB]/60">
              <div>
                <p className="font-heading text-2xl sm:text-3xl font-bold text-black">10,000+</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Cloud Products</p>
              </div>
              <div className="w-px h-10 bg-[#CDD5DB]" />
              <div>
                <p className="font-heading text-2xl sm:text-3xl font-bold text-black">500+</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Master Artisans</p>
              </div>
              <div className="w-px h-10 bg-[#CDD5DB]" />
              <div>
                <p className="font-heading text-2xl sm:text-3xl font-bold text-black">100%</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Hallmark Certified</p>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual with Glass Badges */}
          <div className="lg:col-span-5 relative flex justify-center">
            
            {/* Image Card Container */}
            <div className="relative aspect-[4/5] w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#CDD5DB] group">
              <img
                src={luxeHeroBanner || threeWomenBanner}
                alt="AuraCraft Specialty Jewellery Showcase"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Floating Glass Card (Live Gold Rate Badge) */}
            <div className="absolute -bottom-4 -left-4 sm:-left-6 glass-ivory rounded-2xl p-3.5 shadow-gold-lg border border-[#D4AF37]/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center text-white shadow-xs shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] text-black/70 font-black uppercase tracking-wider">Live Gold Rate (22K)</p>
                  <p className="font-heading text-lg font-bold text-black leading-tight">
                    ₹6,800<span className="text-xs text-emerald-600 font-extrabold ml-1">/g ▲ 0.72%</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Top-Right Glass Card (Virtual Try-On Badge) */}
            <div className="absolute -top-3 -right-3 sm:-right-4 glass-ivory rounded-2xl px-3.5 py-2.5 shadow-gold border border-[#D4AF37]/50 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#A68868]" />
                <span className="text-xs font-black text-black">Virtual Try-On Ready</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Dark Precious Metal Rate Ticker (Styled matching Luxe Cloud Trade Ticker) */}
      <section className="bg-[#0D0D0E] text-white py-4 px-6 rounded-2xl border border-[#CDD5DB]/20 shadow-lg overflow-hidden my-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 flex-wrap">
          
          {/* Gold 24K */}
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#D4AF37]" />
            <span className="text-xs sm:text-sm text-neutral-400 font-extrabold uppercase">Gold 24K:</span>
            <span className="font-bold text-[#F3E1B9] text-sm">₹7,734/g</span>
            <span className="text-xs text-emerald-400 font-black">▲ 0.8%</span>
          </div>

          {/* Gold 22K */}
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-neutral-400" />
            <span className="text-xs sm:text-sm text-neutral-400 font-extrabold uppercase">Gold 22K:</span>
            <span className="font-bold text-white text-sm">₹7,384/g</span>
            <span className="text-xs text-emerald-400 font-black">▲ 0.6%</span>
          </div>

          {/* Silver */}
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-neutral-400" />
            <span className="text-xs sm:text-sm text-neutral-400 font-extrabold uppercase">Silver:</span>
            <span className="font-bold text-white text-sm">₹92.5/g</span>
            <span className="text-xs text-rose-400 font-black">▼ 0.2%</span>
          </div>

        </div>
      </section>

      {/* 2. Platform Features (Styled matching Luxe Cloud Trade Features) */}
      <section id="features" className="py-12 sm:py-16 bg-[#CDD5DB]/15 rounded-3xl p-6 sm:p-10 border border-[#CDD5DB]/60">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-black text-[#A68868] uppercase tracking-widest">
              Platform Features
            </p>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-black tracking-tight">
              Everything You Need to Sell Jewellery
            </h2>
            <p className="text-xs sm:text-sm text-black/70 font-semibold leading-relaxed">
              One unified platform with cloud inventory, AI tools, payments, CRM, and more.
            </p>
          </div>

          {/* 6 Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="card-luxury p-7 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Layers className="w-6 h-6 text-[#A68868]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-black mb-2">Cloud Inventory</h3>
              <p className="text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                Access thousands of jewellery designs without stocking a single piece. Sell from the cloud catalogue.
              </p>
            </div>

            <div className="card-luxury p-7 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Camera className="w-6 h-6 text-[#A68868]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-black mb-2">AI Virtual Try-On</h3>
              <p className="text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                Let customers try rings, necklaces, and earrings virtually with AR rendering and face detection.
              </p>
            </div>

            <div className="card-luxury p-7 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Coins className="w-6 h-6 text-[#A68868]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-black mb-2">Digital Gold</h3>
              <p className="text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                Buy, sell, and gift 24K digital gold. Secured vault, live pricing, and instant redemption.
              </p>
            </div>

            <div className="card-luxury p-7 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6 text-[#A68868]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-black mb-2">AI Recommendations</h3>
              <p className="text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                Smart product suggestions, visual search, and AI-powered customer segmentation.
              </p>
            </div>

            <div className="card-luxury p-7 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6 text-[#A68868]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-black mb-2">Escrow & Insurance</h3>
              <p className="text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                Every transaction protected with escrow payments and insured shipments.
              </p>
            </div>

            <div className="card-luxury p-7 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold-light flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                <Truck className="w-6 h-6 text-[#A68868]" />
              </div>
              <h3 className="font-heading text-xl font-bold text-black mb-2">Dropshipping Engine</h3>
              <p className="text-xs sm:text-sm text-black/70 font-medium leading-relaxed">
                Automated order routing from retailer to manufacturer to delivery with live tracking.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive GSAP + Lenis Parallax Showcase */}
      <ParallaxComponent />

      {/* 3. Curated Collections - Explore by Category (Styled matching Luxe Cloud Trade) */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-black text-[#A68868] uppercase tracking-widest">
              Curated Collections
            </p>
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-black tracking-tight">
              Explore by Category
            </h2>
            <p className="text-xs sm:text-sm text-black/70 font-semibold leading-relaxed">
              From everyday elegance to bridal masterpieces — discover 10,000+ designs in the cloud catalogue.
            </p>
          </div>

          {/* 6 Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              {
                title: "Gold",
                subtitle: "Timeless elegance",
                count: "2,450+ designs",
                image: "https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=400&q=80",
                delay: "0s",
              },
              {
                title: "Diamond",
                subtitle: "Brilliant cuts",
                count: "1,820+ designs",
                image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&q=80",
                delay: "0.05s",
              },
              {
                title: "Bridal",
                subtitle: "For your big day",
                count: "980+ designs",
                image: "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=400&q=80",
                delay: "0.1s",
              },
              {
                title: "Silver",
                subtitle: "Everyday charm",
                count: "1,560+ designs",
                image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&q=80",
                delay: "0.15s",
              },
              {
                title: "Platinum",
                subtitle: "Modern luxury",
                count: "720+ designs",
                image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&q=80",
                delay: "0.2s",
              },
              {
                title: "Temple",
                subtitle: "Sacred heritage",
                count: "540+ designs",
                image: "https://images.unsplash.com/photo-1604148494489-1dc9b4f6e2a2?w=400&q=80",
                delay: "0.25s",
              },
            ].map((cat, idx) => (
              <Link
                key={idx}
                to={`/customer/products?category=${encodeURIComponent(cat.title)}`}
                className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-[#CDD5DB]/60"
              >
                <img
                  src={cat.image}
                  alt={cat.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading text-lg font-bold text-white leading-snug">
                    {cat.title}
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">{cat.subtitle}</p>
                  <p className="text-[11px] text-[#F3E1B9] font-bold mt-1 tracking-wide">
                    {cat.count}
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>



      {/* Gold Savings Scheme Section (Styled matching Luxe Cloud Trade Gold Scheme) */}
      <section id="gold-scheme" className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Visual Showcase & Floating Glass Badge */}
          <div className="relative order-2 lg:order-1 flex justify-center">
            <div className="aspect-square w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-[#CDD5DB] relative group">
              <img
                src="https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=600&q=80"
                alt="Gold Savings Scheme"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Floating Top-Right Glass Badge */}
            <div className="absolute -top-3 -right-3 sm:-right-4 glass-ivory rounded-2xl p-4 shadow-gold border border-[#D4AF37]/40 backdrop-blur-md">
              <p className="text-xs text-[#A68868] font-black uppercase tracking-wider">11+1 Scheme</p>
              <p className="font-heading text-xl font-bold text-black">Pay 11, Get 12</p>
            </div>
          </div>

          {/* Right Column: Details & 4 Feature Cards */}
          <div className="order-1 lg:order-2 space-y-6">
            <div className="inline-flex items-center gap-2 glass-ivory px-4 py-2 rounded-full border border-[#D4AF37]/40 shadow-xs">
              <Gem className="w-4 h-4 text-[#A68868]" />
              <span className="text-xs sm:text-sm font-black text-[#A68868] uppercase tracking-wider">
                Gold Savings Scheme
              </span>
            </div>

            <h2 className="font-heading text-3xl sm:text-5xl font-bold leading-tight text-black">
              Help Customers <span className="text-gold-gradient">Save for Gold</span>
            </h2>

            <p className="text-xs sm:text-sm text-black/80 font-semibold leading-relaxed max-w-xl">
              Offer flexible gold purchase schemes — monthly, weekly, 11+1, 10+1, and custom plans. Auto-debit via UPI AutoPay, digital passbook, and maturity calculator.
            </p>

            {/* 4 Feature Stat Cards Grid */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="card-luxury p-5 border border-[#CDD5DB]">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-[#A68868]">6+</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Scheme Types</p>
              </div>

              <div className="card-luxury p-5 border border-[#CDD5DB]">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-[#A68868]">UPI</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Auto-Debit</p>
              </div>

              <div className="card-luxury p-5 border border-[#CDD5DB]">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-[#A68868]">Flexible</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Maturity</p>
              </div>

              <div className="card-luxury p-5 border border-[#CDD5DB]">
                <p className="font-heading text-2xl sm:text-3xl font-bold text-[#A68868]">Supported</p>
                <p className="text-xs text-black/70 font-black uppercase tracking-wider">Nominee</p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                to="/gold-sip"
                className="inline-flex items-center gap-2 bg-gradient-gold text-white px-7 py-3.5 rounded-full font-bold text-xs uppercase tracking-wide shadow-gold hover:shadow-gold-lg transition-all hover:scale-105"
              >
                <span>Explore Schemes</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

        </div>
      </section>





    </div>
  );
}

