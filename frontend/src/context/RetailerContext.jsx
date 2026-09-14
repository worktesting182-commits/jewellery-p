import React, { createContext, useContext, useState, useEffect } from "react";
import { retailerAccessAPI } from "../services/api";

const RetailerContext = createContext();

export function RetailerProvider({ children }) {
  const [activeRetailer, setActiveRetailerState] = useState(null);
  const [authorizedStores, setAuthorizedStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [pendingCode, setPendingCodeState] = useState(() => sessionStorage.getItem("pending_retailer_code") || null);

  useEffect(() => {
    fetchMyStores();

    const handleAuthChange = () => {
      fetchMyStores();
    };

    window.addEventListener("authChanged", handleAuthChange);
    window.addEventListener("focus", fetchMyStores);

    return () => {
      window.removeEventListener("authChanged", handleAuthChange);
      window.removeEventListener("focus", fetchMyStores);
    };
  }, []);

  /**
   * Fetch all authorized store memberships for customer ("My Stores").
   * Also processes any pending retailer code stored pre-auth in sessionStorage.
   */
  const fetchMyStores = async () => {
    try {
      setLoading(true);

      // Check if there is a pending retailer code saved before login
      const savedPendingCode = sessionStorage.getItem("pending_retailer_code");
      if (savedPendingCode) {
        try {
          const joinRes = await retailerAccessAPI.joinStore(savedPendingCode);
          sessionStorage.removeItem("pending_retailer_code");
          setPendingCodeState(null);
          console.log("✅ Auto-joined pending retailer post-auth:", joinRes.data);
        } catch (pendingErr) {
          console.warn("Notice auto-joining pending retailer:", pendingErr.message);
          sessionStorage.removeItem("pending_retailer_code");
          setPendingCodeState(null);
        }
      }

      const res = await retailerAccessAPI.getMyStores();
      let stores = [];
      if (Array.isArray(res.data?.stores)) {
        stores = res.data.stores;
      } else if (Array.isArray(res.data?.data)) {
        stores = res.data.data;
      } else if (Array.isArray(res.data)) {
        stores = res.data;
      }
      setAuthorizedStores(stores);

      if (stores.length > 0) {
        const savedId = localStorage.getItem("active_retailer_id");
        let matched = stores.find((s) => s.id === savedId || s.retailer_id === savedId);
        
        if (!matched) {
          matched = stores[0];
        }
        
        setActiveRetailerInternal(matched);
      } else {
        setActiveRetailerState(null);
        localStorage.removeItem("active_retailer_id");
      }
    } catch (err) {
      console.warn("Notice fetching authorized stores:", err.message);
      setAuthorizedStores([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Internal helper to update active retailer state & localStorage for UX context
   */
  const setActiveRetailerInternal = (store) => {
    if (!store) {
      setActiveRetailerState(null);
      localStorage.removeItem("active_retailer_id");
      return;
    }

    const storeObj = {
      id: store.id || store.retailer_id,
      shop_name: store.shop_name || store.business_name || "Jewellery Retailer",
      business_name: store.shop_name || store.business_name || "Jewellery Retailer",
      retailer_code: store.retailer_code || "",
    };

    setActiveRetailerState(storeObj);
    localStorage.setItem("active_retailer_id", storeObj.id);
    window.dispatchEvent(new Event("activeRetailerChanged"));
  };

  /**
   * Store pending retailer code pre-authentication in sessionStorage.
   * NOTE: THIS IS TEMPORARY FRONTEND UX STATE AND IS NEVER TREATED AS AUTHORIZATION BY THE BACKEND.
   */
  const savePendingRetailerCode = (code) => {
    if (code && typeof code === "string") {
      const cleanCode = code.trim().toUpperCase();
      sessionStorage.setItem("pending_retailer_code", cleanCode);
      setPendingCodeState(cleanCode);
    }
  };

  /**
   * Switch active retailer store context (For UI / UX presentation)
   */
  const switchStore = (storeIdOrObject) => {
    if (typeof storeIdOrObject === "string") {
      const found = authorizedStores.find((s) => s.id === storeIdOrObject || s.retailer_id === storeIdOrObject);
      if (found) {
        setActiveRetailerInternal(found);
      }
    } else if (storeIdOrObject && typeof storeIdOrObject === "object") {
      setActiveRetailerInternal(storeIdOrObject);
    }
  };

  /**
   * Validate & Join a new retailer storefront via public code (CJP-XXXXXX)
   */
  const validateAndJoinStore = async (code) => {
    try {
      const valRes = await retailerAccessAPI.validateCode(code);
      if (!valRes.data?.valid && !valRes.data?.retailer) {
        throw new Error("Invalid retailer code.");
      }

      const joinRes = await retailerAccessAPI.joinStore(code);
      const joinedStore = joinRes.data?.retailer || valRes.data?.retailer;

      await fetchMyStores();

      if (joinedStore) {
        setActiveRetailerInternal(joinedStore);
      }

      setShowCodeModal(false);
      return { success: true, message: joinRes.data?.message || "Successfully joined store!" };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to join retailer store.";
      return { success: false, message: msg };
    }
  };

  /**
   * Leave / Remove an authorized store membership
   */
  const leaveStore = async (retailerId) => {
    try {
      const res = await retailerAccessAPI.leaveStore(retailerId);
      
      const updatedRes = await retailerAccessAPI.getMyStores();
      const stores = updatedRes.data?.stores || updatedRes.data?.data || [];
      setAuthorizedStores(stores);

      if (activeRetailer?.id === retailerId) {
        if (stores.length > 0) {
          setActiveRetailerInternal(stores[0]);
        } else {
          setActiveRetailerInternal(null);
        }
      }

      return { success: true, message: res.data?.message || "Store membership removed." };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to remove store membership.";
      return { success: false, message: msg };
    }
  };

  const openCodeModal = () => setShowCodeModal(true);
  const closeCodeModal = () => setShowCodeModal(false);

  return (
    <RetailerContext.Provider
      value={{
        activeRetailer,
        authorizedStores,
        loading,
        showCodeModal,
        pendingCode,
        savePendingRetailerCode,
        switchStore,
        validateAndJoinStore,
        leaveStore,
        fetchMyStores,
        openCodeModal,
        closeCodeModal,
      }}
    >
      {children}
    </RetailerContext.Provider>
  );
}

export function useRetailer() {
  const context = useContext(RetailerContext);
  if (!context) {
    throw new Error("useRetailer must be used within a RetailerProvider");
  }
  return context;
}

export default RetailerContext;
