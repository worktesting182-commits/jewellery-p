import React from "react";
import { Link } from "react-router-dom";
import { PackageOpen } from "lucide-react";

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = "No Items Found",
  description = "There are no records or items matching your current filters.",
  actionText = null,
  actionLink = null,
  onAction = null,
}) {
  return (
    <div className="py-16 px-6 text-center bg-white rounded-3xl border border-[#CDD5DB] space-y-4 shadow-xs max-w-lg mx-auto my-6 animate-fadeIn">
      <div className="w-16 h-16 rounded-full bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868] mx-auto shadow-sm">
        <Icon className="w-8 h-8 text-[#A68868]" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black text-black tracking-tight">{title}</h3>
        <p className="text-xs text-black/70 font-bold leading-relaxed max-w-sm mx-auto">
          {description}
        </p>
      </div>

      {(actionText && (actionLink || onAction)) && (
        <div className="pt-2">
          {actionLink ? (
            <Link
              to={actionLink}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black transition-all shadow-md active:scale-95"
            >
              {actionText}
            </Link>
          ) : (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
