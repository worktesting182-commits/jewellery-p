import React, { useState, useEffect } from "react";
import {
  Coins,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  X,
  Lock,
  Tag,
  Store,
  Info,
} from "lucide-react";
import { retailerAPI } from "../../services/api";

export default function RetailerGoldSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState(null);

  // Form State
  const [form, setForm] = useState({
    title: "",
    description: "",
    fixed_gold_rate: 7245,
    monthly_amount: 5000,
    target_gold_grams: "",
    time_period_months: 11,
    frequency: "MONTHLY",
    bonus_description: "",
    status: "ACTIVE",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSchemes();
  }, []);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const res = await retailerAPI.getGoldSchemes();
      if (res.data?.success) {
        setSchemes(res.data.data || []);
      }
    } catch (err) {
      console.error("Error fetching retailer gold schemes:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setEditingScheme(null);
    setForm({
      title: "",
      description: "",
      fixed_gold_rate: 7245,
      monthly_amount: 5000,
      target_gold_grams: "",
      time_period_months: 11,
      frequency: "MONTHLY",
      bonus_description: "100% 12th Month Installment Bonus by Store",
      status: "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (scheme) => {
    setEditingScheme(scheme);
    setForm({
      title: scheme.title || "",
      description: scheme.description || "",
      fixed_gold_rate: scheme.fixed_gold_rate || 7245,
      monthly_amount: scheme.monthly_amount || 5000,
      target_gold_grams: scheme.target_gold_grams || "",
      time_period_months: scheme.time_period_months || 11,
      frequency: scheme.frequency || "MONTHLY",
      bonus_description: scheme.bonus_description || "",
      status: scheme.status || "ACTIVE",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.monthly_amount) {
      showToast("Please enter scheme title and monthly amount", "error");
      return;
    }

    try {
      setSubmitting(true);
      if (editingScheme) {
        await retailerAPI.updateGoldScheme(editingScheme.id, form);
        showToast(`Scheme "${form.title}" updated successfully!`);
      } else {
        await retailerAPI.createGoldScheme(form);
        showToast(`New Gold Scheme "${form.title}" published!`);
      }
      setIsModalOpen(false);
      fetchSchemes();
    } catch (err) {
      console.error("Error saving scheme:", err);
      showToast(err.response?.data?.message || "Failed to save scheme", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (schemeId, schemeTitle) => {
    if (!window.confirm(`Are you sure you want to remove Gold Scheme "${schemeTitle}"?`)) return;

    try {
      await retailerAPI.deleteGoldScheme(schemeId);
      showToast(`Scheme "${schemeTitle}" deleted.`);
      fetchSchemes();
    } catch (err) {
      console.error("Error deleting scheme:", err);
      showToast(err.response?.data?.message || "Failed to delete scheme", "error");
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

      {/* Header Banner */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#44403C] text-white p-6 sm:p-8 shadow-xl overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[11px] font-black uppercase tracking-wider">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Store Gold Schemes & Customer Plans</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Retailer Gold Scheme Management
            </h1>
            <p className="text-xs text-amber-100/80 font-bold leading-relaxed">
              Create and manage customer gold accumulation schemes. Fix the locked gold rate, monthly installment amount, target gold weight, tenure (time period), and special store maturity bonuses.
            </p>
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Gold Scheme</span>
          </button>
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading store gold schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-3xl border border-[#CDD5DB] p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto text-amber-600">
            <Coins className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-black">No Gold Schemes Created Yet</h3>
          <p className="text-xs font-bold text-gray-500 max-w-md mx-auto">
            Design your store's custom Gold Schemes! Fix the locked gold rate, monthly amount, and time period to offer customers an attractive gold saving plan.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8e7254] text-white font-black text-xs uppercase tracking-wider inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Create First Gold Scheme
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white rounded-3xl border border-[#CDD5DB] p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase border border-amber-300">
                      {scheme.time_period_months} Month Scheme
                    </span>
                    <h3 className="text-lg font-black text-black mt-2">{scheme.title}</h3>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      scheme.status === "ACTIVE"
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-gray-100 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {scheme.status}
                  </span>
                </div>

                <p className="text-xs font-bold text-gray-600 leading-relaxed line-clamp-2">
                  {scheme.description}
                </p>

                {/* Scheme Highlights */}
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#F8F6F2] border border-[#CDD5DB]/60 text-xs font-bold">
                  <div>
                    <span className="text-[10px] text-gray-400 font-black uppercase block">Monthly Installment</span>
                    <span className="text-black font-black text-sm">₹{Number(scheme.monthly_amount).toLocaleString("en-IN")}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-black uppercase block">Locked Rate</span>
                    <span className="text-emerald-700 font-black text-sm">₹{Number(scheme.fixed_gold_rate).toLocaleString("en-IN")}/g</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 font-black uppercase block">Time Period</span>
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

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
                <span className="text-[10px] text-gray-500 font-black uppercase">
                  {scheme.enrolled_customers || 0} Customers Enrolled
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(scheme)}
                    className="p-2 rounded-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 transition-colors"
                    title="Edit Gold Scheme"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(scheme.id, scheme.title)}
                    className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors"
                    title="Delete Scheme"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-[#CDD5DB] shadow-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 animate-fadeIn my-8">
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-black text-black">
                  {editingScheme ? "Edit Store Gold Scheme" : "Create New Store Gold Scheme"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 text-xs font-bold text-black">
              <div>
                <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                  Scheme Title / Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Swarna Sanchaya 11-Month Gold Scheme"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                    Monthly Installment (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    step="100"
                    min="500"
                    placeholder="e.g. 5000"
                    value={form.monthly_amount}
                    onChange={(e) => setForm({ ...form, monthly_amount: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                    Time Period / Tenure (Months) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="60"
                    placeholder="e.g. 11"
                    value={form.time_period_months}
                    onChange={(e) => setForm({ ...form, time_period_months: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                    Fixed Locked Rate (₹ per gram)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7245.00"
                    value={form.fixed_gold_rate}
                    onChange={(e) => setForm({ ...form, fixed_gold_rate: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                    Target Gold Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Auto-calculated if empty"
                    value={form.target_gold_grams}
                    onChange={(e) => setForm({ ...form, target_gold_grams: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                  Maturity Bonus / Offer Terms
                </label>
                <input
                  type="text"
                  placeholder="e.g. 100% 12th month installment paid by store"
                  value={form.bonus_description}
                  onChange={(e) => setForm({ ...form, bonus_description: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-gray-700 font-black mb-1">
                  Scheme Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed description of scheme rules and benefits..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-[#CDD5DB] focus:outline-none focus:ring-2 focus:ring-[#A68868] text-xs font-bold bg-gray-50"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-black uppercase text-gray-700">Scheme Status:</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="p-2 rounded-xl border border-[#CDD5DB] font-black text-xs"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 rounded-full border border-gray-300 font-black text-xs text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8e7254] text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? "Saving..." : editingScheme ? "Update Scheme" : "Publish Scheme"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
