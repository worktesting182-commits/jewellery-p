import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Users,
  ShoppingBag,
  Package,
  ShoppingBasket,
  DollarSign,
  TrendingUp,
  Building2,
  Store,
  Gem,
  Download,
  Award,
  Sparkles,
  BarChart3,
  PieChart,
} from "lucide-react";
import { adminAPI } from "../../services/api";

const AdminReports = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState({
    summary: {
      totalUsers: 0,
      products: 0,
      listings: 0,
      orders: 0,
      revenue: 0,
      averageOrderValue: 0,
    },
    insights: {
      topManufacturers: [],
      topRetailers: [],
      bestSellingProducts: [],
    },
  });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getReports();
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching admin reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExportCSV = () => {
    const summary = reportData.summary;
    const insights = reportData.insights;

    const content = [
      ["Executive Performance Report - Circular Junction Platform"],
      ["Date Generated", new Date().toLocaleDateString("en-IN")],
      [],
      ["--- Platform Summary Metrics ---"],
      ["Metric", "Value"],
      ["Total Users", summary.totalUsers],
      ["Master Products", summary.products],
      ["Retailer Listings", summary.listings],
      ["Total Orders", summary.orders],
      ["Gross Revenue (INR)", summary.revenue],
      ["Average Order Value (INR)", summary.averageOrderValue],
      [],
      ["--- Top Manufacturers ---"],
      ["Manufacturer Name", "Product Count"],
      ...insights.topManufacturers.map((m) => [`"${m.name}"`, m.count]),
      [],
      ["--- Top Retailers ---"],
      ["Retailer Shop Name", "Listings Count"],
      ...insights.topRetailers.map((r) => [`"${r.name}"`, r.count]),
      [],
      ["--- Best Selling Products ---"],
      ["Product Title", "Units Sold", "Revenue Generated (INR)"],
      ...insights.bestSellingProducts.map((p) => [`"${p.name}"`, p.sales || 0, p.revenue || 0]),
    ];

    const csvContent = "data:text/csv;charset=utf-8," + content.map((row) => row.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Executive_Analytics_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Executive analytics report exported to CSV successfully!");
  };

  const summaryCards = [
    {
      title: "Total Users",
      value: reportData.summary.totalUsers,
      subtext: "Registered Customers, Mfg, Retailers",
      icon: Users,
    },
    {
      title: "Products",
      value: reportData.summary.products,
      subtext: "Master Wholesale Catalog Items",
      icon: ShoppingBag,
    },
    {
      title: "Listings",
      value: reportData.summary.listings,
      subtext: "Active Retailer Store Listings",
      icon: Package,
    },
    {
      title: "Orders",
      value: reportData.summary.orders,
      subtext: "Platform Orders Completed",
      icon: ShoppingBasket,
    },
    {
      title: "Revenue",
      value: `₹${Number(reportData.summary.revenue || 0).toLocaleString("en-IN")}`,
      subtext: "Platform Gross Volume (GMV)",
      icon: DollarSign,
    },
    {
      title: "Average Order Value",
      value: `₹${Number(reportData.summary.averageOrderValue || 0).toLocaleString("en-IN")}`,
      subtext: "Platform Average Spend per Order",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all font-black text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <Award className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#A68868]" /> Module 9 – Executive Analytics & Platform Intelligence
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Comprehensive platform performance insights, revenue metrics, average order value, and top partner leaderboards.
          </p>
        </div>

        {/* Export Executive CSV Report Button */}
        <button
          onClick={handleExportCSV}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-white" />
          <span>Export Analytics Report</span>
        </button>
      </div>

      {/* 6 Mandatory Summary Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading executive performance analytics...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaryCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-3 hover:border-[#A68868] transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-black uppercase tracking-wider">
                    {card.title}
                  </span>
                  <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
                    <Icon className="w-5 h-5 text-[#A68868]" />
                  </div>
                </div>

                <div>
                  <span className="text-3xl font-black text-black tracking-tight block">
                    {card.value}
                  </span>
                  <span className="text-[11px] text-black/70 font-bold block mt-1">
                    {card.subtext}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Additional Insights Section */}
      {!loading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insight 1: Top Manufacturers */}
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
              <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#A68868]" /> Top Manufacturers
              </span>
              <span className="text-[10px] text-black/70 font-bold">Master Catalog Output</span>
            </div>

            <div className="space-y-3 font-bold">
              {(reportData.insights?.topManufacturers || []).map((mfg, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#E3C39D]/30 text-[#A68868] font-black flex items-center justify-center border border-[#A68868]/30 text-xs">
                      #{idx + 1}
                    </div>
                    <span className="font-black text-black">{mfg.name}</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-[#E3C39D]/40 text-black font-black border border-[#A68868]/40">
                    {mfg.count} items
                  </span>
                </div>
              ))}

              {(!reportData.insights?.topManufacturers || reportData.insights.topManufacturers.length === 0) && (
                <div className="py-8 text-center text-xs text-black/70 font-bold">
                  No manufacturer performance data available.
                </div>
              )}
            </div>
          </div>

          {/* Insight 2: Top Retailers */}
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
              <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <Store className="w-4 h-4 text-[#A68868]" /> Top Retailers
              </span>
              <span className="text-[10px] text-black/70 font-bold">Store Listings</span>
            </div>

            <div className="space-y-3 font-bold">
              {(reportData.insights?.topRetailers || []).map((ret, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#E3C39D]/30 text-[#A68868] font-black flex items-center justify-center border border-[#A68868]/30 text-xs">
                      #{idx + 1}
                    </div>
                    <span className="font-black text-black">{ret.name}</span>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-[#E3C39D]/40 text-black font-black border border-[#A68868]/40">
                    {ret.count} listings
                  </span>
                </div>
              ))}

              {(!reportData.insights?.topRetailers || reportData.insights.topRetailers.length === 0) && (
                <div className="py-8 text-center text-xs text-black/70 font-bold">
                  No retailer store listing data available.
                </div>
              )}
            </div>
          </div>

          {/* Insight 3: Best Selling Products */}
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
              <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <Gem className="w-4 h-4 text-[#A68868]" /> Best Selling Products
              </span>
              <span className="text-[10px] text-black/70 font-bold">Sales Volume</span>
            </div>

            <div className="space-y-3 font-bold">
              {(reportData.insights?.bestSellingProducts || []).map((prod, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-xl bg-[#E3C39D]/30 text-[#A68868] font-black flex items-center justify-center border border-[#A68868]/30 text-xs">
                      #{idx + 1}
                    </div>
                    <div>
                      <span className="font-black text-black block">{prod.name}</span>
                      <span className="text-[10px] text-black font-mono font-black">₹{Number(prod.revenue || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <span className="px-3 py-0.5 rounded-full bg-[#E3C39D]/40 text-black font-black border border-[#A68868]/40">
                    {prod.sales || 0} sold
                  </span>
                </div>
              ))}

              {(!reportData.insights?.bestSellingProducts || reportData.insights.bestSellingProducts.length === 0) && (
                <div className="py-8 text-center text-xs text-black/70 font-bold">
                  No best selling products data available.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
