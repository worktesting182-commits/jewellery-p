import React from "react";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  loading = false,
  subtitle,
}) {
  return (
    <div className="relative group rounded-3xl bg-white border border-[#CDD5DB] hover:border-[#A68868] p-6 transition-all duration-300 shadow-xs hover:shadow-md overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div className="space-y-1">
          <p className="text-xs font-black tracking-wider text-black uppercase">
            {title}
          </p>

          {loading ? (
            <div className="h-8 w-24 rounded-lg bg-[#CDD5DB]/40 animate-pulse my-2" />
          ) : (
            <h2 className="text-3xl font-black text-black tracking-tight">
              {value}
            </h2>
          )}

          {subtitle && (
            <p className="text-xs text-black/70 font-bold">
              {subtitle}
            </p>
          )}

          {!loading && trend && (
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  trend.direction === "up"
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : "bg-rose-100 text-rose-900 border border-rose-300"
                }`}
              >
                <span>{trend.direction === "up" ? "↑" : "↓"}</span>
                {trend.value}
              </span>
              <span className="text-black/60 font-bold">{trend.label}</span>
            </div>
          )}
        </div>

        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#A68868] text-white shadow-xs group-hover:scale-105 transition-all duration-300">
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}