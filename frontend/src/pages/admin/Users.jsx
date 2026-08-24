import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Filter,
  Eye,
  Edit2,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck,
  Building2,
  Store,
  User,
  ShieldAlert,
  Calendar,
  Phone,
  Mail,
  Lock,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { adminAPI } from "../../services/api";
import UserTable from "../../components/admin/UserTable";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal States
  const [viewUser, setViewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", role: "CUSTOMER", status: "ACTIVE" });
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getUsers({ role: roleFilter, status: statusFilter });
      const data = res.data?.data || res.data?.users || [];
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      full_name: user.name || user.full_name || "",
      phone: user.phone || "",
      role: user.role || "CUSTOMER",
      status: user.status || "ACTIVE",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editUser) return;

    try {
      setUpdating(true);
      await adminAPI.updateUser(editUser.id, editForm);
      showToast(`User ${editForm.full_name} updated successfully`);
      setEditUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      showToast(err.response?.data?.message || "Failed to update user", "error");
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async (userId, userName, newStatus) => {
    try {
      setUpdating(true);
      await adminAPI.updateUserStatus(userId, newStatus);
      showToast(`User ${userName} status changed to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      console.error("Error updating user status:", err);
      showToast(err.response?.data?.message || "Failed to change user status", "error");
    } finally {
      setUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone?.toLowerCase().includes(search.toLowerCase()) ||
      u.role?.toLowerCase().includes(search.toLowerCase());

    const matchesRole = roleFilter === "ALL" || (u.role || "").toUpperCase() === roleFilter;
    const matchesStatus = statusFilter === "ALL" || (u.status || "").toUpperCase() === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl border shadow-xl flex items-center gap-3 backdrop-blur-md transition-all font-black text-xs ${
            toast.type === "success"
              ? "bg-emerald-50 border-emerald-300 text-emerald-950"
              : "bg-rose-50 border-rose-300 text-rose-950"
          }`}
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[11px] font-black uppercase tracking-wider border border-[#A68868]/40 inline-flex items-center gap-1.5 mb-2">
            <Users className="w-3.5 h-3.5 text-[#A68868]" /> Module 2 – Platform Security & User Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            User Management
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Monitor, inspect, activate, deactivate, or block platform users across Customers, Manufacturers, and Retailers.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Name, Email, Phone, or Role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
          />
        </div>
      </div>

      {/* Admin Password Security Policy Notice Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs flex items-start gap-3 text-xs text-black font-bold">
        <div className="p-2 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868] shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-black text-black block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#A68868]" /> Admin Security Policy Constraint
          </span>
          <p className="text-black/70 font-bold leading-relaxed">
            Admin cannot edit or view user passwords. Password modification is strictly restricted to protect user privacy and account authentication integrity.
          </p>
        </div>
      </div>

      {/* Filters: Role & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs">
        {/* Role Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] uppercase font-black text-black/70 shrink-0 mr-1">Role:</span>
          {["ALL", "CUSTOMER", "MANUFACTURER", "RETAILER"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                roleFilter === r
                  ? "bg-[#A68868] text-white shadow-xs"
                  : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
              }`}
            >
              {r === "ALL" ? "All Roles" : r}
            </button>
          ))}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-[#CDD5DB]">
          <span className="text-[10px] uppercase font-black text-black/70 shrink-0 mr-1">Status:</span>
          {["ALL", "ACTIVE", "INACTIVE", "BLOCKED"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all ${
                statusFilter === s
                  ? "bg-[#A68868] text-white shadow-xs"
                  : "bg-white text-black hover:bg-[#E3C39D]/30 border border-[#CDD5DB]"
              }`}
            >
              {s === "ALL" ? "All Statuses" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading platform users...</p>
        </div>
      ) : (
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
                {filteredUsers.map((user) => {
                  const roleUpper = (user.role || "CUSTOMER").toUpperCase();
                  const statusUpper = (user.status || "ACTIVE").toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-[#E3C39D]/20 transition-colors">
                      {/* Name */}
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

                      {/* Email */}
                      <td className="px-6 py-4 font-bold text-black">{user.email}</td>

                      {/* Phone */}
                      <td className="px-6 py-4 text-black font-mono font-bold">{user.phone}</td>

                      {/* Role */}
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

                      {/* Status */}
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

                      {/* Registration Date */}
                      <td className="px-6 py-4 text-black/70 font-bold text-[11px]">
                        {new Date(user.created_at || user.registration_date || Date.now()).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View */}
                          <button
                            onClick={() => setViewUser(user)}
                            className="p-1.5 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="View User Details"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#A68868]" />
                          </button>

                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                            title="Edit User Info"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-[#A68868]" />
                          </button>

                          {/* Activate */}
                          {statusUpper !== "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(user.id, user.name, "ACTIVE")}
                              className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-300 text-[10px] font-black transition-colors"
                              title="Activate User"
                            >
                              Activate
                            </button>
                          )}

                          {/* Deactivate */}
                          {statusUpper === "ACTIVE" && (
                            <button
                              onClick={() => handleStatusChange(user.id, user.name, "INACTIVE")}
                              className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-[10px] font-black transition-colors"
                              title="Deactivate User"
                            >
                              Deactivate
                            </button>
                          )}

                          {/* Block */}
                          {statusUpper !== "BLOCKED" && (
                            <button
                              onClick={() => handleStatusChange(user.id, user.name, "BLOCKED")}
                              className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 text-[10px] font-black transition-colors"
                              title="Block User"
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

          {filteredUsers.length === 0 && (
            <div className="py-16 text-center text-xs font-bold text-black/70 bg-white space-y-2">
              <Users className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No users found matching current filters.</p>
            </div>
          )}
        </div>
      )}

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#A68868] text-white flex items-center justify-center font-black text-sm">
                  {(viewUser.name || viewUser.email || "U")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-black text-black">{viewUser.name || viewUser.full_name}</h3>
                  <span className="text-[11px] text-black/70 font-bold">Platform User Account Details</span>
                </div>
              </div>

              <button
                onClick={() => setViewUser(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">User Role</span>
                  <span className="font-black text-black block mt-0.5">{viewUser.role}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-black text-black/70 block">Account Status</span>
                  <span className="font-black text-black block mt-0.5">{viewUser.status}</span>
                </div>
              </div>

              <div className="space-y-2.5 p-4 rounded-2xl bg-white border border-[#CDD5DB]">
                <div className="flex items-center gap-2 text-black">
                  <Mail className="w-4 h-4 text-[#A68868]" />
                  <span className="font-bold">{viewUser.email}</span>
                </div>

                <div className="flex items-center gap-2 text-black">
                  <Phone className="w-4 h-4 text-[#A68868]" />
                  <span className="font-bold">{viewUser.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-black/70 text-[11px]">
                  <Calendar className="w-4 h-4 text-[#A68868]" />
                  <span>Registered on {new Date(viewUser.created_at || Date.now()).toLocaleDateString("en-IN")}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[11px] text-black font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#A68868] shrink-0" />
                <span>Password credentials are encrypted and protected by Supabase Auth security.</span>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setViewUser(null)}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal (No Passwords) */}
      {editUser && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-lg rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Edit User Details</h3>
                  <span className="text-[11px] text-black/70 font-bold">Editing profile attributes (Password restricted)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Admin Security Constraint Warning */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-black flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0 text-amber-700" />
              <span>Admin cannot edit passwords. User passwords remain strictly encrypted.</span>
            </div>

            <div className="space-y-4 text-xs font-black">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.full_name}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Phone Number</label>
                <input
                  type="text"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              {/* Role */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                >
                  <option value="CUSTOMER">CUSTOMER</option>
                  <option value="MANUFACTURER">MANUFACTURER</option>
                  <option value="RETAILER">RETAILER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="BLOCKED">BLOCKED</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-black text-xs hover:bg-[#E3C39D]/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updating}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {updating ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
