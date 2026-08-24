import React from "react";
import { DollarSign, SlidersHorizontal } from "lucide-react";

export default function PriceFilter({ minPrice, maxPrice, onMinPriceChange, onMaxPriceChange, onReset }) {
  return (
    <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#A68868]" /> Price Range (₹)
        </span>
        {(minPrice || maxPrice) && (
          <button
            onClick={onReset}
            className="text-[11px] text-[#A68868] hover:text-black font-extrabold underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] font-black text-black/70 mb-1">Min Price</label>
          <input
            type="number"
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="Min ₹"
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDD5DB] text-black font-extrabold text-xs focus:outline-none focus:border-[#A68868]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-black/70 mb-1">Max Price</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="Max ₹"
            className="w-full px-3 py-2 rounded-xl bg-white border border-[#CDD5DB] text-black font-extrabold text-xs focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>
    </div>
  );
}
