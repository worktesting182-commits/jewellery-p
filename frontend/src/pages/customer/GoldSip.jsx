import React, { useState, useEffect } from "react";
import {
  Coins,
  Sparkles,
  CheckCircle2,
  Clock,
  Plus,
  Play,
  Pause,
  X,
  TrendingUp,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpRight,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  Trash2,
  Store,
  Wallet,
  Lock,
} from "lucide-react";
import { goldSipAPI } from "../../services/api";

const GoldSip = () => {
  const [activeTab, setActiveTab] = useState("browse"); // "browse" | "my-schemes"
  const [wallet, setWallet] = useState(null);
  const [sips, setSips] = useState([]);
  const [availableSchemes, setAvailableSchemes] = useState([]);
  const [prices, setPrices] = useState({ current_price_per_gram: 7245 });
  const [loading, setLoading] = useState(true);

  // Modal & Processing state
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [processingPayId, setProcessingPayId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSipData();
  }, []);

  const fetchSipData = async () => {
    try {
      setLoading(true);
      const [walletRes, sipsRes, pricesRes, schemesRes] = await Promise.all([
        goldSipAPI.getWallet().catch(() => null),
        goldSipAPI.getSips().catch(() => null),
        goldSipAPI.getPrices().catch(() => null),
        goldSipAPI.getAvailableSchemes().catch(() => null),
      ]);

      const walletObj = walletRes?.data?.data || walletRes?.data || null;
      if (walletObj) {
        setWallet(walletObj);
      }
      if (sipsRes?.data?.data || sipsRes?.data?.sips) {
        setSips(sipsRes.data.data || sipsRes.data.sips || []);
      }
      if (pricesRes?.data?.data) {
        setPrices(pricesRes.data.data);
      }
      if (schemesRes?.data?.data || schemesRes?.data?.schemes) {
        setAvailableSchemes(schemesRes.data.data || schemesRes.data.schemes || []);
      }
    } catch (err) {
      console.error("Error fetching Gold Scheme data:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  const handleEnrollInScheme = async (scheme) => {
    try {
      setSubmitting(true);
      await goldSipAPI.createSip({
        scheme_id: scheme.id,
        retailer_id: scheme.retailer_id,
        amount: Number(scheme.monthly_amount),
        plan_name: scheme.title,
        fixed_gold_rate: scheme.fixed_gold_rate,
        time_period_months: scheme.time_period_months,
        frequency: scheme.frequency || "MONTHLY",
      });
      showToast(`Successfully enrolled in "${scheme.title}" with ${scheme.retailer_name || "Store"}!`);
      setSelectedScheme(null);
      setActiveTab("my-schemes");
      fetchSipData();
    } catch (err) {
      console.error("Error enrolling in scheme:", err);
      showToast(err.response?.data?.message || "Failed to enroll in scheme", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayInstallment = async (sipId) => {
    try {
      setProcessingPayId(sipId);
      const res = await goldSipAPI.payInstallment(sipId);
      const data = res?.data?.data;
      showToast(
        `Payment processed! Acquired ${data?.gold_acquired}g gold @ ₹${data?.gold_price_per_gram}/g`
      );
      fetchSipData();
    } catch (err) {
      console.error("Error paying installment:", err);
      showToast(err.response?.data?.message || "Failed to process installment payment", "error");
    } finally {
      setProcessingPayId(null);
    }
  };

  const handleStatusToggle = async (sipId, currentStatus) => {
    const newStatus = currentStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    try {
      if (newStatus === "PAUSED") {
        await goldSipAPI.pauseSip(sipId);
      } else {
        await goldSipAPI.resumeSip(sipId);
      }
      showToast(`Scheme status updated to ${newStatus}`);
      fetchSipData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to update status", "error");
    }
  };

  const handleDeleteSip = async (sipId, planName) => {
    if (!window.confirm(`Are you sure you want to delete scheme "${planName || "Gold Scheme"}"?`)) return;
    try {
      await goldSipAPI.deleteSip(sipId);
      showToast("Gold Scheme plan deleted.");
      fetchSipData();
    } catch (err) {
      showToast(err.response?.data?.message || "Failed to delete scheme", "error");
    }
  };

  const goldPricePerGram = Number(prices.current_price_per_gram || prices.price_per_gram || 7245);
  const goldBalance = Number(wallet?.gold_balance || wallet?.total_gold_grams || 0);
  const totalValueINR = Math.round(goldBalance * goldPricePerGram);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-10 space-y-8 animate-fadeIn">
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

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#44403C] text-white p-6 sm:p-10 shadow-xl overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/20 via-yellow-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Digital Gold Schemes & Accumulation</span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Retailer Gold Schemes
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/80 font-bold leading-relaxed">
              Enroll in custom Gold Accumulation Schemes provided by partner retailers. Lock gold rates, pay monthly installments, accumulate physical 24K gold weight, and redeem at checkout!
            </p>
          </div>

          {/* Wallet Summary Card */}
          <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 space-y-3 shrink-0 text-right min-w-[260px]">
            <div className="flex items-center justify-end gap-1.5 text-amber-200 text-xs font-black uppercase">
              <Wallet className="w-4 h-4 text-amber-400" /> My Digital Gold Wallet
            </div>
            <div>
              <div className="text-3xl font-black text-amber-300">
                {goldBalance.toFixed(4)} <span className="text-sm font-bold text-amber-100">grams</span>
              </div>
              <div className="text-xs font-black text-emerald-400 mt-1">
                ≈ ₹{totalValueINR.toLocaleString("en-IN")} INR
              </div>
            </div>
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold text-amber-100/70">
              <span>Benchmark Rate:</span>
              <span className="font-black text-amber-300">₹{goldPricePerGram.toLocaleString("en-IN")}/g</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[#CDD5DB] pb-3">
        <button
          onClick={() => setActiveTab("browse")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black transition-all ${
            activeTab === "browse"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <Store className="w-4 h-4 text-amber-500" />
          <span>Browse Store Gold Schemes ({availableSchemes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("my-schemes")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black transition-all ${
            activeTab === "my-schemes"
              ? "bg-[#A68868] text-white shadow-md"
              : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>My Enrolled Schemes ({sips.length})</span>
        </button>
      </div>

      {/* TAB 1: BROWSE AVAILABLE RETAILER SCHEMES */}
      {activeTab === "browse" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-black">Available Retailer Gold Schemes</h2>
              <p className="text-xs font-bold text-gray-500">
                Explore Gold Savings Schemes designed and offered directly by verified partner retail stores.
              </p>
            </div>
            <button
              onClick={fetchSipData}
              className="px-4 py-2 rounded-full border border-[#CDD5DB] hover:bg-gray-50 text-xs font-black flex items-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Schemes
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-black text-black">Loading store gold schemes...</p>
            </div>
          ) : availableSchemes.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#CDD5DB] p-12 text-center text-xs font-bold text-gray-500">
              No store gold schemes available at the moment.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableSchemes.map((scheme) => (
                <div
                  key={scheme.id}
                  className="bg-white rounded-3xl border border-[#CDD5DB] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs font-black text-[#A68868] mb-1">
                          <Store className="w-3.5 h-3.5 text-amber-600" />
                          <span>{scheme.retailer_name}</span>
                        </div>
                        <h3 className="text-lg font-black text-black">{scheme.title}</h3>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase shrink-0 border border-amber-300">
                        {scheme.time_period_months} Months
                      </span>
                    </div>

                    <p className="text-xs font-bold text-gray-600 leading-relaxed line-clamp-2">
                      {scheme.description}
                    </p>

                    {/* Highlights Grid */}
                    <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8F6F2] border border-[#CDD5DB]/60 text-xs font-bold">
                      <div>
                        <span className="text-[10px] text-gray-400 font-black uppercase block">Monthly Payment</span>
                        <span className="text-black font-black text-sm">₹{Number(scheme.monthly_amount).toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-black uppercase block">Locked Gold Rate</span>
                        <span className="text-emerald-700 font-black text-sm">₹{Number(scheme.fixed_gold_rate || goldPricePerGram).toLocaleString("en-IN")}/g</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-black uppercase block">Tenure Period</span>
                        <span className="text-black font-black">{scheme.time_period_months} Months</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 font-black uppercase block">Target Weight</span>
                        <span className="text-amber-700 font-black">{Number(scheme.target_gold_grams || 0).toFixed(3)} g</span>
                      </div>
                    </div>

                    {scheme.bonus_description && (
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-[11px] font-bold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>{scheme.bonus_description}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedScheme(scheme)}
                    className="w-full py-3.5 rounded-full bg-[#A68868] hover:bg-[#8e7254] text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Enroll in Scheme</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY ENROLLED SCHEMES */}
      {activeTab === "my-schemes" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-black">My Active Enrolled Schemes</h2>
            <button
              onClick={() => setActiveTab("browse")}
              className="px-4 py-2 rounded-full bg-[#E3C39D]/30 hover:bg-[#E3C39D]/60 text-black text-xs font-black flex items-center gap-2"
            >
              <Plus className="w-4 h-4 text-[#A68868]" /> Browse More Schemes
            </button>
          </div>

          {sips.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#CDD5DB] p-12 text-center space-y-4">
              <Coins className="w-12 h-12 text-gray-300 mx-auto" />
              <h3 className="text-lg font-black text-black">No Active Scheme Enrollments</h3>
              <p className="text-xs font-bold text-gray-500">
                You have not enrolled in any Gold Scheme yet. Browse available retailer store schemes to start accumulating gold!
              </p>
              <button
                onClick={() => setActiveTab("browse")}
                className="px-6 py-3 rounded-full bg-[#A68868] text-white font-black text-xs uppercase tracking-wider inline-flex items-center gap-2"
              >
                Browse Retailer Gold Schemes
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sips.map((sip) => {
                const isPaidThisMonth = Boolean(sip.is_paid_this_month);
                const isProcessing = processingPayId === sip.id;

                return (
                  <div
                    key={sip.id}
                    className="bg-white rounded-3xl border border-[#CDD5DB] p-6 shadow-xs space-y-6 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-black text-[#A68868] mb-1">
                            <Store className="w-3.5 h-3.5 text-amber-600" />
                            <span>{sip.retailer_provider || "Partner Store"}</span>
                          </div>
                          <h3 className="text-lg font-black text-black">
                            {sip.plan_name || `₹${Number(sip.amount).toLocaleString("en-IN")}/month Scheme`}
                          </h3>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                            sip.status === "ACTIVE"
                              ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                              : "bg-amber-100 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {sip.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8F6F2] text-xs font-bold">
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black block">Monthly Payment</span>
                          <span className="text-black font-black text-sm">₹{Number(sip.amount).toLocaleString("en-IN")}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black block">Gold Acquired</span>
                          <span className="text-amber-700 font-black text-sm">{Number(sip.gold_acquired || 0).toFixed(4)} g</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black block">Next Due Date</span>
                          <span className="text-black font-black">{sip.next_payment_date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-400 uppercase font-black block">Frequency</span>
                          <span className="text-blue-800 font-black">{sip.frequency}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-3">
                      {isPaidThisMonth ? (
                        <div className="w-full py-3 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 font-black text-xs uppercase text-center flex items-center justify-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>Paid for this Month</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handlePayInstallment(sip.id)}
                          disabled={isProcessing || sip.status !== "ACTIVE"}
                          className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Processing Payment...</span>
                            </>
                          ) : (
                            <>
                              <Coins className="w-4 h-4" />
                              <span>Pay Monthly Installment (₹{Number(sip.amount).toLocaleString("en-IN")})</span>
                            </>
                          )}
                        </button>
                      )}

                      <div className="flex items-center justify-between text-xs font-bold pt-1">
                        <button
                          onClick={() => handleStatusToggle(sip.id, sip.status)}
                          className="text-gray-600 hover:text-black flex items-center gap-1 font-black"
                        >
                          {sip.status === "ACTIVE" ? <Pause className="w-3.5 h-3.5 text-amber-600" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                          <span>{sip.status === "ACTIVE" ? "Pause Scheme" : "Resume Scheme"}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteSip(sip.id, sip.plan_name)}
                          className="text-rose-600 hover:text-rose-800 flex items-center gap-1 font-black"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ENROLL CONFIRMATION MODAL */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#CDD5DB] shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h3 className="text-lg font-black text-black">Enroll in Gold Scheme</h3>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#CDD5DB] space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-[#A68868] font-black block">
                  {selectedScheme.retailer_name}
                </span>
                <h4 className="text-base font-black text-black">{selectedScheme.title}</h4>
                <p className="text-gray-600 leading-relaxed">{selectedScheme.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Monthly Installment:</span>
                  <span className="font-black text-black">₹{Number(selectedScheme.monthly_amount).toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Tenure (Time Period):</span>
                  <span className="font-black text-black">{selectedScheme.time_period_months} Months</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Locked Gold Rate:</span>
                  <span className="font-black text-emerald-700">₹{Number(selectedScheme.fixed_gold_rate || goldPricePerGram).toLocaleString("en-IN")}/g</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">Target Accumulation:</span>
                  <span className="font-black text-amber-700">{Number(selectedScheme.target_gold_grams || 0).toFixed(3)} g</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t">
              <button
                onClick={() => setSelectedScheme(null)}
                className="px-5 py-2.5 rounded-full border border-gray-300 font-black text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEnrollInScheme(selectedScheme)}
                disabled={submitting}
                className="px-6 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8e7254] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? "Enrolling..." : "Confirm Enrollment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoldSip;
