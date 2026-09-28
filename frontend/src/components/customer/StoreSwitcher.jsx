import React, { useState } from "react";
import { useRetailer } from "../../context/RetailerContext";
import { Store, ChevronDown, PlusCircle, Check, Trash2 } from "lucide-react";

export default function StoreSwitcher() {
  const { activeRetailer, authorizedStores, loading, switchStore, openCodeModal, leaveStore } = useRetailer();
  const [isOpen, setIsOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const handleRemoveStore = async (e, storeId, storeName) => {
    e.stopPropagation(); // Stop store selection trigger
    if (window.confirm(`Are you sure you want to leave ${storeName}?`)) {
      try {
        setRemovingId(storeId);
        await leaveStore(storeId);
      } catch (err) {
        console.error("Error leaving store:", err);
      } finally {
        setRemovingId(null);
      }
    }
  };

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#EFE7DC] hover:bg-[#E8DCCB] border border-[#D5C4B0] transition-all text-xs font-black text-black shadow-xs"
        title="Switch Jeweller Storefront"
      >
        <Store className="w-4 h-4 text-[#A68868]" />
        <span className="max-w-[120px] sm:max-w-[180px] truncate font-extrabold text-black">
          {activeRetailer ? activeRetailer.shop_name : "Select Jeweller"}
        </span>
        <ChevronDown className="w-4 h-4 text-black shrink-0" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-80 rounded-3xl bg-[#FAF8F5] border border-[#CDD5DB] shadow-2xl z-40 p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            
            {/* Header Title */}
            <div className="text-[11px] uppercase tracking-wider font-black text-black px-1 flex items-center justify-between">
              <span>MY JEWELLERS ({authorizedStores.length})</span>
            </div>

            <div className="h-px bg-[#CDD5DB]/60 my-1" />

            {/* Store List */}
            {loading ? (
              <div className="px-3 py-4 text-center text-xs font-black text-black/60 animate-pulse">
                Loading store memberships...
              </div>
            ) : authorizedStores.length === 0 ? (
              <div className="px-3 py-4 text-xs text-black/80 font-black text-center bg-white rounded-2xl border border-[#CDD5DB]/60">
                No active store memberships found.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {authorizedStores.map((store) => {
                  const storeId = store.id || store.retailer_id;
                  const isActive = activeRetailer?.id === storeId;
                  const storeName = store.shop_name || store.business_name || "Jeweller";
                  const storeCode = store.retailer_code || "CJP-STORE";

                  return (
                    <div
                      key={storeId}
                      onClick={() => {
                        switchStore(store);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-xs font-black cursor-pointer transition-all ${
                        isActive
                          ? "bg-[#A68868] text-white shadow-md"
                          : "bg-transparent text-black hover:bg-[#EFE7DC]/60"
                      }`}
                    >
                      <div className="flex flex-col text-left truncate pr-2">
                        <span className="truncate text-sm font-black">{storeName}</span>
                        <span
                          className={`text-[11px] font-mono tracking-wide font-extrabold mt-0.5 ${
                            isActive ? "text-white/80" : "text-black/60"
                          }`}
                        >
                          {storeCode}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isActive && <Check className="w-4 h-4 text-white shrink-0 stroke-[2.5]" />}
                        
                        {/* Remove Store Action */}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveStore(e, storeId, storeName)}
                          disabled={removingId === storeId}
                          className={`p-1.5 rounded-xl transition-colors ${
                            isActive
                              ? "hover:bg-rose-700/60 text-white/90 hover:text-white"
                              : "hover:bg-rose-100 text-rose-500 hover:text-rose-700"
                          }`}
                          title={`Leave ${storeName}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="h-px bg-[#CDD5DB]/60 my-1" />

            {/* Join Another Jeweller Button */}
            <div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  openCodeModal();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-2xl text-xs font-black text-[#A68868] hover:text-[#8A6D4F] hover:bg-[#EFE7DC]/60 transition-all group"
              >
                <PlusCircle className="w-5 h-5 text-[#A68868] group-hover:scale-110 transition-transform" />
                <span className="font-black text-sm text-black">+ Join Another Jeweller</span>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
