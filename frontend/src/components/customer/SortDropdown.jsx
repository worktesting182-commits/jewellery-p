import React from "react";
import { ArrowUpDown } from "lucide-react";

export default function SortDropdown({ value, onChange }) {
  const options = [
    { label: "Newest", value: "newest" },
    { label: "Price: Low → High", value: "price_asc" },
    { label: "Price: High → Low", value: "price_desc" },
    { label: "Product name (A–Z)", value: "name_asc" },
  ];

  return (
    <div className="relative inline-flex items-center">
      <ArrowUpDown className="absolute left-3.5 top-3.5 w-4 h-4 text-[#A68868] pointer-events-none" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-10 pr-8 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black text-xs font-extrabold focus:outline-none focus:border-[#A68868] cursor-pointer shadow-xs hover:border-[#A68868] transition-all"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white text-black font-bold">
            Sort by: {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
