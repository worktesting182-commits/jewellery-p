import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Gem,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Sign in with Supabase Auth
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const authUser = data.user;
      if (!authUser) {
        throw new Error("Authentication failed. User not found.");
      }

      if (data.session?.access_token) {
        localStorage.setItem("token", data.session.access_token);
      }

      // 2. Fetch user profile from public.users
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("auth_user_id", authUser.id)
        .single();

      if (userError || !userData) {
        throw new Error("User profile not found. Please contact support.");
      }

      // 3. Redirect user based on role
      switch (userData.role) {
        case "ADMIN":
          navigate("/admin/dashboard");
          break;
        case "CUSTOMER":
          navigate("/customer/home");
          break;
        case "MANUFACTURER":
          navigate("/manufacturer/dashboard");
          break;
        case "RETAILER":
          navigate("/retailer/dashboard");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      console.error("Login Error:", err);
      setErrorMsg(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans selection:bg-[#E3C39D] selection:text-black relative overflow-hidden">
      
      {/* Background Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 -mt-20 -ml-20 w-96 h-96 bg-[#E3C39D]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 -mb-20 -mr-20 w-96 h-96 bg-[#CDD5DB]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Login Box */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        
        {/* Top Logo & Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#A68868] border border-white/40 shadow-md mb-4">
            <Gem className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Welcome Back
          </h1>
          <p className="text-xs text-black/70 mt-1 font-bold">
            Sign in to AuraCraft Jewellery Portal
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-sm space-y-6">
          
          {/* Error Alert Banner */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900 font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* Email Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black">
                Email Address
              </label>
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 absolute left-3.5 text-[#A68868] pointer-events-none" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-4 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-black">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 absolute left-3.5 text-[#A68868] pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-11 pl-10 pr-10 rounded-full bg-white border border-[#CDD5DB] text-black font-extrabold placeholder-black/40 text-xs focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-[#A68868] hover:text-black transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-2 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black uppercase tracking-wider border border-[#A68868] shadow-md active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>

          {/* Security Badge */}
          <div className="pt-4 border-t border-[#CDD5DB] flex items-center justify-center gap-2 text-[11px] font-black text-black/70">
            <ShieldCheck className="w-4 h-4 text-[#A68868]" />
            <span>Encrypted & Secured with Supabase Role Auth</span>
          </div>
        </div>

        {/* Bottom Link to Signup */}
        <div className="text-center mt-6">
          <p className="text-xs text-black/80 font-bold">
            Don&apos;t have an account yet?{" "}
            <Link
              to="/signup"
              className="font-black text-black hover:text-[#A68868] underline underline-offset-4 transition-colors"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}