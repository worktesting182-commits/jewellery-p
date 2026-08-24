import React, { useState, useEffect } from "react";
import {
  Layers,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Gem,
  Package,
  X,
  AlertTriangle,
  Lock,
  Sparkles,
} from "lucide-react";
import { categoryAPI } from "../../services/api";
import CategoryTable from "../../components/admin/CategoryTable";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editCategory, setEditCategory] = useState(null);
  const [deleteCategory, setDeleteCategory] = useState(null);

  // Forms
  const [addForm, setAddForm] = useState({ name: "", description: "", image_url: "" });
  const [editForm, setEditForm] = useState({ name: "", description: "", image_url: "" });
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryAPI.getCategories();
      const data = res.data?.data || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Add Category Handler
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.name.trim()) return;

    try {
      setSubmitting(true);
      await categoryAPI.createCategory(addForm);
      showToast(`Category "${addForm.name}" created successfully`);
      setIsAddOpen(false);
      setAddForm({ name: "", description: "", image_url: "" });
      fetchCategories();
    } catch (err) {
      console.error("Error creating category:", err);
      showToast(err.response?.data?.message || "Failed to create category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit Category Handler
  const handleOpenEdit = (cat) => {
    setEditCategory(cat);
    setEditForm({
      name: cat.name || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editCategory || !editForm.name.trim()) return;

    try {
      setSubmitting(true);
      await categoryAPI.updateCategory(editCategory.id, editForm);
      showToast(`Category "${editForm.name}" updated successfully`);
      setEditCategory(null);
      fetchCategories();
    } catch (err) {
      console.error("Error updating category:", err);
      showToast(err.response?.data?.message || "Failed to update category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Category Handler
  const handleDeleteConfirm = async () => {
    if (!deleteCategory) return;

    try {
      setSubmitting(true);
      await categoryAPI.deleteCategory(deleteCategory.id);
      showToast(`Category "${deleteCategory.name}" deleted successfully`);
      setDeleteCategory(null);
      fetchCategories();
    } catch (err) {
      console.error("Error deleting category:", err);
      showToast(err.response?.data?.message || "Failed to delete category", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase())
  );

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
            <Layers className="w-3.5 h-3.5 text-[#A68868]" /> Module 5 – Platform-Wide Taxonomy Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
            Category Management
          </h1>
          <p className="text-xs text-black/70 font-bold max-w-xl">
            Create, update, and manage master jewellery categories used platform-wide by Manufacturers and Retailers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-[#A68868] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search categories..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-xs font-black text-black placeholder-black/40 focus:outline-none focus:border-[#A68868]"
            />
          </div>

          {/* Add Category Button */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all shrink-0 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {/* Admin Privilege Policy Banner */}
      <div className="p-4 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs flex items-start gap-3 text-xs text-black font-bold">
        <div className="p-2 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868] shrink-0">
          <Lock className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <span className="font-black text-black block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#A68868]" /> Platform Admin Authority Rule
          </span>
          <p className="text-black/70 font-bold leading-relaxed">
            Jewellery categories are platform-wide master classification attributes. Only Administrators are authorized to add, edit, or delete categories.
          </p>
        </div>
      </div>

      {/* Categories Grid / List */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-[#A68868] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-black text-black">Loading master jewellery categories...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              className="p-6 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs space-y-4 flex flex-col justify-between hover:border-[#A68868] transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 flex items-center justify-center text-[#A68868]">
                    <Gem className="w-5 h-5 text-[#A68868]" />
                  </div>
                  <span className="px-3.5 py-1 rounded-full bg-[#E3C39D]/40 text-black text-[10px] font-black border border-[#A68868]/40">
                    {cat.products_count || cat.product_count || 0} Products
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-black">{cat.name}</h3>
                  <p className="text-xs text-black/70 font-bold leading-relaxed mt-1 line-clamp-2">
                    {cat.description || "Platform master category classification."}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#CDD5DB] text-xs">
                <span className="text-[10px] text-black/70 font-mono font-bold">
                  ID: {cat.id?.slice(0, 8)}...
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-2 rounded-full bg-white hover:bg-[#E3C39D]/30 border border-[#CDD5DB] text-black transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-[#A68868]" />
                  </button>

                  <button
                    onClick={() => setDeleteCategory(cat)}
                    className="p-2 rounded-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="col-span-full py-16 text-center text-xs font-bold text-black/70 bg-white rounded-3xl border border-[#CDD5DB] space-y-2">
              <Layers className="w-10 h-10 mx-auto text-[#A68868]" />
              <p className="font-black text-black">No categories found.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Category Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-lg rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
                  <Plus className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Add New Category</h3>
                  <span className="text-[11px] text-black/70 font-bold">Master platform classification</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-black">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond Rings, Eco Necklaces"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Description</label>
                <textarea
                  rows={3}
                  placeholder="Enter detailed classification description..."
                  value={addForm.description}
                  onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={addForm.image_url}
                  onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-black text-xs hover:bg-[#E3C39D]/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleEditSubmit}
            className="w-full max-w-lg rounded-3xl bg-white border border-[#CDD5DB] p-6 space-y-6 shadow-xl animate-fadeIn"
          >
            <div className="flex items-center justify-between border-b border-[#CDD5DB] pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-[#E3C39D]/30 border border-[#A68868]/30 text-[#A68868]">
                  <Edit2 className="w-5 h-5 text-[#A68868]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-black">Edit Category</h3>
                  <span className="text-[11px] text-black/70 font-bold">Modify category details</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditCategory(null)}
                className="p-1.5 rounded-full bg-white border border-[#CDD5DB] text-black hover:bg-[#E3C39D]/30"
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            <div className="space-y-4 text-xs font-black">
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Description</label>
                <textarea
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-black uppercase">Image URL</label>
                <input
                  type="url"
                  value={editForm.image_url}
                  onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-full bg-white border border-[#CDD5DB] text-black focus:outline-none focus:border-[#A68868]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditCategory(null)}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-black text-xs hover:bg-[#E3C39D]/30"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-full bg-[#A68868] hover:bg-[#8A6D4F] text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCategory && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-white border border-rose-200 p-6 space-y-5 shadow-xl animate-fadeIn">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-black">Delete Category</h3>
                <span className="text-[11px] text-rose-600 font-bold">Permanent Action</span>
              </div>
            </div>

            <p className="text-xs text-black font-bold leading-relaxed">
              Are you sure you want to delete <strong className="text-black font-black">{deleteCategory.name}</strong>? Products currently under this category will need to be reclassified.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteCategory(null)}
                className="px-4 py-2 rounded-full bg-white border border-[#CDD5DB] text-black font-black text-xs hover:bg-[#E3C39D]/30"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={submitting}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
