import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  User,
  Mail,
  Phone,
  Calendar,
  Lock,
  Edit2,
  CheckCircle2,
  Key,
  Shield,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

const AdminProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchAdminProfile();
  }, []);

  const fetchAdminProfile = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;

      if (currentUser) {
        // Fetch from `users` table
        const { data } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .single();

        const profileData = data || {
          id: currentUser.id,
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || "Platform Administrator",
          role: "ADMIN",
          phone: "+91 98765 43210",
          created_at: currentUser.created_at,
        };

        setUser(profileData);
        setForm({
          full_name: profileData.full_name || profileData.name || "Platform Administrator",
          phone: profileData.phone || "",
        });
      }
    } catch (err) {
      console.error("Error fetching admin profile:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setUpdating(true);
      const { error } = await supabase
        .from("users")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        throw error;
      }

      showToast("Admin profile updated successfully!");
      fetchAdminProfile();
    } catch (err) {
      console.error("Error updating profile:", err);
      showToast(err.message || "Failed to update profile", "error");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
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
          <ShieldCheck className="w-3.5 h-3.5 text-[#A68868]" /> Administrator Credentials & Security
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
          Admin Profile & Account Settings
        </h1>
        <p className="text-xs text-black/70 font-bold max-w-xl">
          Manage system administrator identity, contact details, security credentials, and access permissions.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading administrator profile details...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Admin Identity Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full bg-[#E3C39D]/40 border-2 border-[#A68868]/40 flex items-center justify-center text-[#A68868] font-black text-2xl shadow-sm">
              {(user?.full_name || user?.email || "A")[0].toUpperCase()}
            </div>

            <div className="space-y-1 font-bold">
              <h3 className="text-lg font-black text-black">{user?.full_name || "Platform Administrator"}</h3>
              <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300 text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-700" /> SUPER ADMIN
              </span>
            </div>

            <div className="w-full pt-3 border-t border-[#CDD5DB] space-y-2 text-left text-xs font-bold text-black/80">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-black/70">Role</span>
                <span className="font-black text-black">ADMINISTRATOR</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black text-black/70">Status</span>
                <span className="font-black text-emerald-700">ACTIVE</span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#A68868]" /> Edit Administrator Details
              </span>
              <span className="text-[10px] text-black/70 font-bold">Account Identity</span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-5 text-xs font-black">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#A68868]" /> Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              {/* Email (Read-Only) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#A68868]" /> Email Address (Primary Auth)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ""}
                  className="w-full px-4 py-3 rounded-full bg-[#CDD5DB]/20 border border-[#CDD5DB] text-black/60 cursor-not-allowed font-mono font-bold"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#A68868]" /> Phone Number
                </label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              {/* Password Notice */}
              <div className="p-3.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[11px] text-black font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#A68868] shrink-0" />
                <span>Password updates are managed securely through Supabase Auth authentication protocols.</span>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {updating ? "Saving Changes..." : "Save Profile Details"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
