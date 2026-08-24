import React, { useState, useEffect } from "react";
import NotificationBell from "../../components/common/NotificationBell";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Gem,
  Users,
  Building2,
  Store,
  ShoppingBag,
  Package,
  ShoppingBasket,
  DollarSign,
  LogOut,
  Sparkles,
  ShieldCheck,
  Lock,
  ChevronRight,
  User,
} from "lucide-react";
import { adminAPI } from "../../services/api";
import StatCard from "../../components/admin/StatCard";
import DashboardChart from "../../components/admin/DashboardChart";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    customers: 0,
    manufacturers: 0,
    retailers: 0,
    admins: 0,
    manufacturerProducts: 0,
    retailerListings: 0,
    orders: 0,
    revenue: 0,
    charts: {
      usersByRole: [],
      ordersPerMonth: [],
      productsByCategory: [],
    },
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboardStats();
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching admin dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const metricCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      subtext: `${stats.customers} Customers • ${stats.manufacturers} Mfg • ${stats.retailers} Retailers`,
      icon: Users,
      color: "from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-300",
    },
    {
      title: "Customers",
      value: stats.customers,
      subtext: "Active Platform Buyers",
      icon: ShieldCheck,
      color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30 text-blue-300",
    },
    {
      title: "Manufacturers",
      value: stats.manufacturers,
      subtext: "Master Jewellery Artisans",
      icon: Building2,
      color: "from-purple-500/20 to-indigo-500/10 border-purple-500/30 text-purple-300",
    },
    {
      title: "Retailers",
      value: stats.retailers,
      subtext: "Commercial Store Listings",
      icon: Store,
      color: "from-amber-500/20 to-yellow-500/10 border-amber-500/30 text-amber-300",
    },
    {
      title: "Manufacturer Products",
      value: stats.manufacturerProducts,
      subtext: "Master Wholesale Catalog",
      icon: ShoppingBag,
      color: "from-teal-500/20 to-emerald-500/10 border-teal-500/30 text-teal-300",
    },
    {
      title: "Retailer Listings",
      value: stats.retailerListings,
      subtext: "Marketplace Store Products",
      icon: Package,
      color: "from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-300",
    },
    {
      title: "Platform Orders",
      value: stats.orders,
      subtext: "Total Customer Purchases",
      icon: ShoppingBasket,
      color: "from-indigo-500/20 to-purple-500/10 border-indigo-500/30 text-indigo-300",
    },
    {
      title: "Total Revenue",
      value: `₹${Number(stats.revenue || 0).toLocaleString("en-IN")}`,
      subtext: "Platform Gross Volume (GMV)",
      icon: DollarSign,
      color: "from-emerald-600/20 to-emerald-400/10 border-emerald-400/40 text-emerald-200",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black font-sans selection:bg-[#E3C39D] selection:text-black animate-fadeIn">
      {/* Navigation Header */}
      <header className="sticky top-0 z-40 w-full bg-[#F8F6F2]/95 backdrop-blur-md border-b border-[#CDD5DB] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#A68868] border border-white/40 flex items-center justify-center text-white shadow-xs">
                <Gem className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black text-black tracking-tight flex items-center gap-2">
                  AuraCraft <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-[#E3C39D]/40 text-black border border-[#A68868]/40 uppercase font-black tracking-wider">ADMIN</span>
                </span>
                <span className="block text-[10px] uppercase tracking-widest text-[#A68868] font-black">
                  Platform Control Hub
                </span>
              </div>
            </div>

            {/* Quick Links Nav */}
            <div className="hidden md:flex items-center gap-1 text-xs font-black text-black bg-white p-1.5 rounded-full border border-[#CDD5DB]">
              <Link to="/admin/dashboard" className="px-3.5 py-1.5 rounded-full bg-[#A68868] text-white">Dashboard</Link>
              <Link to="/admin/users" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Users</Link>
              <Link to="/admin/manufacturers" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Manufacturers</Link>
              <Link to="/admin/retailers" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Retailers</Link>
              <Link to="/admin/categories" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Categories</Link>
              <Link to="/admin/products" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Products</Link>
              <Link to="/admin/listings" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Listings</Link>
              <Link to="/admin/orders" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Orders</Link>
              <Link to="/admin/reports" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30">Reports</Link>
              <Link to="/admin/profile" className="px-3 py-1.5 rounded-full hover:bg-[#E3C39D]/30 text-black">Profile</Link>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-black transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8">
        {/* Banner Callout (Admin Governance Rule) */}
        <div className="relative rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-[11px] font-black text-black uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#A68868]" />
                <span>Platform Governance & Oversight</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight">
                Administrator Control Hub
              </h1>
              <p className="text-xs text-black/80 font-bold leading-relaxed">
                Platform administration oversight mode. Admin monitors overall metrics, user governance, master catalog listings, order throughput, and system health.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#CDD5DB]/20 border border-[#CDD5DB] space-y-1 text-xs shrink-0">
              <span className="text-[10px] text-black/70 uppercase font-black block flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#A68868]" /> Admin Role Policy
              </span>
              <p className="text-[11px] font-black text-black">
                No Selling • No Manufacturing • No Buying
              </p>
            </div>
          </div>
        </div>

        {/* 8 Mandatory Dashboard Cards */}
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-black text-black">Loading platform statistics & analytics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metricCards.map((card, idx) => (
              <StatCard
                key={idx}
                title={card.title}
                value={card.value}
                subtext={card.subtext}
                icon={card.icon}
              />
            ))}
          </div>
        )}

        {/* Analytics Charts Section */}
        {!loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DashboardChart title="Users by Role" type="usersByRole" data={stats.charts?.usersByRole} />
            <DashboardChart title="Orders per Month" type="ordersPerMonth" data={stats.charts?.ordersPerMonth} />
            <DashboardChart title="Products by Category" type="productsByCategory" data={stats.charts?.productsByCategory} />
          </div>
        )}
      </main>
    </div>
  );
}
