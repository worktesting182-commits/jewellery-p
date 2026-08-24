import React from "react";
import { Sparkles } from "lucide-react";

export default function CategoryFilter({ categories = [], selectedCategory = "ALL", onSelectCategory }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory("ALL")}
        className={`px-4.5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs ${
          selectedCategory === "ALL"
            ? "bg-[#A68868] text-white border border-[#A68868]"
            : "bg-white text-black border border-[#CDD5DB] hover:bg-[#E3C39D]/30"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" /> All Categories
      </button>

      {categories.map((cat) => {
        const catName = typeof cat === "string" ? cat : cat.name;
        const isSelected = selectedCategory === catName;
        return (
          <button
            key={catName}
            onClick={() => onSelectCategory(catName)}
            className={`px-4.5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all shadow-xs ${
              isSelected
                ? "bg-[#A68868] text-white border border-[#A68868]"
                : "bg-white text-black border border-[#CDD5DB] hover:bg-[#E3C39D]/30"
            }`}
          >
            {catName}
          </button>
        );
      })}
    </div>
  );
}
