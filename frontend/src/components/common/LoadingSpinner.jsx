import React from "react";

export function LoadingSpinner({ text = "Loading details...", size = "md" }) {
  const sizeClasses = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-4",
    lg: "w-14 h-14 border-4",
  };

  return (
    <div className="py-12 px-4 text-center space-y-3 flex flex-col items-center justify-center animate-fadeIn">
      <div
        className={`${sizeClasses[size] || sizeClasses.md} border-[#A68868] border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="text-xs font-black text-black uppercase tracking-wider">
          {text}
        </p>
      )}
    </div>
  );
}

export function SkeletonCard({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-3xl bg-white border border-[#CDD5DB] p-5 space-y-4 animate-pulse shadow-xs"
        >
          <div className="w-full h-48 bg-[#CDD5DB]/30 rounded-2xl" />
          <div className="space-y-2">
            <div className="h-4 bg-[#CDD5DB]/40 rounded-full w-3/4" />
            <div className="h-3 bg-[#CDD5DB]/30 rounded-full w-1/2" />
          </div>
          <div className="pt-2 border-t border-[#CDD5DB] flex justify-between items-center">
            <div className="h-4 bg-[#CDD5DB]/40 rounded-full w-1/3" />
            <div className="h-8 bg-[#CDD5DB]/50 rounded-full w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}
