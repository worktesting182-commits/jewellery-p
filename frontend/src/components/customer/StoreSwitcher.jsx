import React, { useState } from "react";
import { useRetailer } from "../../context/RetailerContext";
import { Store, ChevronDown, PlusCircle, Check, Trash2 } from "lucide-react";

export default function StoreSwitcher() {
  const { activeRetailer, authorizedStores, switchStore, openCodeModal, leaveStore } = useRetailer();
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
        className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#E3C39D]/30 hover:bg-[#E3C39D]/60 border border-[#A68868]/40 transition-all text-xs font-black text-black"
        title="Switch Jeweller Storefront"
      >
        <Store className="w-4 h-4 text-[#A68868]" />
        <span className="max-w-[120px] sm:max-w-[160px] truncate">
          {activeRetailer ? activeRetailer.shop_name : "Enter Store Code"}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-black" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-30" onClick={() => setIsOpen(false)} />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-[#F8F6F2] border border-[#CDD5DB] shadow-xl z-40 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold text-black border-b border-[#CDD5DB]/60 flex items-center justify-between">
              <span>My Jewellers ({authorizedStores.length})</span>
            </div>

            {authorizedStores.length === 0 ? (
              <div className="px-3 py-3 text-xs text-black font-extrabold text-center">
                No store memberships yet.
              </div>
            ) : (
              authorizedStores.map((store) => {
                const storeId = store.id || store.retailer_id;
                const isActive = activeRetailer?.id === storeId;
                const storeName = store.shop_name || store.business_name || "Jeweller";
                return (
                  <div
                    key={storeId}
                    onClick={() => {
                      switchStore(store);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                      isActive
                        ? "bg-[#A68868] text-white"
                        : "text-black hover:bg-[#E3C39D]/30"
                    }`}
                  >
                    <div className="flex flex-col text-left truncate pr-2">
                      <span className="truncate">{storeName}</span>
                      <span className={`text-[10px] font-mono ${isActive ? "text-white/80" : "text-black/70"}`}>
                        {store.retailer_code}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isActive && <Check className="w-4 h-4 text-white shrink-0" />}
                      
                      {/* Working Remove Store Button */}
                      <button
                        type="button"
                        onClick={(e) => handleRemoveStore(e, storeId, storeName)}
                        disabled={removingId === storeId}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isActive
                            ? "hover:bg-rose-700/60 text-white/90 hover:text-white"
                            : "hover:bg-rose-100 text-rose-600 hover:text-rose-800"
                        }`}
                        title={`Leave ${storeName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <div className="pt-1 border-t border-[#CDD5DB]/60">
              <button
                onClick={() => {
                  setIsOpen(false);
                  openCodeModal();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black text-[#A68868] hover:bg-[#E3C39D]/30 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Join Another Jeweller</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
