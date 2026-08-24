import React, { useState } from "react";
import { Link, useLocation, useNavigate, Outlet } from "react-router-dom";
import { supabase } from "../lib/supabase";
import NotificationBell from "../components/common/NotificationBell";
import {
  Gem,
  LayoutDashboard,
  Package,
  Store,
  Building2,
  Users,
  Coins,
  TrendingUp,
  History,
  Wallet,
  Receipt,
  LogOut,
  ChevronDown,
  BarChart3,
  User,
  ShoppingBasket,
} from "lucide-react";

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [productsOpen, setProductsOpen] = useState(false);
  const [goldOpen, setGoldOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const isActive = (path) => location.pathname === path;
  const isPathGroupActive = (paths) => paths.some((p) => location.pathname.startsWith(p));

  return (
    <div className="min-h-screen bg-[#F8F6F2] font-sans antialiased text-black">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#CDD5DB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo Brand */}
            <Link to="/admin/dashboard" className="flex items-center gap-3 group shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#A68868] to-[#E3C39D] flex items-center justify-center shadow-md group-hover:scale-105 transition-all duration-300">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xl tracking-tight text-black">AuraCraft</span>
                  <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-[#E3C39D]/30 border border-[#A68868]/40 text-[#A68868]">
                    Admin
                  </span>
                </div>
                <p className="text-[10px] text-black/60 font-bold tracking-wider uppercase">Platform Governance</p>
              </div>
            </Link>

            {/* Hierarchical Admin Navigation */}
            <nav className="hidden lg:flex items-center gap-1 bg-[#F4F1EA] p-1.5 rounded-full border border-[#CDD5DB]">
              
              {/* Dashboard */}
              <Link
                to="/admin/dashboard"
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all ${
                  isActive("/admin/dashboard")
                    ? "bg-[#A68868] text-white shadow-xs"
                    : "text-black hover:bg-[#E3C39D]/30"
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              {/* Products Group Dropdown */}
              <div className="relative group" onMouseEnter={() => setProductsOpen(true)} onMouseLeave={() => setProductsOpen(false)}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all ${
                    isPathGroupActive(["/admin/products", "/admin/listings"])
                      ? "bg-[#A68868] text-white shadow-xs"
                      : "text-black hover:bg-[#E3C39D]/30"
                  }`}
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Products</span>
                  <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                </button>

                {productsOpen && (
                  <div className="absolute left-0 mt-1 w-56 bg-white rounded-2xl border border-[#CDD5DB] shadow-xl p-2 z-50 space-y-1 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                      Product Governance
                    </div>
                    <Link
                      to="/admin/products"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive("/admin/products") ? "bg-[#E3C39D]/40 text-black font-black" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-[#A68868]" />
                      <div>
                        <div className="font-black text-black">Manufacturer Products</div>
                        <div className="text-[10px] text-gray-500 font-normal">Master Craftsman Catalog</div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/listings"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive("/admin/listings") ? "bg-[#E3C39D]/40 text-black font-black" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-black text-black">Retailer Products</div>
                        <div className="text-[10px] text-gray-500 font-normal">Commercial Shop Listings</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Gold Management Group Dropdown */}
              <div className="relative group" onMouseEnter={() => setGoldOpen(true)} onMouseLeave={() => setGoldOpen(false)}>
                <Link
                  to="/admin/gold"
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all ${
                    isPathGroupActive(["/admin/gold"])
                      ? "bg-[#A68868] text-white shadow-xs"
                      : "text-black hover:bg-[#E3C39D]/30"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  <span>Gold Management</span>
                  <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                </Link>

                {goldOpen && (
                  <div className="absolute left-0 mt-1 w-64 bg-white rounded-2xl border border-[#CDD5DB] shadow-xl p-2 z-50 space-y-1 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                      Gold & SIP Operations
                    </div>
                    <Link
                      to="/admin/gold?tab=price"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-black text-black">Current Gold Price</div>
                        <div className="text-[10px] text-gray-500 font-normal">Set 24K Benchmark Rate</div>
                      </div>
                    </Link>
                    <Link
                      to="/admin/gold?tab=history"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <History className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-black text-black">Gold Price History</div>
                        <div className="text-[10px] text-gray-500 font-normal">Audit Rate Adjustments</div>
                      </div>
                    </Link>
                    <Link
                      to="/admin/gold?tab=sips"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <Coins className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-black text-black">SIPs</div>
                        <div className="text-[10px] text-gray-500 font-normal">Retailer-Managed Plans</div>
                      </div>
                    </Link>
                    <Link
                      to="/admin/gold?tab=sip-tx"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <Receipt className="w-4 h-4 text-indigo-600" />
                      <div>
                        <div className="font-black text-black">SIP Transactions</div>
                        <div className="text-[10px] text-gray-500 font-normal">Monthly Installments</div>
                      </div>
                    </Link>
                    <Link
                      to="/admin/gold?tab=holdings"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50"
                    >
                      <Wallet className="w-4 h-4 text-[#A68868]" />
                      <div>
                        <div className="font-black text-black">Customer Holdings</div>
                        <div className="text-[10px] text-gray-500 font-normal">Gold Wallet Balances</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Users Group Dropdown */}
              <div className="relative group" onMouseEnter={() => setUsersOpen(true)} onMouseLeave={() => setUsersOpen(false)}>
                <button
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all ${
                    isPathGroupActive(["/admin/users", "/admin/retailers", "/admin/manufacturers"])
                      ? "bg-[#A68868] text-white shadow-xs"
                      : "text-black hover:bg-[#E3C39D]/30"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users</span>
                  <ChevronDown className="w-3 h-3 transition-transform group-hover:rotate-180" />
                </button>

                {usersOpen && (
                  <div className="absolute left-0 mt-1 w-52 bg-white rounded-2xl border border-[#CDD5DB] shadow-xl p-2 z-50 space-y-1 animate-fadeIn">
                    <div className="px-3 py-1.5 border-b border-gray-100 text-[10px] font-black uppercase text-gray-400">
                      User Accounts
                    </div>
                    <Link
                      to="/admin/users"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive("/admin/users") ? "bg-[#E3C39D]/40 text-black font-black" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="font-black text-black">Customers</div>
                        <div className="text-[10px] text-gray-500 font-normal">Platform Buyers</div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/retailers"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive("/admin/retailers") ? "bg-[#E3C39D]/40 text-black font-black" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      <div>
                        <div className="font-black text-black">Retailers</div>
                        <div className="text-[10px] text-gray-500 font-normal">Retail Stores & SIPs</div>
                      </div>
                    </Link>

                    <Link
                      to="/admin/manufacturers"
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isActive("/admin/manufacturers") ? "bg-[#E3C39D]/40 text-black font-black" : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-black text-black">Manufacturers</div>
                        <div className="text-[10px] text-gray-500 font-normal">Artisans & Workshops</div>
                      </div>
                    </Link>
                  </div>
                )}
              </div>

              {/* Orders */}
              <Link
                to="/admin/orders"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-black transition-all ${
                  isActive("/admin/orders") ? "bg-[#A68868] text-white shadow-xs" : "text-black hover:bg-[#E3C39D]/30"
                }`}
              >
                <ShoppingBasket className="w-3.5 h-3.5" />
                <span>Orders</span>
              </Link>

              {/* Reports */}
              <Link
                to="/admin/reports"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-black transition-all ${
                  isActive("/admin/reports") ? "bg-[#A68868] text-white shadow-xs" : "text-black hover:bg-[#E3C39D]/30"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Reports</span>
              </Link>

              {/* Profile */}
              <Link
                to="/admin/profile"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-black transition-all ${
                  isActive("/admin/profile") ? "bg-[#A68868] text-white shadow-xs" : "text-black hover:bg-[#E3C39D]/30"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Profile</span>
              </Link>
            </nav>

            {/* Notification Bell & Logout */}
            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
        <Outlet />
      </main>
    </div>
  );
}
