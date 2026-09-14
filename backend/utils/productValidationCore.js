import { supabaseAdmin } from "../config/supabase.js";
import { ALLOWED_STATUSES, ALLOWED_METAL_TYPES } from "./importTemplateSpec.js";

/**
 * Shared Product Validation Engine (productValidationCore.js)
 * Enforces business rules, strict enums, category mapping, and SKU uniqueness.
 */
export async function validateProductData(productData, manufacturerId) {
  const errors = [];
  const normalized = { ...productData };

  // 1. Mandatory Field Checks
  if (!productData.sku || !String(productData.sku).trim()) {
    errors.push("SKU / Product Code is required.");
  }
  if (!productData.name || !String(productData.name).trim()) {
    errors.push("Product name is required.");
  }

  // 2. Base Price Validation
  const price = Number(productData.manufacturer_price || productData.base_price || productData.price || 0);
  if (isNaN(price) || price <= 0) {
    errors.push("Base price / manufacturer_price must be a valid positive number.");
  } else {
    normalized.manufacturer_price = price;
  }

  // 3. Status Enum Validation (ACTIVE, INACTIVE, DRAFT)
  const statusInput = (productData.status || "ACTIVE").trim().toUpperCase();
  if (!ALLOWED_STATUSES.includes(statusInput)) {
    errors.push(`Invalid Status '${productData.status}'. Allowed values: ${ALLOWED_STATUSES.join(", ")}.`);
  } else {
    normalized.status = statusInput;
  }

  // 4. Metal Type Enum Validation (GOLD, SILVER, PLATINUM, OTHER)
  const metalInput = (productData.metal_type || "GOLD").trim().toUpperCase();
  if (!ALLOWED_METAL_TYPES.includes(metalInput)) {
    errors.push(`Invalid Metal Type '${productData.metal_type}'. Allowed values: ${ALLOWED_METAL_TYPES.join(", ")}.`);
  } else {
    normalized.metal_type = metalInput;
  }

  // 5. Category Resolution & Validation Against Existing CJP Categories
  let resolvedCategoryId = productData.category_id;
  if (!resolvedCategoryId && productData.category_name) {
    const inputCatName = productData.category_name.trim().toLowerCase();
    
    // Fetch all active system categories from database
    const { data: dbCategories } = await supabaseAdmin
      .from("categories")
      .select("id, name");

    if (dbCategories && dbCategories.length > 0) {
      const matched = dbCategories.find(
        (c) => c.name.toLowerCase() === inputCatName || c.name.toLowerCase().replace(/s$/, "") === inputCatName.replace(/s$/, "")
      );

      if (matched) {
        resolvedCategoryId = matched.id;
        normalized.category_name = matched.name;
      } else {
        const validCatList = dbCategories.map((c) => c.name).join(", ");
        errors.push(`Invalid Category '${productData.category_name}'. Must match an existing CJP category (${validCatList}).`);
      }
    }
  }

  if (!resolvedCategoryId) {
    errors.push("Product category is required and must match an existing CJP category.");
  } else {
    normalized.category_id = resolvedCategoryId;
  }

  // 6. Composite SKU Uniqueness Validation per Manufacturer: UNIQUE(manufacturer_id, sku)
  if (productData.sku && productData.sku.trim()) {
    const skuClean = productData.sku.trim().toUpperCase();
    normalized.sku = skuClean;

    let query = supabaseAdmin
      .from("manufacturer_products")
      .select("id, name, sku")
      .eq("manufacturer_id", manufacturerId)
      .ilike("sku", skuClean);

    if (productData.id) {
      query = query.neq("id", productData.id);
    }

    const { data: existingSku } = await query.maybeSingle();

    if (existingSku) {
      errors.push(`SKU '${skuClean}' already exists for your manufacturer account (Product: "${existingSku.name}").`);
    }
  }

  // 7. Weight & Numeric Range Checks
  const grossWeight = productData.gross_weight != null ? Number(productData.gross_weight) : Number(productData.weight);
  if (grossWeight != null && !isNaN(grossWeight)) {
    if (grossWeight < 0) {
      errors.push("Gross weight cannot be negative.");
    } else {
      normalized.weight = grossWeight;
    }
  }

  // 8. Capture Image Filename / Image URL if provided
  const imageVal = productData.image_filename || productData.images || productData.image || productData.image_url || productData["Images"];
  if (imageVal && typeof imageVal === "string" && imageVal.trim()) {
    const cleanImg = imageVal.trim();
    normalized.image_filename = cleanImg;
    if (cleanImg.startsWith("http://") || cleanImg.startsWith("https://") || cleanImg.startsWith("data:")) {
      normalized.image_url = cleanImg;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalized,
  };
}
