import React from "react";

export default function StatCard({ title, value, subtext, icon: Icon }) {
  return (
    <div
      className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-3 hover:border-[#A68868] hover:scale-[1.01] transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-black/70 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div>
        <span className="text-3xl font-black text-black tracking-tight block">
          {value}
        </span>
        {subtext && (
          <span className="text-[11px] text-black/70 font-bold block mt-1">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
}
