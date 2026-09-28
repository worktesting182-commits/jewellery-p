import React, { useState, useEffect } from "react";
import NotificationBell from "../components/common/NotificationBell";
import StoreSwitcher from "../components/customer/StoreSwitcher";
import RetailerCodeModal from "../components/customer/RetailerCodeModal";
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
  Mail,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { cartAPI } from "../services/api";
import illustrationImg from "../assets/Illustration.png";

import GoldTickerBar from "../components/common/GoldTickerBar";

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
    <div className="min-h-screen bg-[#FBF9F5] text-black flex flex-col font-sans selection:bg-[#A68868] selection:text-white">
      {/* Live Precious Metals Ticker Bar */}
      <GoldTickerBar />


      {/* Main Header / Navigation (Styled matching Luxe Cloud Trade Header) */}
      <header className="sticky top-0 z-50 transition-all duration-300 glass shadow-sm py-3">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/customer/home" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold transition-transform group-hover:scale-105">
              <Gem className="w-5 h-5 text-white" />
            </div>
            <div className="leading-tight">
              <span className="font-heading text-xl font-bold tracking-tight text-black group-hover:text-[#A68868] transition-colors">
                AuraCraft
              </span>
              <span className="block text-[10px] text-black/60 tracking-widest uppercase -mt-0.5 font-semibold">
                Luxury Jewellery
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links with Luxe Hover Indicators */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`text-sm font-medium transition-colors relative group flex items-center gap-1.5 py-1 ${
                    isActive ? "text-[#A68868] font-bold" : "text-black/80 hover:text-[#A68868]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-[#A68868]" : "text-black/60 group-hover:text-[#A68868]"}`} />
                  <span>{link.name}</span>
                  {Boolean(link.badge) && link.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-[#E3C39D] text-[10px] font-black text-black leading-tight shadow-xs">
                      {link.badge}
                    </span>
                  )}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#A68868] transition-all duration-300 ${
                      isActive ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </Link>
              );
            })}
          </div>

          {/* Actions & Controls */}
          <div className="hidden sm:flex items-center gap-3">
            <StoreSwitcher />
            <NotificationBell />

            <Link
              to="/customer/cart"
              className="bg-gradient-gold text-white px-5 py-2 rounded-full text-xs font-semibold shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Cart ({cartCount})</span>
            </Link>

            <Link
              to="/customer/profile"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E3C39D]/30 hover:bg-[#E3C39D]/60 border border-[#A68868]/30 transition-all group"
            >
              <div className="w-6 h-6 rounded-full bg-[#A68868] text-white flex items-center justify-center text-xs font-bold">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
              </div>
              <span className="text-xs font-extrabold text-black group-hover:text-[#A68868]">
                {user?.full_name || "Customer"}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 rounded-full bg-[#CDD5DB]/40 hover:bg-rose-100 text-[#A68868] hover:text-rose-600 border border-[#CDD5DB] transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-gradient-gold text-white shadow-gold"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Mobile Nav Dropdown */}
          {mobileMenuOpen && (
            <div className="lg:hidden bg-[#FBF9F5] border-t border-[#CDD5DB] px-4 pt-3 pb-4 space-y-2 mt-3">
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
                        ? "bg-[#A68868] text-white shadow-xs"
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

        </nav>
      </header>

      {/* Dynamic Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>

      {/* Luxe Footer Section (Styled matching Luxe Cloud Trade Footer) */}
      <footer className="bg-neutral-950 text-neutral-400 mt-16 border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {/* Brand Info Column */}
            <div className="col-span-2">
              <Link to="/customer/home" className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
                  <Gem className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="font-heading text-xl font-bold text-white block">CJX</span>
                  <span className="block text-[10px] text-neutral-500 tracking-widest uppercase">
                    Cloud Jewellery Exchange
                  </span>
                </div>
              </Link>
              <p className="text-sm text-neutral-500 max-w-xs leading-relaxed mb-6">
                The cloud-based B2B2C jewellery commerce ecosystem connecting manufacturers, retailers, and customers through one unified platform.
              </p>

              {/* Social Media Icons */}
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-[#A68868] flex items-center justify-center transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-facebook w-4 h-4 text-neutral-400 group-hover:text-white"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-[#A68868] flex items-center justify-center transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-instagram w-4 h-4 text-neutral-400 group-hover:text-white"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"></line></svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-[#A68868] flex items-center justify-center transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-twitter w-4 h-4 text-neutral-400 group-hover:text-white"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
                <a
                  href="#"
                  className="w-9 h-9 rounded-full bg-neutral-800 hover:bg-[#A68868] flex items-center justify-center transition-colors group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-youtube w-4 h-4 text-neutral-400 group-hover:text-white"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"></path><path d="m10 15 5-3-5-3z"></path></svg>
                </a>
              </div>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2.5">
                <li><Link to="/customer/products" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Marketplace</Link></li>
                <li><Link to="/customer/products" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Virtual Try-On</Link></li>
                <li><Link to="/gold-sip" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Digital Gold</Link></li>
                <li><Link to="/gold-sip" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Gold Scheme</Link></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Pricing</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">API Docs</a></li>
              </ul>
            </div>

            {/* Solutions */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Solutions</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">For Retailers</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">For Manufacturers</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">For Wholesalers</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">For E-commerce</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Dropshipping</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">POS Integration</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">About Us</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Careers</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Blog</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Case Studies</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Contact</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Book a Demo</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-semibold text-white mb-4">Support</h4>
              <ul className="space-y-2.5">
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Help Center</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">FAQ</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Security</a></li>
                <li><a href="#" className="text-sm text-neutral-500 hover:text-[#A68868] transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-neutral-500">© 2026 Cloud Jewellery Exchange. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-neutral-500">
              <span className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-neutral-400" /> hello@cjx.com
              </span>
              <span className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-neutral-400" /> +91 80-4567-8900
              </span>
            </div>
          </div>
        </div>
      </footer>
      <RetailerCodeModal />
    </div>
  );
}
