import React, { useState } from "react";
import FormInput from "./FormInput";
import FormSelect from "./FormSelect";
import FormTextarea from "./FormTextarea";
import FormActions from "./FormActions";
import ImageUploader from "./ImageUploader";

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISCONTINUED", label: "Discontinued" },
];

const resolveCategoryId = (catId, catName, cats) => {
  if (!cats || cats.length === 0) return String(catId || "");
  const matchId = cats.find((c) => String(c.id) === String(catId));
  if (matchId) return String(matchId.id);
  if (catName) {
    const matchName = cats.find((c) => String(c.name).toLowerCase() === String(catName).toLowerCase());
    if (matchName) return String(matchName.id);
  }
  return String(cats[0]?.id || catId || "");
};

const sanitizeNumStr = (val) => {
  if (val == null) return "";
  const cleaned = String(val).replace(/[^0-9.]/g, "");
  return cleaned;
};

export default function ProductForm({
  initialData = null,
  categories = [],
  onSubmit,
  onCancel,
  submitting = false,
  isEdit = false,
}) {
  const initialCatId = resolveCategoryId(
    initialData?.category_id || initialData?.categories?.id,
    initialData?.category_name || initialData?.categories?.name || initialData?.category?.name,
    categories
  );

  const [formData, setFormData] = React.useState({
    category_id: String(initialCatId || ""),
    name: initialData?.name || "",
    description: initialData?.description || "",
    material: initialData?.material || "Gold",
    purity: initialData?.purity || "22K",
    weight: initialData?.weight != null ? sanitizeNumStr(initialData.weight) : "",
    price: initialData?.manufacturer_price != null
      ? sanitizeNumStr(initialData.manufacturer_price)
      : (initialData?.price != null ? sanitizeNumStr(initialData.price) : ""),
    stock: initialData?.stock != null ? String(initialData.stock) : "0",
    status: initialData?.status || "ACTIVE",
    image_url: initialData?.image_url || "",
  });

  React.useEffect(() => {
    if (initialData) {
      const catId = resolveCategoryId(
        initialData.category_id || initialData.categories?.id,
        initialData.category_name || initialData.categories?.name || initialData.category?.name,
        categories
      );
      setFormData({
        category_id: String(catId || ""),
        name: initialData.name || "",
        description: initialData.description || "",
        material: initialData.material || "Gold",
        purity: initialData.purity || "22K",
        weight: initialData.weight != null ? sanitizeNumStr(initialData.weight) : "",
        price: initialData.manufacturer_price != null
          ? sanitizeNumStr(initialData.manufacturer_price)
          : (initialData.price != null ? sanitizeNumStr(initialData.price) : ""),
        stock: initialData.stock != null ? String(initialData.stock) : "0",
        status: initialData.status || "ACTIVE",
        image_url: initialData.image_url || "",
      });
    }
  }, [initialData, categories]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleImageChange = (url) => {
    setFormData((prev) => ({ ...prev, image_url: url }));
    if (errors.image_url) {
      setErrors((prev) => ({ ...prev, image_url: null }));
    }
  };

  const handleImageErrorChange = (errMessage) => {
    setErrors((prev) => ({ ...prev, image_url: errMessage }));
  };

  const validate = () => {
    const newErrors = {};

    const catId = formData.category_id || (categories.length > 0 ? String(categories[0].id) : "");
    if (!catId) {
      newErrors.category_id = "Please select a category";
    }

    if (!formData.name?.trim()) {
      newErrors.name = "Product name is required";
    }

    const priceNum = parseFloat(sanitizeNumStr(formData.price));
    if (formData.price === "" || isNaN(priceNum)) {
      newErrors.price = "Price is required";
    } else if (priceNum <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (formData.weight !== "") {
      const weightNum = parseFloat(sanitizeNumStr(formData.weight));
      if (isNaN(weightNum) || weightNum <= 0) {
        newErrors.weight = "Weight must be greater than 0";
      }
    }

    if (formData.stock !== "") {
      const stockNum = parseInt(formData.stock, 10);
      if (isNaN(stockNum) || stockNum < 0) {
        newErrors.stock = "Stock quantity cannot be negative";
      }
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      console.warn("Product form validation failed:", newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const catId = formData.category_id || (categories.length > 0 ? String(categories[0].id) : "");
    const parsedCatId = isNaN(Number(catId)) ? catId : Number(catId);
    const parsedPrice = parseFloat(sanitizeNumStr(formData.price));
    const parsedWeight = formData.weight !== "" ? parseFloat(sanitizeNumStr(formData.weight)) : null;

    const payload = {
      category_id: parsedCatId,
      name: formData.name.trim(),
      description: formData.description?.trim() || "",
      material: formData.material?.trim() || "Gold",
      purity: formData.purity?.trim() || "22K",
      weight: parsedWeight,
      price: parsedPrice,
      manufacturer_price: parsedPrice,
      stock: formData.stock !== "" ? parseInt(formData.stock, 10) : 0,
      status: formData.status || "ACTIVE",
      image_url: formData.image_url || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60",
    };

    onSubmit(payload);
  };

  const categoryOptions = categories.map((cat) => ({
    value: String(cat.id),
    label: cat.name,
  }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Top Grid: Image Upload & Key Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Left Column: Image Uploader */}
        <div className="md:col-span-1">
          <ImageUploader
            value={formData.image_url}
            onChange={handleImageChange}
            error={errors.image_url}
            onErrorChange={handleImageErrorChange}
          />
        </div>

        {/* Right Column: Name, Category, Price */}
        <div className="md:col-span-2 space-y-4">
          <FormInput
            label="Product Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. 22K Gold Diamond Emerald Ring"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormSelect
              label="Category"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              options={categoryOptions}
              error={errors.category_id}
              placeholder="Select Category"
              required
            />

            <FormInput
              label="Price (₹)"
              name="price"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price}
              onChange={handleChange}
              error={errors.price}
              placeholder="e.g. 45000"
              prefix="₹"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormInput
              label="Stock Quantity"
              name="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={handleChange}
              error={errors.stock}
              placeholder="0"
              helperText="Available inventory units"
            />

            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={STATUS_OPTIONS}
              error={errors.status}
            />
          </div>
        </div>
      </div>

      {/* Material & Physical Specifications */}
      <div className="p-5 rounded-2xl bg-[#0B2B26]/30 border border-white/5 space-y-4">
        <h3 className="text-xs font-bold tracking-wider text-[#8EB69B] uppercase flex items-center gap-2">
          <svg className="w-4 h-4 text-[#8EB69B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.6 15.118a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          Material Specifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <FormInput
            label="Material"
            name="material"
            value={formData.material}
            onChange={handleChange}
            error={errors.material}
            placeholder="e.g. Gold, Platinum, Silver"
          />

          <FormInput
            label="Purity / Karat"
            name="purity"
            value={formData.purity}
            onChange={handleChange}
            error={errors.purity}
            placeholder="e.g. 22K, 18K, 950 Platinum"
          />

          <FormInput
            label="Weight (Grams)"
            name="weight"
            type="number"
            step="0.01"
            min="0"
            value={formData.weight}
            onChange={handleChange}
            error={errors.weight}
            placeholder="e.g. 8.5"
            suffix="g"
          />
        </div>
      </div>

      {/* Description */}
      <FormTextarea
        label="Description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        error={errors.description}
        placeholder="Enter detailed description of craftsmanship, gemstone specs, design story..."
        rows={3}
      />

      {/* Action Buttons */}
      <FormActions
        onCancel={onCancel}
        submitting={submitting}
        submitText={isEdit ? "Update Product" : "Create Product"}
        cancelText="Cancel"
      />
    </form>
  );
}
