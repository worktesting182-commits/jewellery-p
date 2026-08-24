import React, { useState, useRef } from "react";
import api from "../../services/api";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DEFAULT_PLACEHOLDER_IMAGE =
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";

const compressImage = (dataUrl, maxWidth = 1000, quality = 0.88) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => resolve(dataUrl);
  });
};

export default function ImageUploader({
  value,
  onChange,
  error,
  onErrorChange,
}) {
  const [preview, setPreview] = useState(value || DEFAULT_PLACEHOLDER_IMAGE);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  React.useEffect(() => {
    if (value) {
      setPreview(value);
    }
  }, [value]);

  const validateFile = (file) => {
    if (!file) return "Please select an image file";

    // File extension validation
    const extension = file.name.split(".").pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension) || !ALLOWED_MIME_TYPES.includes(file.type)) {
      return "Invalid file format. Allowed types: PNG, JPG, JPEG, WEBP";
    }

    return null;
  };

  const handleFile = async (file) => {
    if (!file) return;

    const validationErr = validateFile(file);
    if (validationErr) {
      if (onErrorChange) onErrorChange(validationErr);
      return;
    }

    if (onErrorChange) onErrorChange(null);

    setUploading(true);

    // Read file as Data URL and upload to Supabase Storage
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const rawDataUrl = reader.result;
        const compressedDataUrl = await compressImage(rawDataUrl, 1000, 0.88);

        setPreview(compressedDataUrl);

        // Upload to Supabase Storage via backend API
        const res = await api.post("/products/upload-image", {
          image_data: compressedDataUrl,
          file_name: file.name,
          file_type: file.type,
        });

        const supabaseUrl = res.data?.url || res.data?.public_url || res.data?.image_url;
        if (supabaseUrl) {
          setPreview(supabaseUrl);
          onChange(supabaseUrl);
        } else {
          onChange(compressedDataUrl);
        }
      } catch (err) {
        console.error("Supabase Storage upload error:", err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview("");
    onChange("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onErrorChange) onErrorChange(null);
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label className="text-xs font-black tracking-wider text-black uppercase">
        Product Image <span className="text-black/60 text-[10px] normal-case">(JPG, JPEG, PNG, WEBP)</span>
      </label>

      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center min-h-[180px] p-4 rounded-3xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
          dragActive
            ? "border-[#A68868] bg-[#E3C39D]/20 scale-[0.99]"
            : error
            ? "border-rose-500 bg-rose-50"
            : "border-[#CDD5DB] bg-white hover:border-[#A68868] hover:bg-[#E3C39D]/10 shadow-xs"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        {preview ? (
          <div className="relative w-full h-44 flex items-center justify-center group">
            <img
              src={preview}
              alt="Product Preview"
              className="max-h-full max-w-full object-contain rounded-2xl shadow-xs"
              onError={() => setPreview(DEFAULT_PLACEHOLDER_IMAGE)}
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 rounded-2xl">
                <svg className="animate-spin h-6 w-6 text-[#A68868]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="text-xs font-black text-black">Uploading image...</span>
              </div>
            )}
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-all opacity-0 group-hover:opacity-100 shadow-md"
              title="Remove image"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <div className="w-12 h-12 rounded-full bg-[#E3C39D]/30 flex items-center justify-center text-[#A68868] mb-3 border border-[#A68868]/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-xs font-bold text-black">
              Drag & drop product image, or <span className="text-[#A68868] underline font-black">browse</span>
            </p>
            <p className="text-[11px] text-black/60 font-bold mt-1">Supports JPG, JPEG, PNG, WEBP (Max 5MB)</p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-600 font-bold flex items-center gap-1 mt-0.5 animate-fadeIn">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
