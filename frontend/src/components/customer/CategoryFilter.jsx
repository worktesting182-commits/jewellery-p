import React from "react";
import { Sparkles } from "lucide-react";

function isCategoryMatch(sel, target) {
  if (!sel || !target) return false;
  const s = sel.trim().toLowerCase();
  const t = target.trim().toLowerCase();
  if (s === t) return true;

  const sStem = s.replace(/s$/, "");
  const tStem = t.replace(/s$/, "");
  if (sStem === tStem) return true;

  const sWords = sStem.split(/[\s&,/]+/).filter((w) => w.length > 2);
  const tWords = tStem.split(/[\s&,/]+/).filter((w) => w.length > 2);

  return sWords.some((w) => tWords.includes(w)) || tWords.some((w) => sWords.includes(w));
}

export default function CategoryFilter({ categories = [], selectedCategory = "ALL", onSelectCategory }) {
  const isAllSelected = !selectedCategory || selectedCategory === "ALL" || selectedCategory === "All Categories";

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <button
        onClick={() => onSelectCategory("ALL")}
        className={`px-4.5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
          isAllSelected
            ? "bg-[#A68868] text-white border border-[#A68868]"
            : "bg-white text-black border border-[#CDD5DB] hover:bg-[#E3C39D]/30"
        }`}
      >
        <Sparkles className="w-3.5 h-3.5" /> All Categories
      </button>

      {categories.map((cat) => {
        const catName = typeof cat === "string" ? cat : cat.name;
        const isSelected = !isAllSelected && isCategoryMatch(selectedCategory, catName);

        return (
          <button
            key={catName}
            onClick={() => onSelectCategory(catName)}
            className={`px-4.5 py-2.5 rounded-full text-xs font-black whitespace-nowrap transition-all shadow-xs cursor-pointer ${
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
