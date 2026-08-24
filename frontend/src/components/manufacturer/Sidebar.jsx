import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  FolderTree,
  Settings,
  Gem,
  Sparkles,
  User,
} from "lucide-react";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    {
      label: "Main Menu",
      items: [
        { name: "Dashboard", href: "/manufacturer/dashboard", icon: LayoutDashboard },
        { name: "My Products", href: "/manufacturer/products", icon: Package },
        { name: "Add New Product", href: "/manufacturer/products/add", icon: PlusCircle },
        { name: "My Profile", href: "/manufacturer/profile", icon: User },
      ],
    },
  ];

  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r border-[#CDD5DB] p-4 space-y-6 flex flex-col justify-between shadow-xs">
      <div className="space-y-6">
        {menuItems.map((group, idx) => (
          <div key={idx} className="space-y-2">
            <h4 className="px-3 text-[10px] uppercase tracking-widest font-black text-black/60">
              {group.label}
            </h4>
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-black tracking-wide transition-all duration-200 ${
                      isActive
                        ? "bg-[#A68868] text-white shadow-xs"
                        : "text-black hover:bg-[#E3C39D]/30"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-[#A68868]"}`} />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Banner */}
      <div className="p-4 rounded-3xl bg-[#CDD5DB]/30 border border-[#CDD5DB] shadow-xs text-center space-y-2">
        <div className="w-8 h-8 mx-auto rounded-full bg-[#E3C39D]/40 border border-[#A68868]/40 flex items-center justify-center text-[#A68868]">
          <Sparkles className="w-4 h-4 text-[#A68868]" />
        </div>
        <p className="text-xs font-black text-black">Jewellery Studio</p>
        <p className="text-[11px] text-black/70 font-bold leading-tight">
          Craft & list verified sustainable products.
        </p>
      </div>
    </aside>
  );
}
