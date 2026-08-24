import React, { useState, useEffect } from "react";
import NotificationBell from "../components/common/NotificationBell";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Gem,
  LayoutDashboard,
  ShoppingBag,
  Heart,
  ShoppingCart,
  Package,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
  MapPin,
  Clock,
  Phone,
  Send,
  Globe,
  Share2,
  Coins,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { cartAPI } from "../services/api";
import illustrationImg from "../assets/Illustration.png";

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [emailInput, setEmailInput] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetchUser();
    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  const updateCartCount = async () => {
    try {
      const res = await cartAPI.getCart();
      const items = res.data?.cart?.items || res.data?.data?.items || [];
      if (Array.isArray(items) && items.length > 0) {
        const totalQty = items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
        setCartCount(totalQty);
        return;
      }
    } catch (e) {
      // Fallback
    }

    try {
      const saved = localStorage.getItem("aura_cart");
      if (saved) {
        const items = JSON.parse(saved);
        const totalQty = items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
        setCartCount(totalQty);
      } else {
        setCartCount(0);
      }
    } catch {
      setCartCount(0);
    }
  };

  const fetchUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from("users")
          .select("full_name, email")
          .eq("auth_user_id", session.user.id)
          .single();
        if (data) setUser(data);
      }
    } catch (err) {
      console.error("Error fetching customer info:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubscribed(true);
      setEmailInput("");
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/customer/home", icon: LayoutDashboard },
    { name: "Browse Products", href: "/customer/products", icon: ShoppingBag },
    { name: "Gold Schemes", href: "/gold-sip", icon: Coins },
    { name: "Wishlist", href: "/customer/wishlist", icon: Heart },
    { name: "Cart", href: "/customer/cart", icon: ShoppingCart, badge: cartCount },
    { name: "My Orders", href: "/customer/orders", icon: Package },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black flex flex-col font-sans selection:bg-[#A68868] selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-[#A68868] text-white py-2 px-4 text-center text-xs font-bold tracking-wide shadow-xs flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-[#E3C39D] animate-pulse" />
        <span>Explore Handcrafted Hallmark Certified Jewellery Direct from Master Artisans</span>
        <Sparkles className="w-3.5 h-3.5 text-[#E3C39D] animate-pulse" />
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#CDD5DB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Brand Logo */}
            <Link to="/customer/home" className="flex items-center gap-3 group">
              <div className="w-11 h-11 rounded-2xl bg-[#A68868] flex items-center justify-center text-white shadow-md group-hover:bg-[#8A6D4F] transition-all duration-300">
                <Gem className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-black text-black tracking-tight group-hover:text-[#A68868] transition-colors">
                  AuraCraft
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-[#A68868] font-bold">
                  Luxury Jewellery
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 bg-[#CDD5DB]/40 p-1.5 rounded-full border border-[#CDD5DB]">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-200 relative ${
                      isActive
                        ? "bg-[#A68868] text-white shadow-sm"
                        : "text-black hover:text-[#A68868] hover:bg-[#E3C39D]/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A68868]"}`} />
                    <span className="font-extrabold">{link.name}</span>
                    {Boolean(link.badge) && link.badge > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-[#E3C39D] text-[10px] font-black text-black leading-tight shadow-xs">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden sm:flex items-center gap-3">
              <NotificationBell />

              <Link
                to="/customer/cart"
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-extrabold tracking-wide shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart ({cartCount})</span>
              </Link>

              <Link
                to="/customer/profile"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-[#E3C39D]/40 hover:bg-[#E3C39D]/70 border border-[#A68868]/40 transition-all group"
              >
                <div className="w-7 h-7 rounded-full bg-[#A68868] text-white flex items-center justify-center text-xs font-bold">
                  {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                </div>
                <span className="text-xs font-extrabold text-black group-hover:text-[#A68868]">
                  {user?.full_name || "Customer"}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full bg-[#CDD5DB]/50 hover:bg-rose-100 text-[#A68868] hover:text-rose-600 border border-[#CDD5DB] transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2.5 rounded-full bg-[#A68868] text-white"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

          </div>
        </div>

        {/* Mobile Nav Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#F8F6F2] border-b border-[#CDD5DB] px-4 pt-2 pb-4 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold ${
                    isActive
                      ? "bg-[#A68868] text-white"
                      : "text-black hover:bg-[#E3C39D]/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{link.name}</span>
                  </div>
                  {Boolean(link.badge) && link.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E3C39D] text-black text-[10px] font-black">
                      {link.badge}
                    </span>
                  )}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-[#CDD5DB] flex justify-between items-center px-2">
              <Link
                to="/customer/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-black text-black flex items-center gap-2"
              >
                <User className="w-4 h-4 text-[#A68868]" /> Profile Settings
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-black text-rose-600 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Dynamic Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Footer Section */}
      <footer className="bg-[#CDD5DB]/30 border-t border-[#CDD5DB] mt-16 pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          
          {/* Main Footer Card */}
          <div className="bg-[#F8F6F2] rounded-3xl p-8 sm:p-10 border border-[#CDD5DB] shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Store Details */}
            <div className="lg:col-span-4 space-y-6">
              <h3 className="text-xl font-black text-black tracking-tight">
                Visit Our Experience Store!
              </h3>
              <ul className="space-y-4 text-xs font-extrabold text-black">
                <li className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-[#A68868] shrink-0 mt-0.5" />
                  <span>12 Bolshaya Nikitskaya St, City Centre</span>
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#A68868] shrink-0" />
                  <span>Daily: 08:00 – 21:00</span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#A68868] shrink-0" />
                  <span>+7 (495) 123-45-67</span>
                </li>
              </ul>
            </div>

            {/* Middle Column: Newsletter Subscription */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-xl font-black text-black tracking-tight">
                Stay Updated on New Releases & Special Offers
              </h3>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Your e-mail"
                  required
                  className="flex-1 px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-xs font-bold text-black placeholder-[#A68868]/60 focus:outline-none focus:ring-2 focus:ring-[#A68868]"
                />
                <button
                  type="submit"
                  className="px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black tracking-wide transition-all shadow-xs shrink-0"
                >
                  {subscribed ? "Subscribed!" : "Subscribe"}
                </button>
              </form>
              {subscribed && (
                <p className="text-xs text-emerald-800 font-black">Thank you for subscribing!</p>
              )}
            </div>

            {/* Right Column: Illustration Asset Container */}
            <div className="lg:col-span-3 flex justify-center lg:justify-end">
              <div className="w-48 h-36 rounded-2xl bg-[#E3C39D]/30 overflow-hidden flex items-center justify-center p-2 border border-[#CDD5DB] shadow-inner">
                <img
                  src={illustrationImg}
                  alt="AuraCraft Store Illustration"
                  className="w-full h-full object-contain filter drop-shadow-sm"
                />
              </div>
            </div>

          </div>

          {/* Bottom Legal & Social Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-[#CDD5DB] text-xs font-extrabold text-black">
            {/* Social Icons */}
            <div className="flex items-center gap-4">
              <a href="#telegram" className="p-2 rounded-full bg-[#CDD5DB]/60 hover:bg-[#A68868] hover:text-white transition-colors" title="Telegram">
                <Send className="w-4 h-4 text-black" />
              </a>
              <a href="#website" className="p-2 rounded-full bg-[#CDD5DB]/60 hover:bg-[#A68868] hover:text-white transition-colors" title="Website">
                <Globe className="w-4 h-4 text-black" />
              </a>
              <a href="#share" className="p-2 rounded-full bg-[#CDD5DB]/60 hover:bg-[#A68868] hover:text-white transition-colors" title="Share">
                <Share2 className="w-4 h-4 text-black" />
              </a>
            </div>

            {/* Copyright */}
            <div className="font-black text-black">
              © AuraCraft & Leaf & Grain, {new Date().getFullYear()}
            </div>

            {/* Policy links */}
            <div className="flex items-center gap-6 text-[11px] font-black text-black">
              <a href="#privacy" className="hover:underline">Privacy Policy</a>
              <a href="#terms" className="hover:underline">Terms of Service</a>
            </div>

          </div>

        </div>
      </footer>
    </div>
  );
}

