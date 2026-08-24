import React from "react";
import { Eye, Edit2, Building2, Store, User, ShieldCheck } from "lucide-react";

export default function UserTable({ users = [], onView, onEdit, onStatusChange }) {
  return (
    <div className="rounded-3xl bg-white border border-[#CDD5DB] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-black">
          <thead className="bg-[#CDD5DB]/20 text-black uppercase text-[10px] tracking-wider font-black border-b border-[#CDD5DB]">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Registration Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#CDD5DB] font-bold">
            {users.map((user) => {
              const roleUpper = (user.role || "CUSTOMER").toUpperCase();
              const statusUpper = (user.status || "ACTIVE").toUpperCase();

              return (
                <tr key={user.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                  <td className="px-6 py-4 font-black text-black">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#A68868] text-white flex items-center justify-center font-black text-xs">
                        {(user.name || user.email || "U")[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="block font-black text-black">{user.name || user.full_name}</span>
                        <span className="block text-[10px] text-black/70 font-mono">ID: {user.id?.slice(0, 8)}...</span>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 font-bold text-black">{user.email}</td>
                  <td className="px-6 py-4 text-black font-mono font-bold">{user.phone}</td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black border inline-flex items-center gap-1 uppercase tracking-wider ${
                        roleUpper === "MANUFACTURER"
                          ? "bg-purple-100 text-purple-950 border-purple-300"
                          : roleUpper === "RETAILER"
                          ? "bg-amber-100 text-amber-950 border-amber-300"
                          : roleUpper === "ADMIN"
                          ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                          : "bg-blue-100 text-blue-950 border-blue-300"
                      }`}
                    >
                      {roleUpper === "MANUFACTURER" && <Building2 className="w-3 h-3 text-purple-700" />}
                      {roleUpper === "RETAILER" && <Store className="w-3 h-3 text-amber-700" />}
                      {roleUpper === "CUSTOMER" && <User className="w-3 h-3 text-blue-700" />}
                      {roleUpper === "ADMIN" && <ShieldCheck className="w-3 h-3 text-emerald-700" />}
                      {roleUpper}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                        statusUpper === "ACTIVE"
                          ? "bg-emerald-100 text-emerald-950 border-emerald-300"
                          : statusUpper === "BLOCKED" || statusUpper === "SUSPENDED"
                          ? "bg-rose-100 text-rose-950 border-rose-300"
                          : "bg-amber-100 text-amber-950 border-amber-300"
                      }`}
                    >
                      {statusUpper}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-black/70 font-bold text-[11px]">
                    {new Date(user.created_at || user.registration_date || Date.now()).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onView && onView(user)}
                        className="p-1.5 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                        title="View User Details"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#A68868]" />
                      </button>

                      <button
                        onClick={() => onEdit && onEdit(user)}
                        className="p-1.5 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                        title="Edit User Info"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#A68868]" />
                      </button>

                      {statusUpper !== "ACTIVE" && (
                        <button
                          onClick={() => onStatusChange && onStatusChange(user.id, user.name, "ACTIVE")}
                          className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-black transition-colors"
                        >
                          Activate
                        </button>
                      )}

                      {statusUpper === "ACTIVE" && (
                        <button
                          onClick={() => onStatusChange && onStatusChange(user.id, user.name, "INACTIVE")}
                          className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-[10px] font-black transition-colors"
                        >
                          Deactivate
                        </button>
                      )}

                      {statusUpper !== "BLOCKED" && (
                        <button
                          onClick={() => onStatusChange && onStatusChange(user.id, user.name, "BLOCKED")}
                          className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-black transition-colors"
                        >
                          Block
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
