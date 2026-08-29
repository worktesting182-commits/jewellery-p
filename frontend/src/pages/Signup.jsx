import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { authAPI } from "../services/api";
import {
  Gem,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShoppingBag,
  Factory,
  Store,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const ROLES = [
  {
    id: "CUSTOMER",
    title: "Customer",
    description: "Browse jewellery, place orders & recycle old ornaments",
    icon: ShoppingBag,
  },
  {
    id: "MANUFACTURER",
    title: "Manufacturer",
    description: "Publish artisan collections, manage stock & eco scores",
    icon: Factory,
  },
  {
    id: "RETAILER",
    title: "Retailer",
    description: "Manage retail inventory, purchase stock & customer orders",
    icon: Store,
  },
];

export default function Signup() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!role) {
      setErrorMsg("Please select an account role.");
      setLoading(false);
      return;
    }

    try {
      // 1. Primary path: Call Backend Signup API (uses Supabase Service Role to safely bypass RLS)
      try {
        const response = await authAPI.signup({
          full_name: fullName.trim(),
          email: email.trim(),
          password: password,
          role: role,
          shop_name: role === "RETAILER" ? (shopName.trim() || `${fullName.trim()}'s Shop`) : undefined,
          company_name: role === "MANUFACTURER" ? (companyName.trim() || `${fullName.trim()}'s Enterprise`) : undefined,
        });

        if (response.data && response.data.success) {
          setSuccessMsg("Account created successfully! Redirecting to login...");
          setTimeout(() => {
            navigate("/login");
          }, 1500);
          return;
        }
      } catch (apiErr) {
        console.warn("Backend API signup unavailable or failed, attempting direct Supabase signup:", apiErr?.response?.data?.message || apiErr.message);
        if (apiErr?.response?.data?.message) {
          throw new Error(apiErr.response.data.message);
        }
      }

      // 2. Fallback path: Direct Supabase Client Signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      const authUser = data.user;
      if (!authUser) {
        throw new Error("Signup failed. Unable to create authentication credentials.");
      }

      // Check if Supabase returned existing user without creating a new identity
      if (authUser.identities && authUser.identities.length === 0) {
        throw new Error("An account with this email address already exists. Please log in.");
      }

      // Insert into users table
      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert({
          auth_user_id: authUser.id,
          full_name: fullName.trim(),
          email: email.trim(),
          role: role,
        })
        .select()
        .single();

      if (userError) throw userError;

      const userId = newUser.id;

      // Insert into corresponding role-specific table
      if (role === "CUSTOMER") {
        const { error: err } = await supabase.from("customers").insert({ user_id: userId });
        if (err) throw err;
      } else if (role === "MANUFACTURER") {
        const { error: err } = await supabase.from("manufacturers").insert({
          user_id: userId,
          company_name: companyName.trim() || `${fullName.trim()}'s Enterprise`,
        });
        if (err) throw err;
      } else if (role === "RETAILER") {
        const { error: err } = await supabase.from("retailers").insert({
          user_id: userId,
          shop_name: shopName.trim() || `${fullName.trim()}'s Shop`,
        });
        if (err) throw err;
      }

      setSuccessMsg("Account created successfully! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      console.error("Signup Error:", err);
      let friendlyMessage = err.message || "Failed to create account. Please try again.";
      if (
        friendlyMessage.includes("users_auth_user_id_fkey") ||
        friendlyMessage.includes("already registered") ||
        friendlyMessage.includes("already exists") ||
        friendlyMessage.includes("unique constraint") ||
        friendlyMessage.includes("User already registered")
      ) {
        friendlyMessage = "An account with this email address already exists. Please log in.";
      } else if (friendlyMessage.toLowerCase().includes("rate limit")) {
        friendlyMessage = "Email signup rate limit exceeded by Supabase security. Please try logging in or wait a few minutes.";
      }
      setErrorMsg(friendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#E3C39D] selection:text-black relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-1/4 right-1/4 -mt-20 -mr-20 w-96 h-96 bg-[#E3C39D]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 -mb-20 -ml-20 w-96 h-96 bg-[#CDD5DB]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl">
        
        {/* Header */}
        <div className="text-center mb-8 space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#A68868] border border-white/40 shadow-md mb-2">
            <Gem className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-black tracking-tight">
              Create an Account
            </h1>
            <p className="text-xs text-black/70 mt-1 font-bold">
              Join AuraCraft — The Sustainable Jewellery Ecosystem
            </p>
          </div>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs space-y-6">
          
          {/* Success Banner */}
          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex items-center gap-3 text-xs text-emerald-950 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900 font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-5">
            
            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Select Account Role
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const isSelected = role === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? "bg-[#E3C39D]/30 border-[#A68868] shadow-xs text-black ring-1 ring-[#A68868]"
                          : "bg-white border-[#CDD5DB] text-black/70 hover:border-[#A68868]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Icon className={`w-5 h-5 ${isSelected ? "text-[#A68868]" : "text-black/60"}`} />
                        {isSelected && <Sparkles className="w-3.5 h-3.5 text-[#A68868]" />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-black">{r.title}</p>
                        <p className="text-[10px] text-black/70 font-bold mt-0.5 leading-tight">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68868]" />
                <input
                  type="text"
                  placeholder="e.g. Eleanor Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                />
              </div>
            </div>

            {/* Retailer Shop Name */}
            {role === "RETAILER" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  Shop Name <span className="text-black/50 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68868]" />
                  <input
                    type="text"
                    placeholder="e.g. Vance Fine Jewellers"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Manufacturer Company Name */}
            {role === "MANUFACTURER" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-black">
                  Company / Studio Name <span className="text-black/50 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Factory className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68868]" />
                  <input
                    type="text"
                    placeholder="e.g. Vance Artisan Studio"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68868]" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-wider text-black">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A68868]" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-10 py-3 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A68868] hover:text-black transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black uppercase tracking-wider border border-[#A68868] shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom Link to Login */}
        <div className="text-center mt-6">
          <p className="text-xs text-black/80 font-bold">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-black text-black hover:text-[#A68868] underline underline-offset-4 transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}