import React from "react";
import { Eye, ShieldCheck, AlertOctagon, Store, Building2 } from "lucide-react";

export default function ListingTable({ listings = [], onView, onToggleStatus, updatingId }) {
  return (
    <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-black">
          <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
            <tr>
              <th className="px-6 py-4">Product</th>
              <th className="px-6 py-4">Retailer</th>
              <th className="px-6 py-4">Manufacturer</th>
              <th className="px-6 py-4">Selling Price</th>
              <th className="px-6 py-4 text-center">Stock</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#CDD5DB] font-bold">
            {listings.map((listing) => {
              const statusUpper = (listing.status || "ACTIVE").toUpperCase();

              return (
                <tr key={listing.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                  <td className="px-6 py-4 font-black text-black">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-white border border-[#CDD5DB] overflow-hidden shrink-0">
                        <img
                          src={listing.image}
                          alt={listing.product_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80";
                          }}
                        />
                      </div>
                      <div>
                        <span className="block font-black text-black">{listing.product_name}</span>
                        <span className="block text-[10px] text-black/70 font-mono">ID: {listing.id?.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-black text-black">
                    <div className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[#A68868] shrink-0" />
                      <span>{listing.retailer}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-black text-[#A68868]">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 shrink-0 text-[#A68868]" />
                      <span>{listing.manufacturer}</span>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-black text-black font-mono text-sm">
                    ₹{Number(listing.selling_price || 0).toLocaleString("en-IN")}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black font-black text-xs border border-[#A68868]/40">
                      {listing.stock} in stock
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider inline-flex items-center gap-1 ${
                        statusUpper === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                          : "bg-rose-100 text-rose-950 border-rose-300"
                      }`}
                    >
                      {statusUpper === "ACTIVE" ? <ShieldCheck className="w-3 h-3 text-emerald-700" /> : <AlertOctagon className="w-3 h-3 text-rose-600" />}
                      {statusUpper}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onView && onView(listing)}
                        className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                        title="Inspect Listing Details"
                      >
                        <Eye className="w-4 h-4 text-[#A68868]" />
                      </button>

                      <button
                        onClick={() => onToggleStatus && onToggleStatus(listing.id, listing.product_name, statusUpper)}
                        disabled={updatingId === listing.id}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                          statusUpper === "ACTIVE"
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300"
                        }`}
                      >
                        {statusUpper === "ACTIVE" ? "Disable Listing" : "Enable Listing"}
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
