import React, { useState, useEffect } from "react";
import Navbar from "../../components/manufacturer/Navbar";
import Sidebar from "../../components/manufacturer/Sidebar";
import api from "../../services/api";
import { User, Mail, Phone, ShieldCheck, Save, RefreshCw, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

export default function Profile() {
  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone: "",
    role: "MANUFACTURER",
    profile_image: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
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
          role: data.role || "MANUFACTURER",
          profile_image: data.profile_image || "",
        });
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
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
        profile_image: profile.profile_image,
      });

      if (res.status === 200 || res.data?.success) {
        showToast("success", "Profile updated successfully!");
      } else {
        showToast("error", res.data?.message || "Failed to update profile.");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast("error", err.response?.data?.message || "Failed to save profile changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black">
      <Navbar user={profile} />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-4xl space-y-8">
          
          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-6 right-6 z-50">
              <div
                className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-black ${
                  toast.type === "success"
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-rose-50 text-rose-950 border-rose-300"
                }`}
              >
                {toast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                <span>{toast.message}</span>
              </div>
            </div>
          )}

          {/* Header Banner */}
          <div className="relative rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs overflow-hidden">
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-xs font-black text-black uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#A68868]" />
                  <span>Account Settings</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                  Manufacturer Profile
                </h1>
                <p className="text-xs sm:text-sm text-black/80 font-bold mt-1">
                  Manage your personal account details and business contact information.
                </p>
              </div>

              <button
                onClick={fetchProfile}
                disabled={loading}
                className="px-4 py-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black text-xs font-black flex items-center gap-2 transition-all shadow-xs"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-[#A68868]" : ""}`} />
                <span>Reload</span>
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-[#A68868]" />
                <p className="text-xs font-black text-black">Loading profile details...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Profile Header Card */}
                <div className="flex items-center gap-4 p-4 rounded-3xl bg-[#CDD5DB]/20 border border-[#CDD5DB]">
                  <div className="w-16 h-16 rounded-2xl bg-[#A68868] text-white flex items-center justify-center font-black text-2xl shadow-xs">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : <User className="w-8 h-8 text-white" />}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-black">
                      {profile.full_name || "Manufacturer Account"}
                    </h2>
                    <span className="inline-block mt-1 px-3 py-0.5 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wide border border-[#A68868]/40">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black uppercase tracking-wider">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A68868]" />
                      <input
                        type="text"
                        name="full_name"
                        value={profile.full_name}
                        onChange={handleChange}
                        placeholder="Enter full name"
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] transition-all"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black uppercase tracking-wider">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A68868]" />
                      <input
                        type="text"
                        name="phone"
                        value={profile.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] transition-all"
                      />
                    </div>
                  </div>

                  {/* Email (Read Only) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black uppercase tracking-wider">
                      Email Address (Read-only)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-black/40" />
                      <input
                        type="email"
                        value={profile.email}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-[#CDD5DB]/30 border border-[#CDD5DB] text-black/70 font-bold text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Role (Read Only) */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-black uppercase tracking-wider">
                      Account Role
                    </label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-black/40" />
                      <input
                        type="text"
                        value={profile.role}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 rounded-full bg-[#CDD5DB]/30 border border-[#CDD5DB] text-black/70 font-bold text-xs cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-[#CDD5DB] flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black flex items-center gap-2 shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 text-white" />
                        <span>Save Profile</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
