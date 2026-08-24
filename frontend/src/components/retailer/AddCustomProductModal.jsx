import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Sparkles,
  Upload,
  Coins,
  ShieldCheck,
  Zap,
  Calculator,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
} from "lucide-react";
import { retailerAPI } from "../../services/api";

const AddCustomProductModal = ({ isOpen, onClose, onSuccess, bullionRates }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    category: "Rings",
    description: "",
    material: "Gold",
    purity: "22K",
    weight: "12.5",
    net_weight: "11.8",
    making_charges: "1500",
    pricing_type: "LIVE_DYNAMIC", // LIVE_DYNAMIC or FIXED
    fixed_price: "85000",
    margin_percentage: "15",
    stock: "5",
    bis_hallmark: "BIS-916-2026",
    image_url: "",
    tryon_image_url: "",
    model_3d_url: "",
  });
  const [imageFileMeta, setImageFileMeta] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  // Bullion calculation
  const getRatePerGram = () => {
    if (!bullionRates) return 6640;
    if (formData.material === "Silver") return bullionRates.silver925 || 85;
    if (formData.material === "Platinum") return bullionRates.platinum950 || 3120;
    if (formData.purity === "24K") return bullionRates.gold24k || 7245;
    if (formData.purity === "18K") return bullionRates.gold18k || 5434;
    if (formData.purity === "14K") return bullionRates.gold14k || 4226;
    return bullionRates.gold22k || 6640; // 22K default
  };

  const calculatedBaseMetalCost = Number(formData.net_weight || 0) * getRatePerGram();
  const calculatedMakingCharges = Number(formData.making_charges || 0);
  const rawCost = calculatedBaseMetalCost + calculatedMakingCharges;
  const calculatedMargin = (rawCost * Number(formData.margin_percentage || 0)) / 100;
  const calculatedDynamicPrice = Math.round(rawCost + calculatedMargin);

  const finalPrice =
    formData.pricing_type === "FIXED"
      ? Number(formData.fixed_price || 0)
      : calculatedDynamicPrice;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const processImageFile = (file) => {
    if (!file) return;

    // 1. Format check: PNG, JPG, JPEG, WEBP
    const validExts = ["png", "jpg", "jpeg", "webp"];
    const ext = file.name.split(".").pop().toLowerCase();
    const validMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

    if (!validExts.includes(ext) || (!validMimeTypes.includes(file.type) && file.type !== "")) {
      setImageError("Invalid format. Please upload a PNG, JPG, JPEG, or WEBP image.");
      return;
    }

    // 2. Size limit check: Under 900 KB (900 * 1024 bytes)
    const maxSizeBytes = 900 * 1024;
    if (file.size > maxSizeBytes) {
      const fileSizeKb = (file.size / 1024).toFixed(1);
      setImageError(`File size (${fileSizeKb} KB) exceeds 900 KB limit. Please choose a smaller image under 900 KB.`);
      return;
    }

    setImageError(null);

    // Read as Base64 Data URL
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result;
      setFormData((prev) => ({ ...prev, image_url: dataUrl }));
      setImageFileMeta({
        name: file.name,
        sizeKb: (file.size / 1024).toFixed(1),
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image_url: "" }));
    setImageFileMeta(null);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload = {
        ...formData,
        selling_price: finalPrice,
        weight: Number(formData.weight),
        net_weight: Number(formData.net_weight),
        making_charges: Number(formData.making_charges),
        margin_percentage: Number(formData.margin_percentage),
        stock: Number(formData.stock),
      };

      await retailerAPI.createCustomProduct(payload);
      if (onSuccess) onSuccess(payload);
      onClose();
    } catch (err) {
      console.error("Error adding custom product:", err);
      setError(err.response?.data?.message || "Failed to create custom product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-[#EFEBE4] rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl text-gray-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#EFEBE4] flex items-center justify-between bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C99A2C] flex items-center justify-center text-white shadow-xs">
              <Plus className="w-5 h-5 font-bold" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-gray-900 tracking-wide">
                Add Local / Custom Retailer Product
              </h2>
              <p className="text-xs text-gray-500">
                List non-manufacturer in-house stock into your store catalog
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Step Tabs */}
        <div className="flex border-b border-[#EFEBE4] bg-[#FAF8F5]/60 px-6 pt-3 gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              step === 1
                ? "border-[#C99A2C] text-[#C99A2C]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 1. Product & Media
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              step === 2
                ? "border-[#C99A2C] text-[#C99A2C]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Coins className="w-3.5 h-3.5" /> 2. Metal & Purity
          </button>
          <button
            type="button"
            onClick={() => setStep(3)}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              step === 3
                ? "border-[#C99A2C] text-[#C99A2C]"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" /> 3. Live Pricing Formula
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 bg-white">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Basic Info & Image */}
          {step === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Royal Antique Kundan Choker Necklace"
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#C99A2C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  >
                    <option value="Necklaces">Necklaces</option>
                    <option value="Rings">Rings</option>
                    <option value="Earrings">Earrings</option>
                    <option value="Bangles">Bangles & Bracelets</option>
                    <option value="Pendants">Pendants</option>
                    <option value="Coins">Gold/Silver Coins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    BIS Hallmark Registration
                  </label>
                  <input
                    type="text"
                    name="bis_hallmark"
                    value={formData.bis_hallmark}
                    onChange={handleChange}
                    placeholder="e.g. BIS-916-2026"
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5 flex items-center justify-between">
                  <span>Product Image *</span>
                  <span className="text-[10px] text-gray-500 font-mono">PNG, JPG, WEBP • Max 900 KB</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {formData.image_url ? (
                  <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4]">
                    <img
                      src={formData.image_url}
                      alt="Product Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[#EFEBE4] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {imageFileMeta?.name || "Uploaded Image File"}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Valid Format {imageFileMeta?.sizeKb ? `(${imageFileMeta.sizeKb} KB)` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="p-2 text-gray-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors text-xs font-bold"
                      title="Remove image"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                      dragActive
                        ? "border-[#C99A2C] bg-[#FFF8E7]"
                        : imageError
                        ? "border-rose-400 bg-rose-50/50"
                        : "border-[#E3C39D]/60 hover:border-[#C99A2C] bg-[#FAF8F5]/60 hover:bg-[#FFF8E7]/30"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#E3C39D]/30 text-[#C99A2C] flex items-center justify-center mx-auto mb-2">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-900">
                      Click to upload <span className="text-gray-500 font-normal">or drag & drop</span>
                    </p>
                    <p className="text-[10px] text-gray-500 mt-1">
                      Supported formats: PNG, JPG, JPEG, WEBP (Max 900 KB)
                    </p>
                  </div>
                )}

                {imageError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-2 flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{imageError}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe craftsmanship, stone clarity, occasion wear..."
                  className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#C99A2C]"
                ></textarea>
              </div>
            </div>
          )}

          {/* STEP 2: Metal Specs */}
          {step === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Metal Type
                  </label>
                  <select
                    name="material"
                    value={formData.material}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  >
                    <option value="Gold">Gold</option>
                    <option value="Silver">Silver</option>
                    <option value="Platinum">Platinum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Purity Rating
                  </label>
                  <select
                    name="purity"
                    value={formData.purity}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  >
                    <option value="24K">24K (99.9% Pure)</option>
                    <option value="22K">22K (91.6% Hallmark)</option>
                    <option value="18K">18K (75.0% Fine Gold)</option>
                    <option value="14K">14K (58.5% Gold)</option>
                    <option value="925">925 Sterling Silver</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Gross Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Net Metal Weight (Grams)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    name="net_weight"
                    value={formData.net_weight}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Making Charges (₹ / Flat)
                  </label>
                  <input
                    type="number"
                    name="making_charges"
                    value={formData.making_charges}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-[#FAF8F5] border border-[#EFEBE4] text-gray-900 text-sm focus:outline-none focus:border-[#C99A2C]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Pricing Engine Formula */}
          {step === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Pricing Formula Strategy
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, pricing_type: "LIVE_DYNAMIC" }))
                    }
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      formData.pricing_type === "LIVE_DYNAMIC"
                        ? "border-[#C99A2C] bg-[#FFF8E7] text-gray-900 shadow-xs"
                        : "border-[#EFEBE4] bg-[#FAF8F5] text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[#C99A2C]">
                      <Zap className="w-3.5 h-3.5" /> Live Bullion Dynamic Rate
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Auto-adjusts price when market gold rates change
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setFormData((p) => ({ ...p, pricing_type: "FIXED" }))
                    }
                    className={`p-3.5 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                      formData.pricing_type === "FIXED"
                        ? "border-[#C99A2C] bg-[#FFF8E7] text-gray-900 shadow-xs"
                        : "border-[#EFEBE4] bg-[#FAF8F5] text-gray-500 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5 text-[#C99A2C]">
                      <Coins className="w-3.5 h-3.5" /> Fixed Selling Price
                    </span>
                    <span className="text-[11px] text-gray-500">
                      Specify an absolute static price for this piece
                    </span>
                  </button>
                </div>
              </div>

              {formData.pricing_type === "LIVE_DYNAMIC" ? (
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFEBE4] space-y-3">
                  <div className="flex justify-between text-xs border-b border-[#EFEBE4] pb-2 text-gray-600">
                    <span>Live Market Rate ({formData.purity} {formData.material}):</span>
                    <span className="font-mono text-[#C99A2C] font-bold">₹{getRatePerGram()}/g</span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Net Metal Value ({formData.net_weight}g):</span>
                    <span className="font-mono">₹{calculatedBaseMetalCost.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Making Charges:</span>
                    <span className="font-mono">₹{calculatedMakingCharges.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="pt-2 border-t border-[#EFEBE4]">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="text-gray-700">Retailer Margin (%):</span>
                      <input
                        type="number"
                        name="margin_percentage"
                        value={formData.margin_percentage}
                        onChange={handleChange}
                        className="w-20 px-2 py-1 rounded-lg bg-white border border-[#EFEBE4] text-right text-xs text-[#C99A2C] font-bold"
                      />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#EFEBE4] flex justify-between items-center">
                    <span className="text-sm font-serif font-bold text-gray-900">Calculated Price:</span>
                    <span className="text-xl font-bold font-serif text-[#C99A2C]">
                      ₹{calculatedDynamicPrice.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Fixed Selling Price (₹)
                  </label>
                  <input
                    type="number"
                    name="fixed_price"
                    value={formData.fixed_price}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#EFEBE4] text-gray-900 font-mono text-lg font-bold focus:outline-none focus:border-[#C99A2C]"
                  />
                </div>
              )}
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-[#EFEBE4] flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={() => setStep((s) => s + 1)}
                className="px-6 py-2.5 rounded-xl bg-[#C99A2C] hover:bg-[#B8860B] text-white font-bold text-xs shadow-xs transition-all"
              >
                Next Step →
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-[#C99A2C] hover:bg-[#B8860B] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2"
              >
                {submitting ? "Publishing..." : "Publish Product to Store"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomProductModal;
