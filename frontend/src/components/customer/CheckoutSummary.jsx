import React from "react";
import { ShoppingBag, ShieldCheck, Tag, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function CheckoutSummary({
  items = [],
  subtotal = 0,
  taxRate = 0.03, // 3% GST standard for jewellery in India
  shippingCost = 0,
  promoDiscount = 0,
  onProceed,
  proceedText = "Proceed to Checkout",
  proceedLink = "/customer/checkout",
  isCheckoutPage = false,
  isSubmitting = false,
}) {
  const itemCount = items.reduce((acc, curr) => acc + (curr.quantity || 1), 0);
  const calculatedSubtotal = subtotal || items.reduce((acc, curr) => {
    const p = curr.product || curr;
    const price = Number(p.price || curr.price || 0);
    return acc + price * (curr.quantity || 1);
  }, 0);

  const tax = Math.round(calculatedSubtotal * taxRate);
  const total = Math.max(0, calculatedSubtotal + tax + shippingCost - promoDiscount);

  return (
    <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xs sticky top-24">
      <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
        <h2 className="text-lg font-black text-black flex items-center gap-2">
          <ShoppingBag className="w-5 h-5 text-[#A68868]" /> Order Summary
        </h2>
        <span className="px-3 py-1 rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 text-xs font-black text-black">
          {itemCount} {itemCount === 1 ? "Item" : "Items"}
        </span>
      </div>
      {/* Itemized Product List Preview */}
      {items.length > 0 && (
        <div className="space-y-2 max-h-56 overflow-y-auto pr-1 border-b border-[#CDD5DB] pb-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-black/70 mb-2">Products in Order</p>
          {items.map((item, idx) => {
            const p = item.product || item;
            const name = item.productName || item.product_name || item.name || p.name || "Jewellery Item";
            const qty = item.quantity || 1;
            const price = Number(item.unitPrice || item.price || p.price || 0);
            const lineSubtotal = item.subtotal !== undefined ? Number(item.subtotal) : price * qty;
            const img = item.image || item.image_url || item.product_image || p.image_url || p.image;

            return (
              <div key={item._id || item.id || idx} className="flex items-center justify-between gap-3 text-xs p-2.5 rounded-2xl bg-[#CDD5DB]/20 border border-[#CDD5DB]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex-shrink-0 border border-[#CDD5DB]">
                    {img ? (
                      <img src={img} alt={name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#A68868] text-[10px]">Item</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-black truncate">{name}</p>
                    <p className="text-[10px] font-bold text-black/70">
                      ₹{price.toLocaleString("en-IN")} × {qty}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-black text-black">₹{lineSubtotal.toLocaleString("en-IN")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Breakdown */}
      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-black/80 font-bold">
          <span>Items Subtotal</span>
          <span className="font-black text-black">₹{calculatedSubtotal.toLocaleString("en-IN")}</span>
        </div>

        <div className="flex justify-between text-black/80 font-bold">
          <span className="flex items-center gap-1">
            Estimated GST (3%)
          </span>
          <span className="font-black text-black">₹{tax.toLocaleString("en-IN")}</span>
        </div>

        <div className="flex justify-between text-black/80 font-bold">
          <span>Shipping & Insured Transit</span>
          {shippingCost === 0 ? (
            <span className="font-black text-emerald-700">FREE</span>
          ) : (
            <span className="font-black text-black">₹{shippingCost.toLocaleString("en-IN")}</span>
          )}
        </div>

        {promoDiscount > 0 && (
          <div className="flex justify-between text-emerald-700 font-bold">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" /> Promo Discount
            </span>
            <span className="font-black">- ₹{promoDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-[#CDD5DB] pt-4 space-y-1">
        <div className="flex justify-between items-baseline">
          <div>
            <span className="text-base font-black text-black block">Grand Total</span>
            <span className="text-xs text-black/70 font-bold">Total Payable</span>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-black">
              ₹{total.toLocaleString("en-IN")}
            </span>
            <span className="block text-[10px] text-black/60 font-black">Includes taxes & duties</span>
          </div>
        </div>
      </div>

      {/* Sustainability Badge */}
      <div className="p-3 rounded-2xl bg-[#CDD5DB]/30 border border-[#CDD5DB] text-xs font-bold text-black flex items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-[#A68868] flex-shrink-0" />
        <span>100% Recycled Precious Metal & Eco-Certified Hallmark Guarantee</span>
      </div>

      {/* Action Button */}
      {!isCheckoutPage ? (
        <Link
          to={proceedLink}
          className={`w-full py-3.5 px-4 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all ${
            itemCount === 0 ? "pointer-events-none opacity-50" : ""
          }`}
        >
          <span>{proceedText}</span>
          <ArrowRight className="w-4 h-4 text-white" />
        </Link>
      ) : (
        <button
          type="button"
          onClick={onProceed}
          disabled={isSubmitting || itemCount === 0}
          className="w-full py-3.5 px-4 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span>Processing Order...</span>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-white" />
              <span>{proceedText}</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
