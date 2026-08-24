import React from "react";
import { Gem } from "lucide-react";

export default function MaterialFilter({ selectedMaterial, onSelectMaterial }) {
  const materials = ["ALL", "Gold", "Silver", "Platinum", "Diamond", "Gemstone"];

  return (
    <div className="p-4 rounded-2xl bg-white border border-[#CDD5DB] space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-1.5">
          <Gem className="w-3.5 h-3.5 text-[#A68868]" /> Material & Metal
        </span>
        {selectedMaterial !== "ALL" && (
          <button
            onClick={() => onSelectMaterial("ALL")}
            className="text-[11px] text-[#A68868] hover:text-black font-extrabold underline"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {materials.map((mat) => {
          const isSelected = selectedMaterial === mat;
          return (
            <button
              key={mat}
              onClick={() => onSelectMaterial(mat)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all ${
                isSelected
                  ? "bg-[#A68868] text-white border border-[#A68868] shadow-xs"
                  : "bg-white text-black border border-[#CDD5DB] hover:bg-[#E3C39D]/30"
              }`}
            >
              {mat === "ALL" ? "All Materials" : mat}
            </button>
          );
        })}
      </div>
    </div>
  );
}
