import React, { useState, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Coins } from "lucide-react";

export default function GoldTickerBar() {
  const [rates, setRates] = useState({
    gold24k: { price: 7420, change: 0.85 },
    gold22k: { price: 6800, change: 0.72 },
    silver999: { price: 88.5, change: -0.15 },
  });

  useEffect(() => {
    // Simulate slight live fluctuations
    const interval = setInterval(() => {
      setRates((prev) => ({
        gold24k: {
          price: +(prev.gold24k.price + (Math.random() * 4 - 2)).toFixed(1),
          change: +(prev.gold24k.change + (Math.random() * 0.1 - 0.05)).toFixed(2),
        },
        gold22k: {
          price: +(prev.gold22k.price + (Math.random() * 3.5 - 1.75)).toFixed(1),
          change: +(prev.gold22k.change + (Math.random() * 0.1 - 0.05)).toFixed(2),
        },
        silver999: {
          price: +(prev.silver999.price + (Math.random() * 0.2 - 0.1)).toFixed(2),
          change: +(prev.silver999.change + (Math.random() * 0.04 - 0.02)).toFixed(2),
        },
      }));
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#A68868] text-white py-2 px-4 text-xs font-black tracking-wide shadow-xs flex items-center justify-between overflow-x-auto whitespace-nowrap scrollbar-none border-b border-[#8A6D4F]/30">
      
      {/* Left Message */}
      <div className="flex items-center gap-2 shrink-0">
        <Sparkles className="w-3.5 h-3.5 text-[#E3C39D] animate-pulse" />
        <span>Explore Handcrafted Hallmark Certified Jewellery Direct from Master Artisans</span>
      </div>

      {/* Right Live Ticker Rates */}
      <div className="hidden md:flex items-center gap-6 shrink-0 pl-6 border-l border-white/20 text-[11px]">
        
        {/* 24K Gold */}
        <div className="flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-[#E3C39D]" />
          <span className="text-[#E3C39D] font-extrabold uppercase">24K Gold:</span>
          <span className="font-mono font-bold">₹{rates.gold24k.price}/g</span>
          <span className={`inline-flex items-center text-[10px] ${rates.gold24k.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {rates.gold24k.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {rates.gold24k.change > 0 ? `+${rates.gold24k.change}%` : `${rates.gold24k.change}%`}
          </span>
        </div>

        {/* 22K Gold */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#E3C39D] font-extrabold uppercase">22K Gold:</span>
          <span className="font-mono font-bold">₹{rates.gold22k.price}/g</span>
          <span className={`inline-flex items-center text-[10px] ${rates.gold22k.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {rates.gold22k.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {rates.gold22k.change > 0 ? `+${rates.gold22k.change}%` : `${rates.gold22k.change}%`}
          </span>
        </div>

        {/* 999 Silver */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#E3C39D] font-extrabold uppercase">Silver 999:</span>
          <span className="font-mono font-bold">₹{rates.silver999.price}/g</span>
          <span className={`inline-flex items-center text-[10px] ${rates.silver999.change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {rates.silver999.change >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
            {rates.silver999.change > 0 ? `+${rates.silver999.change}%` : `${rates.silver999.change}%`}
          </span>
        </div>

      </div>

    </div>
  );
}
