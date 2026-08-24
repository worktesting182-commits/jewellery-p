import React from "react";
import { AlertTriangle, X, Loader2 } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Destructive Action",
  message = "Are you sure you want to perform this action? This step cannot be undone.",
  confirmText = "Delete Item",
  cancelText = "Cancel",
  isDanger = true,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-fadeIn">
      <div className="w-full max-w-md rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl border flex items-center justify-center font-black ${
                isDanger
                  ? "bg-rose-100 border-rose-300 text-rose-700"
                  : "bg-amber-100 border-amber-300 text-amber-800"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-black">{title}</h3>
              <span className="text-[10px] text-black/70 font-bold uppercase tracking-wider block">
                Confirmation Required
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>

        {/* Message */}
        <p className="text-xs text-black/80 font-bold leading-relaxed">
          {message}
        </p>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 rounded-full border border-[#CDD5DB] bg-white hover:bg-[#E3C39D]/30 text-black text-xs font-black transition-all focus:outline-none disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-6 py-2.5 rounded-full text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-60 ${
              isDanger
                ? "bg-rose-600 hover:bg-rose-700 text-white"
                : "bg-[#A68868] hover:bg-[#8A6D4F] text-white"
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
            <span>{loading ? "Processing..." : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmDialog as ConfirmModal };
