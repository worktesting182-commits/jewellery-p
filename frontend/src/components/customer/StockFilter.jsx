import React from "react";
import { CheckCircle2, PackageCheck } from "lucide-react";

export default function StockFilter({ selectedStock, onSelectStock }) {
  const stockOptions = [
    { label: "All Items", value: "ALL" },
    { label: "In Stock Only", value: "IN_STOCK" },
    { label: "Out of Stock", value: "OUT_OF_STOCK" },
  ];

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
          <PackageCheck className="w-3.5 h-3.5 text-[#A68868]" /> Stock Availability
        </span>
        {selectedStock !== "ALL" && (
          <button
            onClick={() => onSelectStock("ALL")}
            className="text-[11px] text-[#A68868] hover:text-black font-extrabold underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-1.5">
        {stockOptions.map((opt) => {
          const isSelected = selectedStock === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelectStock(opt.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-black text-left transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-[#A68868] text-white border border-[#A68868] shadow-xs"
                  : "bg-white text-black border border-[#CDD5DB] hover:bg-[#E3C39D]/30"
              }`}
            >
              <span>{opt.label}</span>
              {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
