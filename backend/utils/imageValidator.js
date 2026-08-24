/**
 * Image Upload Validation & Utility Module (Module 3)
 */

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const DEFAULT_PRODUCT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";

/**
 * Validate Image File
 */
export const validateImageFile = (file) => {
  if (!file) {
    return { valid: false, message: "No image file provided" };
  }

  // 1. File Extension & MIME Type Check
  const extension = file.originalname
    ? file.originalname.split(".").pop().toLowerCase()
    : file.name
    ? file.name.split(".").pop().toLowerCase()
    : "";

  const mimeType = file.mimetype || file.type || "";

  if (
    (!ALLOWED_IMAGE_EXTENSIONS.includes(extension) && extension !== "") ||
    (mimeType && !ALLOWED_IMAGE_TYPES.includes(mimeType))
  ) {
    return {
      valid: false,
      message: "Invalid image format. Allowed formats: JPG, PNG, WEBP",
    };
  }

  // 2. Maximum File Size Check (5MB)
  if (file.size && file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      message: `File size (${sizeMb}MB) exceeds maximum limit of 5 MB`,
    };
  }

  return { valid: true };
};

/**
 * Generate Unique Image Filename
 * Format: product_<timestamp>_<uuid>.<ext>
 */
export const generateUniqueFileName = (originalName = "product.jpg") => {
  const extension = originalName.split(".").pop().toLowerCase() || "jpg";
  const sanitizedExt = ALLOWED_IMAGE_EXTENSIONS.includes(extension) ? extension : "jpg";
  const randomUuid = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();

  return `product_${timestamp}_${randomUuid}.${sanitizedExt}`;
};

/**
 * Resolve Image URL with Graceful Default Fallback
 */
export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string" || imageUrl.trim() === "") {
    return DEFAULT_PRODUCT_PLACEHOLDER;
  }
  return imageUrl.trim();
};
