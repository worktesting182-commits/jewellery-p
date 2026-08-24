import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../common/NotificationBell";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Coins,
  ShoppingBasket,
  User,
  LogOut,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const RetailerNavbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/retailer/dashboard", icon: LayoutDashboard },
    { name: "Wholesale Catalog", href: "/retailer/catalog", icon: ShoppingBag },
    { name: "My Store Listings", href: "/retailer/listings", icon: Package },
    { name: "Gold Schemes", href: "/retailer/gold-schemes", icon: Coins },
    { name: "Customer Orders", href: "/retailer/orders", icon: ShoppingBasket },
    { name: "Store Profile", href: "/retailer/profile", icon: User },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (err) {
      console.error("Signout error:", err);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F8F6F2]/95 border-b border-[#CDD5DB] shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/retailer/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-[#C99A2C] border border-white/40 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform duration-300">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-serif font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
              AURA <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FFF8E7] text-[#C99A2C] border border-amber-200 font-bold tracking-wider">Retailer</span>
            </span>
            <span className="text-[10px] text-[#C99A2C] tracking-widest uppercase font-bold">
              Store Portal
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white p-1.5 rounded-full border border-[#EFEBE4] shadow-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-200 ${
                  isActive
                    ? "bg-[#C99A2C] text-white shadow-xs"
                    : "text-gray-800 hover:bg-[#FAF8F5] hover:text-[#C99A2C]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#C99A2C]"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* User Actions */}
        <div className="hidden md:flex items-center gap-3">
          <NotificationBell />

          <div className="text-right">
            <span className="text-xs font-black text-black block leading-snug">
              {user?.full_name || "Retailer Partner"}
            </span>
            <span className="text-[10px] text-black/70 font-bold block">
              {user?.email}
            </span>
          </div>

          <button
            onClick={handleSignOut}
            className="p-2.5 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all duration-200 shadow-xs"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2.5 rounded-full bg-white border border-[#CDD5DB] text-black"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 bg-[#F8F6F2] border-b border-[#CDD5DB] space-y-2 animate-fadeIn">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className={`w-full px-4 py-3 rounded-full text-xs font-black flex items-center gap-3 transition-all ${
                  isActive
                    ? "bg-[#A68868] text-white"
                    : "text-black hover:bg-[#E3C39D]/30"
                }`}
              >
                <Icon className="w-4 h-4 text-[#A68868]" />
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-[#CDD5DB] flex items-center justify-between">
            <span className="text-xs text-black font-black">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="px-3.5 py-2 rounded-full bg-rose-50 text-rose-700 text-xs font-black flex items-center gap-1.5 border border-rose-200"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default RetailerNavbar;
