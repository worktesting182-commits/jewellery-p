import React from "react";
import { Outlet } from "react-router-dom";
import RetailerNavbar from "../components/retailer/Navbar";

const RetailerLayout = () => {
  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black flex flex-col font-sans selection:bg-[#E3C39D] selection:text-black">
      <RetailerNavbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fadeIn">
        <Outlet />
      </main>
      <footer className="border-t border-[#CDD5DB] py-6 bg-white text-center text-xs text-black/70 font-bold">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Aura Jewellery Marketplace — Retailer Partner Network</p>
          <div className="flex items-center gap-4 text-[11px] font-black text-black">
            <span>Marketplace Terms</span>
            <span>Wholesale Policy</span>
            <span>Retail Support</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RetailerLayout;
