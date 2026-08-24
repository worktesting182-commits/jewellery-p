import React, { useState, useEffect } from "react";
import api from "../../services/api";
import ImageUploader from "../../components/manufacturer/ImageUploader";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  RefreshCw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function CustomerProfile() {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    profile_image: "",
    role: "CUSTOMER",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/profile");
      const data = res.data?.data || res.data;
      if (data) {
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          profile_image: data.profile_image || "",
          role: data.role || "CUSTOMER",
        });
      }
    } catch (err) {
      console.error("Failed to load customer profile:", err);
      showToast("error", "Failed to load profile details.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put("/users/profile", {
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
        profile_image: profile.profile_image,
      });

      if (res.status === 200 || res.data?.success) {
        showToast("success", "Customer profile updated successfully!");
      } else {
        showToast("error", res.data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error saving customer profile:", err);
      showToast("error", err.response?.data?.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50">
          <div
            className={`px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center gap-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-[#8EB69B]/20 text-[#8EB69B] border-[#8EB69B]/40"
                : "bg-red-500/20 text-red-300 border-red-500/40"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 text-[#8EB69B]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="relative rounded-3xl bg-[#CDD5DB]/30 border border-[#CDD5DB] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-black text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-[#A68868]" />
              <span>Customer Portal Account</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-black">My Profile</h1>
            <p className="text-xs sm:text-sm font-bold text-black/80 mt-1">Manage your account details and delivery address.</p>
          </div>

          <button
            onClick={fetchProfile}
            disabled={loading}
            className="px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black text-xs font-black flex items-center gap-2 transition-all shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#A68868]" : "text-[#A68868]"}`} /> Reload
          </button>
        </div>
      </div>

      {/* Profile Form Card */}
      <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-[#A68868]" />
            <span className="text-xs font-black text-black">Loading customer profile...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Header Avatar Card */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-[#CDD5DB]/30 border border-[#CDD5DB]">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-[#A68868] border-2 border-white overflow-hidden flex items-center justify-center text-white font-black text-2xl shadow-md">
                  {profile.profile_image ? (
                    <img src={profile.profile_image} alt={profile.full_name} className="w-full h-full object-cover" />
                  ) : profile.full_name ? (
                    profile.full_name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              <div className="text-center sm:text-left space-y-1">
                <h2 className="text-xl font-black text-black">{profile.full_name || "Valued Customer"}</h2>
                <p className="text-xs font-bold text-black/70">{profile.email}</p>
                <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#E3C39D]/50 text-black text-[10px] font-black uppercase tracking-wider border border-[#A68868]/40">
                  {profile.role}
                </span>
              </div>
            </div>

            {/* Profile Image URL Input / Upload */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#A68868]" /> Profile Image URL
              </label>
              <input
                type="url"
                name="profile_image"
                value={profile.profile_image}
                onChange={handleChange}
                placeholder="https://example.com/avatar.jpg"
                className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs sm:text-sm focus:outline-none focus:border-[#A68868]"
              />
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Full Name */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black uppercase tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A68868]" />
                  <input
                    type="text"
                    name="full_name"
                    value={profile.full_name}
                    onChange={handleChange}
                    placeholder="Enter full name"
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold text-sm focus:outline-none focus:border-[#A68868]"
                    required
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black uppercase tracking-wider">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A68868]" />
                  <input
                    type="text"
                    name="phone"
                    value={profile.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold text-sm focus:outline-none focus:border-[#A68868]"
                  />
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-2 md:col-span-2">
                <label className="block text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#A68868]" /> Shipping / Delivery Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  value={profile.address}
                  onChange={handleChange}
                  placeholder="Enter house no., street, city, state, and pincode..."
                  className="w-full p-3.5 rounded-2xl bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-sm focus:outline-none focus:border-[#A68868]"
                />
              </div>

              {/* Email Address (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black uppercase tracking-wider">Email Address (Read-only)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-black/50" />
                  <input
                    type="email"
                    value={profile.email}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-[#CDD5DB]/30 border border-[#CDD5DB] text-black font-extrabold text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Account Role (Read-only) */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-black uppercase tracking-wider">Account Role</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-black/50" />
                  <input
                    type="text"
                    value={profile.role}
                    readOnly
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-[#CDD5DB]/30 border border-[#CDD5DB] text-black font-extrabold text-sm cursor-not-allowed"
                  />
                </div>
              </div>

            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-[#CDD5DB] flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-7 py-3.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 text-white" />
                    <span>Update Profile</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

    </div>
  );
}
