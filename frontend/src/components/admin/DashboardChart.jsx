import React from "react";
import { PieChart, BarChart3, Layers, Gem } from "lucide-react";

export function DashboardChart({ title, type, data = [] }) {
  if (type === "usersByRole") {
    return (
      <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
          <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
            <PieChart className="w-4 h-4 text-[#A68868]" /> {title || "Users by Role"}
          </span>
          <span className="text-[10px] text-black/70 font-bold">Distribution</span>
        </div>

        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.role || item.name} className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-black">
                <span className="font-black flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || "#A68868" }} />
                  {item.name}
                </span>
                <span className="font-black">
                  {item.count} ({item.percentage}%)
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-[#CDD5DB]/30 overflow-hidden border border-[#CDD5DB]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color || "#A68868" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "ordersPerMonth") {
    const maxOrders = Math.max(...data.map((o) => o.orders || 0), 1);

    return (
      <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
          <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#A68868]" /> {title || "Orders per Month"}
          </span>
          <span className="text-[10px] text-black/70 font-bold">Monthly Trend</span>
        </div>

        <div className="grid grid-cols-6 gap-2 items-end h-40 pt-4 border-b border-[#CDD5DB] pb-2">
          {data.slice(-6).map((m, idx) => {
            const barHeight = Math.max(15, Math.round(((m.orders || 0) / maxOrders) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-black font-black">{m.orders || 0}</span>
                <div className="w-full bg-[#CDD5DB]/30 rounded-t-xl overflow-hidden h-28 flex items-end p-0.5 border border-[#CDD5DB]">
                  <div
                    className="w-full rounded-t-lg bg-[#A68868] transition-all duration-500 group-hover:bg-[#8A6D4F]"
                    style={{ height: `${barHeight}%` }}
                  />
                </div>
                <span className="text-[10px] text-black/70 font-black uppercase">{m.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-3">
        <span className="text-xs font-black text-black uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#A68868]" /> {title || "Products by Category"}
        </span>
        <span className="text-[10px] text-black/70 font-bold">Master Breakdown</span>
      </div>

      <div className="space-y-3.5">
        {data.map((cat, idx) => (
          <div key={idx} className="p-3 rounded-2xl bg-white border border-[#CDD5DB] flex items-center justify-between text-xs shadow-xs">
            <span className="font-black text-black flex items-center gap-2">
              <Gem className="w-3.5 h-3.5 text-[#A68868]" /> {cat.name || cat.category}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E3C39D]/40 text-black font-black border border-[#A68868]/40">
              {cat.count} items
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DashboardChart;
