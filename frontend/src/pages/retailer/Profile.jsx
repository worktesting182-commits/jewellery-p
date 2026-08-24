import React, { useState, useEffect } from "react";
import {
  Store,
  Building,
  FileText,
  MapPin,
  Globe,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { retailerAPI } from "../../services/api";

const RetailerProfile = () => {
  const [profile, setProfile] = useState({
    shop_name: "",
    gst_number: "",
    address: "",
    postal_code: "",
    website: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await retailerAPI.getProfile();
      const data = res.data?.data || res.data?.retailer;
      if (data) {
        setProfile({
          shop_name: data.shop_name || "",
          gst_number: data.gst_number || "",
          address: data.address || "",
          postal_code: data.postal_code || "",
          website: data.website || "",
          description: data.description || "",
        });
      }
    } catch (err) {
      console.error("Error fetching retailer profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await retailerAPI.updateProfile(profile);
      showToast("Retailer business profile updated successfully!");
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast(err.response?.data?.message || "Failed to update profile", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all font-black text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
          <Store className="w-3.5 h-3.5 text-[#A68868]" /> Business Profile
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          Retailer Store Settings
        </h1>
        <p className="text-xs text-black/70 font-bold max-w-xl">
          Manage your official store business profile, GST tax details, and store contact info.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading business profile...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Shop Name */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black flex items-center gap-1.5">
                <Store className="w-4 h-4 text-[#A68868]" /> Retail Shop Name
              </label>
              <input
                type="text"
                required
                value={profile.shop_name}
                onChange={(e) => setProfile({ ...profile, shop_name: e.target.value })}
                placeholder="e.g. ABC Fine Jewellery Shop"
                className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
              />
            </div>

            {/* GST Number */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#A68868]" /> GST / Business Identification Number
              </label>
              <input
                type="text"
                value={profile.gst_number}
                onChange={(e) => setProfile({ ...profile, gst_number: e.target.value })}
                placeholder="e.g. 32AAAAA0000A1Z5"
                className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black flex items-center gap-1.5">
                <Building className="w-4 h-4 text-[#A68868]" /> Postal / Pincode
              </label>
              <input
                type="text"
                value={profile.postal_code}
                onChange={(e) => setProfile({ ...profile, postal_code: e.target.value })}
                placeholder="e.g. 673001"
                className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
              />
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-xs font-black text-black flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-[#A68868]" /> Store Website (Optional)
              </label>
              <input
                type="url"
                value={profile.website}
                onChange={(e) => setProfile({ ...profile, website: e.target.value })}
                placeholder="https://yourstore.com"
                className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
              />
            </div>
          </div>

          {/* Full Address */}
          <div className="space-y-2">
            <label className="text-xs font-black text-black flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#A68868]" /> Store Address
            </label>
            <textarea
              rows={3}
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Enter full physical store address..."
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-black text-black flex items-center gap-1.5">
              Store Bio / Description
            </label>
            <textarea
              rows={3}
              value={profile.description}
              onChange={(e) => setProfile({ ...profile, description: e.target.value })}
              placeholder="Short description of your retail business..."
              className="w-full px-4 py-3 rounded-2xl bg-white border border-[#CDD5DB] text-xs font-black text-black focus:outline-none focus:border-[#A68868]"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-[#CDD5DB] flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-xs font-black text-white flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-white" />
              {saving ? "Saving Changes..." : "Save Store Profile"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default RetailerProfile;
