import React from "react";
import ProductCard from "./ProductCard";
import { Sparkles } from "lucide-react";

export default function FeaturedProducts({ products = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="rounded-3xl bg-[#0B2B26]/60 border border-white/5 p-4 animate-pulse">
            <div className="aspect-square rounded-2xl bg-white/5 mb-4" />
            <div className="h-4 w-3/4 bg-white/5 rounded mb-2" />
            <div className="h-3 w-1/2 bg-white/5 rounded mb-4" />
            <div className="h-5 w-1/3 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-3xl bg-[#0B2B26]/40 border border-[#235347]/40">
        <p className="text-[#8EB69B]/70 text-xs">No featured products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#8EB69B]" />
        <h2 className="text-xl font-bold text-[#DAF1DE]">Handcrafted Highlights</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.slice(0, 8).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
