import React from "react";

export default function FormActions({
  onCancel,
  submitting = false,
  submitText = "Create Product",
  cancelText = "Cancel",
}) {
  return (
    <div className="flex items-center justify-end gap-3 pt-6 border-t border-[#CDD5DB] w-full mt-6">
      <button
        type="button"
        onClick={onCancel}
        disabled={submitting}
        className="px-6 py-2.5 rounded-full border border-[#CDD5DB] bg-white hover:bg-[#E3C39D]/30 text-black text-xs font-black transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
      >
        {cancelText}
      </button>

      <button
        type="submit"
        disabled={submitting}
        className="px-6 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs transition-all focus:outline-none shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
      >
        {submitting && (
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        <span>{submitting ? "Saving Product..." : submitText}</span>
      </button>
    </div>
  );
}
