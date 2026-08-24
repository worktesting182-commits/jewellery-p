import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import Navbar from "../../components/manufacturer/Navbar";
import Sidebar from "../../components/manufacturer/Sidebar";
import ProductForm from "../../components/manufacturer/ProductForm";
import { ArrowLeft, Loader2 } from "lucide-react";

const DEFAULT_CATEGORIES = [
  { id: 1, name: "Rings" },
  { id: 2, name: "Necklaces" },
  { id: 3, name: "Earrings" },
  { id: 4, name: "Bracelets" },
  { id: 5, name: "Pendants" },
  { id: 6, name: "Bangles" },
  { id: 7, name: "Anklets" },
];

export default function EditProduct() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchCategories();
    if (id) {
      fetchProductDetails(id);
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories");
      const fetched = res.data?.data || res.data || [];
      if (Array.isArray(fetched) && fetched.length > 0) {
        setCategories(fetched);
      } else {
        setCategories(DEFAULT_CATEGORIES);
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setCategories(DEFAULT_CATEGORIES);
    }
  };

  const fetchProductDetails = async (productId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/products/${productId}`);
      const productData = res.data?.data || res.data;
      if (productData) {
        setProduct(productData);
      } else {
        setError("Product not found.");
      }
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError(
        err?.response?.data?.message || "Failed to load product details."
      );
    } finally {
      setLoading(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    try {
      const res = await api.put(`/products/${id}`, payload);

      if (res.status === 200 || res.data?.success) {
        showToast("success", "Product updated successfully!");
        setTimeout(() => {
          navigate("/manufacturer/products");
        }, 1200);
      } else {
        showToast("error", res.data?.message || "Failed to update product");
      }
    } catch (err) {
      console.error("Error updating product:", err);
      const errMsg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update product. Please try again.";
      showToast("error", errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/manufacturer/products");
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-black">
      <Navbar />
      <div className="flex">
        <div className="hidden md:block">
          <Sidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl">
          {/* Toast Notification */}
          {toast && (
            <div className="fixed top-6 right-6 z-50 animate-bounce">
              <div
                className={`px-5 py-3.5 rounded-2xl shadow-xl border flex items-center gap-3 text-xs font-black ${
                  toast.type === "success"
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300"
                    : "bg-rose-50 text-rose-950 border-rose-300"
                }`}
              >
                {toast.type === "success" ? (
                  <svg className="w-5 h-5 flex-shrink-0 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 flex-shrink-0 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span>{toast.message}</span>
              </div>
            </div>
          )}

          {/* Top Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 text-xs font-black text-[#A68868] hover:text-black transition-colors mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Products
              </button>
              <h1 className="text-2xl sm:text-3xl font-black text-black tracking-tight">
                Edit Product
              </h1>
              <p className="text-xs text-black/70 font-bold">
                Modify details, stock, pricing, or eco credentials for this item.
              </p>
            </div>
          </div>

          {/* Loading or Form State */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 rounded-3xl bg-white border border-[#CDD5DB] shadow-xs">
              <Loader2 className="w-8 h-8 text-[#A68868] animate-spin mb-3" />
              <p className="text-xs font-black text-black">Loading product details...</p>
            </div>
          ) : error ? (
            <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-center">
              <p className="text-rose-900 text-sm font-black mb-4">{error}</p>
              <button
                onClick={() => navigate("/manufacturer/products")}
                className="px-5 py-2.5 rounded-full bg-[#A68868] text-xs font-black text-white hover:bg-[#8A6D4F]"
              >
                Return to Products
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-[#CDD5DB] p-6 sm:p-8 shadow-xs">
              <ProductForm
                initialData={product}
                categories={categories}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                submitting={submitting}
                isEdit={true}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
