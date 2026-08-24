import React from "react";
import { Plus, Minus } from "lucide-react";

export default function QuantitySelector({
  quantity = 1,
  onIncrease,
  onDecrease,
  min = 1,
  max = 99,
  disabled = false,
  size = "md",
}) {
  const isMin = quantity <= min;
  const isMax = quantity >= max;

  const sizeClasses = {
    sm: "h-7 text-xs px-2 gap-1",
    md: "h-9 text-sm px-3 gap-2",
    lg: "h-11 text-base px-4 gap-3",
  };

  const buttonSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={`inline-flex items-center rounded-xl bg-[#051F20] border border-[#235347] p-1 shadow-inner ${sizeClasses[size]}`}
    >
      <button
        type="button"
        onClick={onDecrease}
        disabled={disabled || isMin}
        className={`flex items-center justify-center rounded-lg bg-[#163832] text-[#DAF1DE] hover:bg-[#235347] hover:text-[#8EB69B] disabled:opacity-40 disabled:hover:bg-[#163832] disabled:cursor-not-allowed transition-all ${buttonSizes[size]}`}
        title="Decrease quantity"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>

      <span className="font-bold text-[#DAF1DE] min-w-[1.75rem] text-center tracking-tight">
        {quantity}
      </span>

      <button
        type="button"
        onClick={onIncrease}
        disabled={disabled || isMax}
        className={`flex items-center justify-center rounded-lg bg-[#163832] text-[#DAF1DE] hover:bg-[#235347] hover:text-[#8EB69B] disabled:opacity-40 disabled:hover:bg-[#163832] disabled:cursor-not-allowed transition-all ${buttonSizes[size]}`}
        title="Increase quantity"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
