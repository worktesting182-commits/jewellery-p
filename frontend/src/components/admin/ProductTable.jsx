import React from "react";
import { Eye, Building2, Layers } from "lucide-react";

export default function ProductTable({ products = [], onView, onToggleStatus, updatingId }) {
  return (
    <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-black">
          <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
            <tr>
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Product Name</th>
              <th className="px-6 py-4">Manufacturer</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Manufacturer Price</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#CDD5DB] font-bold">
            {products.map((prod) => {
              const statusUpper = (prod.status || "ACTIVE").toUpperCase();

              return (
                <tr key={prod.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-[#CDD5DB] overflow-hidden shrink-0">
                      <img
                        src={prod.image}
                        alt={prod.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80";
                        }}
                      />
                    </div>
                  </td>

                  <td className="px-6 py-4 font-black text-black">
                    <div>
                      <span className="block font-black text-black">{prod.title}</span>
                      <span className="block text-[10px] text-black/70 font-mono">SKU: {prod.sku}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-black text-[#A68868]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-[#A68868]" />
                      <span>{prod.manufacturer}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="px-3 py-1 rounded-full bg-[#E3C39D]/40 text-black font-black text-[11px] border border-[#A68868]/40 inline-flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#A68868]" /> {prod.category}
                    </span>
                  </td>

                  <td className="px-6 py-4 font-black text-black font-mono text-sm">
                    ₹{Number(prod.manufacturer_price || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                        statusUpper === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                          : "bg-rose-100 text-rose-950 border-rose-300"
                      }`}
                    >
                      {statusUpper}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView && onView(prod)}
                        className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                        title="View Product Details"
                      >
                        <Eye className="w-4 h-4 text-[#A68868]" />
                      </button>

                      <button
                        onClick={() => onToggleStatus && onToggleStatus(prod.id, prod.title, statusUpper)}
                        disabled={updatingId === prod.id}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                          statusUpper === "ACTIVE"
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300"
                        }`}
                      >
                        {statusUpper === "ACTIVE" ? "Disable" : "Enable"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
