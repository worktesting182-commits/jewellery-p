import React from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search by name, category, or material (e.g. Gold, Diamond)...",
}) {
  return (
    <div className="relative w-full">
      <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#A68868] pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-11 pr-10 py-3 rounded-full bg-white border border-[#CDD5DB] text-black placeholder-black/50 text-xs sm:text-sm font-extrabold focus:outline-none focus:border-[#A68868] focus:ring-1 focus:ring-[#A68868] shadow-xs transition-all"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3.5 top-3.5 p-0.5 rounded-full hover:bg-[#CDD5DB]/40 text-[#A68868] transition-all"
          title="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
