import React from "react";
import { Gem, Edit2, Trash2, Layers } from "lucide-react";

export default function CategoryTable({ categories = [], onEdit, onDelete }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {categories.map((cat) => (
        <div
          key={cat.id}
          className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-4 flex flex-col justify-between hover:border-[#A68868] transition-all"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868]">
                <Gem className="w-5 h-5 text-[#A68868]" />
              </div>
              <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[10px] font-black border border-[#A68868]/40">
                {cat.products_count || cat.product_count || 0} Products
              </span>
            </div>

            <div>
              <h3 className="text-lg font-black text-black">{cat.name}</h3>
              <p className="text-xs text-black/70 font-bold leading-relaxed mt-1 line-clamp-2">
                {cat.description || "Platform master category classification."}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#CDD5DB] text-xs">
            <span className="text-[10px] text-black/70 font-mono font-bold">
              ID: {cat.id?.slice(0, 8)}...
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit && onEdit(cat)}
                className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                title="Edit Category"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#A68868]" />
              </button>

              <button
                onClick={() => onDelete && onDelete(cat)}
                className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors"
                title="Delete Category"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
