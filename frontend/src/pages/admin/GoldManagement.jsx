import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Coins,
  TrendingUp,
  History,
  Wallet,
  Receipt,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Store,
  ShieldCheck,
  Calendar,
  RefreshCw,
  Info,
  Gem,
} from "lucide-react";
import { adminAPI } from "../../services/api";

export default function GoldManagement() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "price";
  const [activeTab, setActiveTab] = useState(initialTab);

  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");

  // Data States
  const [currentGoldRate, setCurrentGoldRate] = useState(7245);
  const [currentSilverRate, setCurrentSilverRate] = useState(85);
  const [priceHistory, setPriceHistory] = useState([]);
  const [sips, setSips] = useState([]);
  const [sipTransactions, setSipTransactions] = useState([]);
  const [customerHoldings, setCustomerHoldings] = useState([]);
  const [goldLedger, setGoldLedger] = useState([]);

  // Price Form State
  const [newGoldPrice, setNewGoldPrice] = useState("");
  const [newSilverPrice, setNewSilverPrice] = useState("");
  const [priceNotes, setPriceNotes] = useState("");
  const [submittingPrice, setSubmittingPrice] = useState(false);

  useEffect(() => {
    setActiveTab(searchParams.get("tab") || "price");
  }, [searchParams]);

  useEffect(() => {
    fetchTabContent(activeTab);
  }, [activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchTabContent = async (tab) => {
    try {
      setLoading(true);
      if (tab === "price" || tab === "history") {
        const res = await adminAPI.getGoldPriceHistory();
        if (res.data?.success) {
          setPriceHistory(res.data.data || []);
          const gRate = res.data.current_gold_price || res.data.current_price || 7245;
          const sRate = res.data.current_silver_price || 85;
          setCurrentGoldRate(gRate);
          setCurrentSilverRate(sRate);
          if (!newGoldPrice) setNewGoldPrice(gRate);
          if (!newSilverPrice) setNewSilverPrice(sRate);
        }
      } else if (tab === "sips") {
        const res = await adminAPI.getSips();
        if (res.data?.success) {
          setSips(res.data.data || []);
        }
      } else if (tab === "sip-tx") {
        const res = await adminAPI.getSipTransactions();
        if (res.data?.success) {
          setSipTransactions(res.data.data || []);
        }
      } else if (tab === "holdings") {
        const res = await adminAPI.getCustomerGoldBalances();
        if (res.data?.success) {
          setCustomerHoldings(res.data.data || []);
          if (res.data.current_gold_rate) {
            setCurrentGoldRate(res.data.current_gold_rate);
          }
        }
      } else if (tab === "ledger") {
        const res = await adminAPI.getGoldTransactions();
        if (res.data?.success) {
          setGoldLedger(res.data.data || []);
        }
      }
    } catch (err) {
      console.error("Error fetching admin bullion data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrice = async (e) => {
    e.preventDefault();
    const numGold = Number(newGoldPrice);
    const numSilver = Number(newSilverPrice);

    if (!numGold || numGold <= 0) {
      showToast("Please enter a valid benchmark 24K gold rate per gram", "error");
      return;
    }
    if (!numSilver || numSilver <= 0) {
      showToast("Please enter a valid benchmark silver rate per gram", "error");
      return;
    }

    try {
      setSubmittingPrice(true);
      const res = await adminAPI.setGoldPrice({
        gold_price_per_gram: numGold,
        silver_price_per_gram: numSilver,
        price_per_gram: numGold,
        notes: priceNotes || "Admin manual rate adjustment for Gold & Silver",
      });

      if (res.data?.success) {
        showToast(`Benchmark rates updated! Gold: ₹${numGold.toLocaleString("en-IN")}/g • Silver: ₹${numSilver.toLocaleString("en-IN")}/g`);
        setCurrentGoldRate(numGold);
        setCurrentSilverRate(numSilver);
        setPriceNotes("");
        fetchTabContent("price");
      }
    } catch (err) {
      console.error("Error setting bullion prices:", err);
      showToast(err.response?.data?.message || "Failed to update rates", "error");
    } finally {
      setSubmittingPrice(false);
    }
  };

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
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner Header */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#44403C] text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-yellow-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Gold & Silver Bullion Management</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Bullion Price Controller & SIP Hub
            </h1>
            <p className="text-xs text-amber-100/80 font-bold leading-relaxed">
              Set live benchmark rates for Gold (24K) and Silver, audit rate history, oversee retailer-provided SIP plans, review installment payments, and monitor customer gold holdings.
            </p>
          </div>

          {/* Live Benchmark Rates Badges */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Gold Rate Badge */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1 text-right">
              <span className="text-[10px] text-amber-200 uppercase font-black tracking-wider block flex items-center justify-end gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" /> 24K Gold Rate
              </span>
              <div className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">
                ₹{currentGoldRate.toLocaleString("en-IN")}<span className="text-xs font-normal text-amber-100">/g</span>
              </div>
              <p className="text-[10px] font-bold text-amber-200/70">24K Fine Gold</p>
            </div>

            {/* Silver Rate Badge */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 space-y-1 text-right">
              <span className="text-[10px] text-slate-200 uppercase font-black tracking-wider block flex items-center justify-end gap-1">
                <Gem className="w-3.5 h-3.5 text-slate-300" /> Fine Silver Rate
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
                ₹{currentSilverRate.toLocaleString("en-IN")}<span className="text-xs font-normal text-slate-300">/g</span>
              </div>
              <p className="text-[10px] font-bold text-slate-300/70">Fine Silver / 925</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#CDD5DB] no-scrollbar">
        <button
          onClick={() => handleTabChange("price")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 ${
            activeTab === "price"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Set Gold & Silver Rates</span>
        </button>

        <button
          onClick={() => handleTabChange("history")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 ${
            activeTab === "history"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Bullion Rate History</span>
        </button>

        <button
          onClick={() => handleTabChange("sips")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 ${
            activeTab === "sips"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-500" />
          <span>Retailer Gold Schemes (Monitoring)</span>
        </button>

        <button
          onClick={() => handleTabChange("sip-tx")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 ${
            activeTab === "sip-tx"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <Receipt className="w-4 h-4 text-blue-500" />
          <span>SIP Transactions</span>
        </button>

        <button
          onClick={() => handleTabChange("holdings")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 ${
            activeTab === "holdings"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <Wallet className="w-4 h-4 text-emerald-500" />
          <span>Customer Holdings</span>
        </button>

        <button
          onClick={() => handleTabChange("ledger")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all shrink-0 ${
            activeTab === "ledger"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-500" />
          <span>Gold Ledger</span>
        </button>
      </div>

      {/* TAB 1: SET GOLD & SILVER PRICES */}
      {activeTab === "price" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form Card */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-black text-[#A68868] uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" /> Admin Price Controller
              </div>
              <h2 className="text-xl font-black text-black">Set Platform Benchmark Gold & Silver Rates</h2>
              <p className="text-xs font-bold text-gray-500">
                Updating benchmark 24K gold and fine silver rates affects real-time SIP gold allocations, store catalog market pricing, and wallet portfolio valuations across the platform.
              </p>
            </div>

            <form onSubmit={handleSetPrice} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* 24K Gold Price Input */}
                <div>
                  <label className="block text-xs font-black text-[#A68868] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" /> Benchmark 24K Gold Price (₹/gram) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg text-gray-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={newGoldPrice}
                      onChange={(e) => setNewGoldPrice(e.target.value)}
                      className="w-full pl-9 pr-4 py-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] font-black text-lg bg-gray-50"
                      placeholder="e.g. 7245.00"
                    />
                  </div>
                </div>

                {/* Silver Price Input */}
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Gem className="w-4 h-4 text-slate-500" /> Benchmark Silver Price (₹/gram) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-lg text-gray-400">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      required
                      value={newSilverPrice}
                      onChange={(e) => setNewSilverPrice(e.target.value)}
                      className="w-full pl-9 pr-4 py-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] font-black text-lg bg-gray-50"
                      placeholder="e.g. 85.00"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-800 uppercase tracking-wider mb-2">
                  Reason / Adjustment Notes
                </label>
                <textarea
                  rows={3}
                  value={priceNotes}
                  onChange={(e) => setPriceNotes(e.target.value)}
                  className="w-full p-4 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                  placeholder="e.g. Daily market rate update based on MCX benchmark..."
                />
              </div>

              <button
                type="submit"
                disabled={submittingPrice}
                className="w-full py-4 rounded-full bg-[#A68868] hover:bg-[#8e7254] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submittingPrice ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Updating Benchmark Rates...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      Publish New Rates (₹{Number(newGoldPrice || 0).toLocaleString("en-IN")}/g Gold • ₹{Number(newSilverPrice || 0).toLocaleString("en-IN")}/g Silver)
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Rate Policy Card */}
          <div className="bg-gradient-to-br from-[#F4F1EA] to-white rounded-3xl border border-[#CDD5DB] p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-black text-[#A68868] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" /> Governance Guidelines
            </div>
            <h3 className="text-base font-black text-black">Bullion Rate Governance</h3>
            
            <ul className="space-y-3 text-xs font-bold text-gray-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Gold (24K) and Silver benchmark rates apply platform-wide across all catalog listings and digital gold conversions.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Retailers manage individual SIP plans, with installment gold allocation executed against the active benchmark rate.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>All price updates are logged immutably in the rate history audit trail.</span>
              </li>
            </ul>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold space-y-1">
              <span className="font-black text-amber-950 block flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-600" /> Note on SIP Provider Role:
              </span>
              <p className="text-[11px] leading-relaxed">
                SIP programs are provided and managed directly by each Retailer for their customer base. Admin maintains official platform benchmark pricing for Gold and Silver.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOLD & SILVER PRICE HISTORY */}
      {activeTab === "history" && (
        <div className="bg-white rounded-3xl border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-black">Bullion Rate History & Audit Logs</h2>
              <p className="text-xs font-bold text-gray-500">Historical record of Gold and Silver benchmark price changes.</p>
            </div>
            <button
              onClick={() => fetchTabContent("history")}
              className="px-4 py-2 rounded-full border border-[#CDD5DB] hover:bg-gray-50 text-xs font-black flex items-center gap-2 self-start sm:self-auto"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black">Loading rate history logs...</p>
            </div>
          ) : priceHistory.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-gray-500">
              No historical price logs recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CDD5DB] text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Effective Date</th>
                    <th className="py-3.5 px-4">Metal / Purity</th>
                    <th className="py-3.5 px-4">Rate per Gram</th>
                    <th className="py-3.5 px-4">Currency</th>
                    <th className="py-3.5 px-4">Notes / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                  {priceHistory.map((item, idx) => {
                    const isSilver = item.purity === "FINE_SILVER" || (item.notes && item.notes.toLowerCase().includes("silver"));

                    return (
                      <tr key={item.id || idx} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-4 font-black text-black">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[#A68868]" />
                            <span>{new Date(item.effective_from || item.created_at).toLocaleString("en-IN")}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1 ${
                              isSilver
                                ? "bg-slate-100 text-slate-900 border border-slate-300"
                                : "bg-amber-100 text-amber-900 border border-amber-300"
                            }`}
                          >
                            {isSilver ? <Gem className="w-3 h-3 text-slate-500" /> : <Coins className="w-3 h-3 text-amber-600" />}
                            {isSilver ? "Fine Silver" : (item.purity || "24K Gold")}
                          </span>
                        </td>
                        <td className={`py-4 px-4 font-black text-sm ${isSilver ? "text-slate-800" : "text-emerald-700"}`}>
                          ₹{Number(item.price_per_gram).toLocaleString("en-IN")} / g
                        </td>
                        <td className="py-4 px-4 text-gray-500">
                          {item.currency || "INR"}
                        </td>
                        <td className="py-4 px-4 text-gray-600 max-w-xs truncate">
                          {item.notes || "Standard benchmark rate update"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SIPS (RETAILER-MANAGED) */}
      {activeTab === "sips" && (
        <div className="bg-white rounded-3xl border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-black">Gold SIP Enrollment Directory</h2>
                <span className="px-3 py-0.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[10px] font-black">
                  Managed by Retailers
                </span>
              </div>
              <p className="text-xs font-bold text-gray-500">
                View all active and historical SIP gold accumulation plans created and managed by partner retailers.
              </p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search SIPs, Customer, Retailer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full border border-[#CDD5DB] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#A68868] w-64 bg-gray-50"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black">Loading SIP plans...</p>
            </div>
          ) : sips.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-gray-500">
              No Gold SIP enrollments found on the platform.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CDD5DB] text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Retailer Provider</th>
                    <th className="py-3.5 px-4">Plan Amount</th>
                    <th className="py-3.5 px-4">Frequency</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Gold Acquired</th>
                    <th className="py-3.5 px-4">Next Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                  {sips
                    .filter(
                      (s) =>
                        !search ||
                        s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                        s.retailer_name?.toLowerCase().includes(search.toLowerCase()) ||
                        s.customer_email?.toLowerCase().includes(search.toLowerCase())
                    )
                    .map((sip) => (
                      <tr key={sip.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-black text-black">{sip.customer_name}</div>
                          <div className="text-[10px] text-gray-500">{sip.customer_email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 font-black text-amber-900">
                            <Store className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>{sip.retailer_provider}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-black text-black">
                          ₹{Number(sip.amount).toLocaleString("en-IN")}
                        </td>
                        <td className="py-4 px-4">
                          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 text-[10px] font-black">
                            {sip.frequency}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                              sip.status === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-900"
                                : sip.status === "PAUSED"
                                ? "bg-amber-100 text-amber-900"
                                : "bg-rose-100 text-rose-900"
                            }`}
                          >
                            {sip.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-black text-amber-700">
                          {Number(sip.gold_acquired || 0).toFixed(4)} g
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {sip.next_payment_date}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SIP TRANSACTIONS */}
      {activeTab === "sip-tx" && (
        <div className="bg-white rounded-3xl border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-black">SIP Payment & Installment Transactions</h2>
            <p className="text-xs font-bold text-gray-500">
              Audit log of monthly/weekly SIP installment payments processed between customers and retailer providers.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black">Loading SIP installment transactions...</p>
            </div>
          ) : sipTransactions.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-gray-500">
              No SIP payment transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CDD5DB] text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Retailer Provider</th>
                    <th className="py-3.5 px-4">Amount Paid</th>
                    <th className="py-3.5 px-4">Gold Rate</th>
                    <th className="py-3.5 px-4">Gold Credited</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                  {sipTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 font-black text-black">
                        {new Date(tx.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 font-black text-black">{tx.customer_name}</td>
                      <td className="py-4 px-4 text-amber-900 font-black">{tx.retailer_name}</td>
                      <td className="py-4 px-4 font-black text-emerald-700">₹{Number(tx.amount).toLocaleString("en-IN")}</td>
                      <td className="py-4 px-4 text-gray-600">₹{Number(tx.gold_price_per_gram).toLocaleString("en-IN")}/g</td>
                      <td className="py-4 px-4 font-black text-amber-700">+{Number(tx.gold_quantity).toFixed(4)} g</td>
                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black uppercase">
                          {tx.status || "SUCCESS"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: CUSTOMER HOLDINGS */}
      {activeTab === "holdings" && (
        <div className="bg-white rounded-3xl border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-black">Customer Gold Wallet Holdings</h2>
            <p className="text-xs font-bold text-gray-500">
              Overview of accumulated gold balances and current estimated INR valuation per customer.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black">Loading customer gold holdings...</p>
            </div>
          ) : customerHoldings.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-gray-500">
              No customer gold holdings found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CDD5DB] text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Customer Name</th>
                    <th className="py-3.5 px-4">Contact Info</th>
                    <th className="py-3.5 px-4">Gold Balance (Grams)</th>
                    <th className="py-3.5 px-4">Current Benchmark Rate</th>
                    <th className="py-3.5 px-4">Portfolio Valuation (INR)</th>
                    <th className="py-3.5 px-4">Last Activity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                  {customerHoldings.map((wallet) => (
                    <tr key={wallet.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 font-black text-black">{wallet.customer_name}</td>
                      <td className="py-4 px-4 text-gray-600">
                        <div>{wallet.customer_email}</div>
                        <div className="text-[10px] text-gray-400">{wallet.customer_phone}</div>
                      </td>
                      <td className="py-4 px-4 font-black text-amber-600 text-sm">
                        {Number(wallet.gold_balance_grams).toFixed(4)} g
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        ₹{Number(wallet.current_rate_per_gram).toLocaleString("en-IN")}/g
                      </td>
                      <td className="py-4 px-4 font-black text-emerald-700 text-sm">
                        ₹{Number(wallet.estimated_value_inr).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-[11px]">
                        {new Date(wallet.updated_at).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: GOLD LEDGER */}
      {activeTab === "ledger" && (
        <div className="bg-white rounded-3xl border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-black text-black">Master Gold Transaction Ledger</h2>
            <p className="text-xs font-bold text-gray-500">
              Double-entry audit ledger of all gold purchases, SIP credits, and redemptions across the platform.
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black">Loading master gold ledger...</p>
            </div>
          ) : goldLedger.length === 0 ? (
            <div className="py-16 text-center text-xs font-bold text-gray-500">
              No ledger transactions recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#CDD5DB] text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Transaction Type</th>
                    <th className="py-3.5 px-4">Gold Grams</th>
                    <th className="py-3.5 px-4">Gold Rate</th>
                    <th className="py-3.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-bold">
                  {goldLedger.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-4 px-4 font-black text-black">
                        {new Date(tx.created_at).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 font-black text-black">{tx.customer_name}</td>
                      <td className="py-4 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                            tx.transaction_type?.includes("REDEMPTION")
                              ? "bg-rose-100 text-rose-900"
                              : "bg-emerald-100 text-emerald-900"
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td
                        className={`py-4 px-4 font-black ${
                          Number(tx.gold_quantity) < 0 ? "text-rose-600" : "text-emerald-600"
                        }`}
                      >
                        {Number(tx.gold_quantity) > 0 ? "+" : ""}
                        {Number(tx.gold_quantity).toFixed(4)} g
                      </td>
                      <td className="py-4 px-4 text-gray-600">₹{Number(tx.gold_price_per_gram).toLocaleString("en-IN")}/g</td>
                      <td className="py-4 px-4 text-gray-600 max-w-xs truncate">{tx.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
