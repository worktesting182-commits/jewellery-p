import React, { useState } from "react";
import { useRetailer } from "../../context/RetailerContext";
import { useNavigate } from "react-router-dom";
import { Lock, CheckCircle2, AlertCircle, ArrowRight, X } from "lucide-react";
import { retailerAccessAPI } from "../../services/api";

export default function RetailerCodeModal() {
  const { showCodeModal, closeCodeModal, validateAndJoinStore, savePendingRetailerCode } = useRetailer();
  const navigate = useNavigate();
  
  const [code, setCode] = useState("");
  const [step, setStep] = useState(1); // 1: Input Code, 2: Preview Validation
  const [validatedRetailer, setValidatedRetailer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!showCodeModal) return null;

  /**
   * Step 12.1 & 12.2: Validate code with backend (returns limited preview info)
   */
  const handleValidateCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter a valid retailer access code.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const res = await retailerAccessAPI.validateCode(code.trim());
      const resPayload = res.data?.data || res.data;
      const retailerObj = res.data?.retailer || resPayload?.retailer;

      if ((res.data?.success || resPayload?.valid) && retailerObj) {
        setValidatedRetailer(retailerObj);
        setStep(2); // Move to limited preview validation step
      } else {
        setError("Invalid retailer code. Please check the code provided by your jeweller.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Invalid retailer access code. Please check the code provided by your jeweller.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Confirm & Join Storefront (Step 12.3: Unauthenticated vs Authenticated handling)
   */
  const handleConfirmJoin = async () => {
    const isAuthenticated = Boolean(localStorage.getItem("token"));

    // If unauthenticated: Save pending retailer code to sessionStorage and redirect to login
    if (!isAuthenticated) {
      savePendingRetailerCode(code.trim());
      handleClose();
      navigate("/login", {
        state: { message: `Code ${code.trim().toUpperCase()} saved! Log in or register to join ${validatedRetailer?.shop_name || "store"}.` }
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      const res = await validateAndJoinStore(code.trim());
      if (res.success) {
        handleClose();
      } else {
        setError(res.message || "Failed to join store.");
      }
    } catch (err) {
      setError(err.message || "Failed to join store.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCode("");
    setStep(1);
    setValidatedRetailer(null);
    setError("");
    closeCodeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#F8F6F2] rounded-3xl max-w-md w-full border border-[#CDD5DB] shadow-2xl p-6 sm:p-8 relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-black hover:bg-[#CDD5DB]/50 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#A68868] text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-black tracking-tight">
            Access Jeweller Storefront
          </h2>
          <p className="text-xs text-black font-extrabold">
            Enter your jeweller's access code to unlock their store.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Code Input Screen (Strictly no store discovery lists) */}
        {step === 1 && (
          <form onSubmit={handleValidateCode} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-black">
                Enter Retailer Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="e.g. CJP-ABC123"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-white border border-[#CDD5DB] text-center text-base font-mono font-bold tracking-widest text-black placeholder-[#A68868]/50 focus:outline-none focus:ring-2 focus:ring-[#A68868]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black tracking-wide shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                "Validating Code..."
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: Limited Retailer Validation Info (Shows ONLY verified store name) */}
        {step === 2 && validatedRetailer && (
          <div className="space-y-6 text-center animate-in zoom-in-95 duration-150">
            <div className="p-5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-[#A68868] mx-auto" />
              <div className="text-xs uppercase tracking-widest font-extrabold text-black">
                Storefront Found
              </div>
              <div className="text-lg font-black text-black">
                {validatedRetailer.shop_name || validatedRetailer.business_name}
              </div>
              <div className="text-xs font-mono text-black font-bold">
                Code: {validatedRetailer.retailer_code}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-full border border-[#CDD5DB] text-black text-xs font-black hover:bg-[#CDD5DB]/30 transition-all"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmJoin}
                disabled={loading}
                className="flex-1 py-3 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black tracking-wide shadow-md transition-all disabled:opacity-50"
              >
                {loading
                  ? "Processing..."
                  : localStorage.getItem("token")
                  ? "Open Store"
                  : "Login to Join Store"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
