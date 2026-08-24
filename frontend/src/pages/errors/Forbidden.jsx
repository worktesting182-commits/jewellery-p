import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, KeyRound } from "lucide-react";

export default function Forbidden() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black font-sans flex items-center justify-center p-4 sm:p-6 lg:p-8 selection:bg-[#E3C39D] selection:text-black">
      <div className="max-w-md w-full text-center space-y-6 animate-fadeIn">
        {/* Badge / Illustration */}
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-rose-100 border-2 border-rose-300 flex items-center justify-center mx-auto shadow-xl">
            <ShieldAlert className="w-12 h-12 text-rose-700" />
          </div>
          <span className="absolute -bottom-2 right-0 px-3 py-1 rounded-full bg-rose-700 text-white font-black text-xs shadow-md uppercase tracking-wider">
            HTTP 403
          </span>
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-black tracking-tight">
            403 – Access Forbidden
          </h1>
          <p className="text-xs text-black/70 font-bold leading-relaxed max-w-sm mx-auto">
            You do not have permission or role clearance to access this portal or resource. Please check your credentials or contact an administrator.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black font-black text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#A68868]" />
            <span>Go Back</span>
          </button>

          <Link
            to="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <KeyRound className="w-4 h-4" />
            <span>Sign In / Switch Account</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
