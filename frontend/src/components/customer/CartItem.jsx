import React from "react";
import { Trash2, Gem, Leaf, AlertCircle } from "lucide-react";
import QuantitySelector from "./QuantitySelector";

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  if (!item) return null;

  const itemId = item._id || item.id || item.product_id || item.productId;
  const product = item.product || item;
  const productName = item.productName || item.product_name || item.name || product.name || "Jewellery Item";
  const quantity = Number(item.quantity || 1);
  const price = Number(item.unitPrice || item.price || product.price || 0);
  const lineTotal = item.subtotal !== undefined && item.subtotal !== null ? Number(item.subtotal) : price * quantity;
  const imageUrl = item.image || item.image_url || item.product_image || product.image_url || product.image;
  const stock = product.stock !== undefined ? product.stock : (product.stock_quantity !== undefined ? product.stock_quantity : (item.stock_quantity || 10));
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock < quantity;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB] hover:border-[#A68868] transition-all shadow-xs group">
      {/* Product Information */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#CDD5DB]/20 border border-[#CDD5DB] flex-shrink-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#A68868]">
              <Gem className="w-8 h-8" />
            </div>
          )}
        </div>

        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-[10px] font-black text-black uppercase tracking-wider">
              {product.category_name || product.categories?.name || product.metal_type || "Jewellery"}
            </span>

            {product.carbon_score && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#CDD5DB]/30 border border-[#CDD5DB] text-[10px] text-black font-black">
                <Leaf className="w-3 h-3 text-[#A68868]" />
                Score {product.carbon_score}
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-black text-black truncate group-hover:text-[#A68868] transition-colors">
            {productName}
          </h3>

          <p className="text-xs font-bold text-black/80">
            Unit Price: <span className="font-black text-black">₹{price.toLocaleString("en-IN")}</span>
          </p>

          {isOutOfStock && (
            <p className="text-xs text-rose-600 flex items-center gap-1 font-black">
              <AlertCircle className="w-3.5 h-3.5" /> Out of stock
            </p>
          )}

          {isLowStock && (
            <p className="text-xs text-amber-700 flex items-center gap-1 font-black">
              <AlertCircle className="w-3.5 h-3.5" /> Only {stock} available in stock
            </p>
          )}
        </div>
      </div>

      {/* Controls & Line Total */}
      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-[#CDD5DB]">
        <QuantitySelector
          quantity={quantity}
          onIncrease={() => onUpdateQuantity && onUpdateQuantity(itemId, quantity + 1)}
          onDecrease={() => onUpdateQuantity && onUpdateQuantity(itemId, Math.max(1, quantity - 1))}
          max={stock > 0 ? stock : 99}
          disabled={isOutOfStock}
          size="md"
        />

        <div className="text-right min-w-[5rem]">
          <span className="block text-[10px] uppercase text-black/60 font-black">Subtotal</span>
          <span className="text-base font-black text-black">
            ₹{lineTotal.toLocaleString("en-IN")}
          </span>
        </div>

        <button
          type="button"
          onClick={() => onRemove && onRemove(itemId)}
          className="p-2 rounded-full bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 transition-all"
          title="Remove item"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
