import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import NotificationBell from "../common/NotificationBell";
import {
  Gem,
  LayoutDashboard,
  Package,
  PlusCircle,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function Navbar({ user }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  const navLinks = [
    { name: "Dashboard", href: "/manufacturer/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/manufacturer/products", icon: Package },
    { name: "Add Product", href: "/manufacturer/products/add", icon: PlusCircle },
    { name: "Fulfillment Orders", href: "/manufacturer/orders", icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#CDD5DB] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand / Logo */}
          <div className="flex items-center gap-3">
            <Link
              to="/manufacturer/dashboard"
              className="flex items-center gap-2.5 group"
            >
              <div className="w-10 h-10 rounded-2xl bg-[#A68868] flex items-center justify-center border border-white/40 shadow-xs group-hover:scale-105 transition-all duration-300">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black text-black tracking-tight group-hover:text-[#A68868] transition-colors">
                  AuraCraft
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-[#A68868] font-extrabold">
                  Manufacturer Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-white p-1.5 rounded-full border border-[#CDD5DB] shadow-xs">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.href;
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black tracking-wide transition-all duration-200 ${
                    isActive
                      ? "bg-[#A68868] text-white shadow-xs"
                      : "text-black hover:bg-[#E3C39D]/30"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A68868]"}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Action Menu */}
          <div className="flex items-center gap-3">
            <NotificationBell />

            <Link
              to="/manufacturer/profile"
              className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] transition-all cursor-pointer shadow-xs"
            >
              <User className="w-4 h-4 text-[#A68868]" />
              <span className="text-xs font-black text-black">
                {user?.full_name || "Manufacturer"}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black transition-all duration-200 active:scale-95 shadow-xs"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
