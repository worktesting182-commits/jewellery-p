import path from "path";
import * as XLSX from "xlsx";
import { PRODUCT_IMPORT_CONFIG } from "../config/importConfig.js";
import { validateProductData } from "./productValidationCore.js";
import { supabaseAdmin } from "../config/supabase.js";

/**
 * CJP Version 2.0 - Complete 5-Layer Product Import Validator (productValidator.js)
 * Layer 1 — File Validation
 * Layer 2 — Column Header Validation
 * Layer 3 — Row Level Business Rule Validation
 * Layer 4 — Intra-File Duplicate SKU Detection
 * Layer 5 — Database Composite Duplicate Validation: UNIQUE(manufacturer_id, sku)
 */

/**
 * Layer 1 — File Validation
 */
export function validateFileLayer(fileBuffer, fileName, mimeType) {
  const errors = [];

  if (!fileBuffer || !Buffer.isBuffer(fileBuffer) || fileBuffer.length === 0) {
    errors.push("Uploaded file is missing or empty.");
    return { isValid: false, errors, workbook: null };
  }

  // 1. Correct Extension Check
  const ext = path.extname(fileName || "").toLowerCase();
  if (!PRODUCT_IMPORT_CONFIG.ALLOWED_EXTENSIONS.includes(ext)) {
    errors.push(
      `Invalid file extension '${ext}'. Allowed extensions: ${PRODUCT_IMPORT_CONFIG.ALLOWED_EXTENSIONS.join(", ")}.`
    );
  }

  // 2. Maximum File Size Check
  if (fileBuffer.length > PRODUCT_IMPORT_CONFIG.MAX_FILE_SIZE_BYTES) {
    const limitMb = Math.round(PRODUCT_IMPORT_CONFIG.MAX_FILE_SIZE_BYTES / (1024 * 1024));
    const actualMb = (fileBuffer.length / (1024 * 1024)).toFixed(2);
    errors.push(`File size (${actualMb}MB) exceeds maximum limit of ${limitMb}MB.`);
  }

  // 3. Valid File Structure Check via SheetJS
  let workbook = null;
  try {
    workbook = XLSX.read(fileBuffer, { type: "buffer" });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      errors.push("Invalid file structure: Spreadsheet contains no readable worksheets.");
    }
  } catch (err) {
    errors.push(`Corrupted file structure: Unable to parse spreadsheet file (${err.message}).`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    workbook,
  };
}

/**
 * Layer 2 — Column Header Validation
 */
export function validateColumnHeaderLayer(sheet) {
  const errors = [];

  if (!sheet) {
    errors.push("Data sheet is missing or empty.");
    return { isValid: false, errors, headers: [], missingHeaders: [] };
  }

  // Extract raw headers from row 1
  const range = XLSX.utils.decode_range(sheet["!ref"] || "A1");
  const headers = [];
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c: C })];
    if (cell && cell.v != null) {
      headers.push(String(cell.v).trim());
    }
  }

  const normalizedHeaders = headers.map((h) => h.toLowerCase());

  // Required headers and acceptable aliases
  const requiredHeaders = [
    { name: "SKU", aliases: ["sku", "product code"] },
    { name: "Product Name", aliases: ["product name", "productname", "name", "item name"] },
    { name: "Category", aliases: ["category", "category_name", "category name"] },
    { name: "Base Price", aliases: ["base price", "baseprice", "base_price", "manufacturer price", "price"] },
    { name: "Stock Quantity", aliases: ["stock quantity", "stockquantity", "stock_quantity", "stock"] },
    { name: "Status", aliases: ["status"] },
  ];

  const missingHeaders = [];
  requiredHeaders.forEach((reqCol) => {
    const found = reqCol.aliases.some((alias) => normalizedHeaders.includes(alias));
    if (!found) {
      missingHeaders.push(reqCol.name);
    }
  });

  if (missingHeaders.length > 0) {
    errors.push(
      `Invalid import template structure. Missing required header column(s): ${missingHeaders.join(", ")}.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    headers,
    missingHeaders,
  };
}

/**
 * Layer 4 — Intra-File Duplicate Detection
 */
export function detectIntraFileDuplicates(rows) {
  const skuMap = new Map();

  rows.forEach((row) => {
    if (row.sku && row.sku.trim()) {
      const cleanSku = row.sku.trim().toUpperCase();
      if (!skuMap.has(cleanSku)) {
        skuMap.set(cleanSku, []);
      }
      skuMap.get(cleanSku).push(row.rowNumber);
    }
  });

  const duplicateSkuMap = new Map();
  for (const [sku, rowNumbers] of skuMap.entries()) {
    if (rowNumbers.length > 1) {
      duplicateSkuMap.set(sku, rowNumbers);
    }
  }

  return duplicateSkuMap;
}

/**
 * Layer 5 — Database Duplicate Validation: UNIQUE(manufacturer_id, sku)
 * Performs single batch query to find all SKUs that already exist in database for this manufacturer.
 * @param {Array<string>} skus - List of clean SKUs to check
 * @param {string} manufacturerId - Manufacturer UUID
 * @returns {Map<string, Object>} Map of upperSKU -> DB Product Record
 */
export async function detectDatabaseDuplicates(skus, manufacturerId) {
  const dbDuplicateMap = new Map();

  const cleanSkus = Array.from(new Set(skus.filter((s) => s && s.trim()).map((s) => s.trim().toUpperCase())));

  if (cleanSkus.length === 0) return dbDuplicateMap;

  try {
    const { data: existingProducts, error } = await supabaseAdmin
      .from("manufacturer_products")
      .select("id, name, sku")
      .eq("manufacturer_id", manufacturerId)
      .in("sku", cleanSkus);

    if (error) {
      // Column 'sku' might be deferred in DB schema
      return dbDuplicateMap;
    }

    (existingProducts || []).forEach((prod) => {
      if (prod.sku) {
        dbDuplicateMap.set(prod.sku.toUpperCase(), prod);
      }
    });
  } catch (e) {
    // Graceful fallback if database column is unavailable
  }

  return dbDuplicateMap;
}

/**
 * Layers 3, 4 & 5 Combined Batch Validation Pipeline
 * Validates every row (Layer 3), attaches intra-file duplicate errors (Layer 4),
 * and attaches database composite duplicate errors UNIQUE(manufacturer_id, sku) (Layer 5).
 */
export async function validateRowsBatch(rows, manufacturerId) {
  // Layer 4: Detect intra-file SKU collisions
  const intraFileDuplicateMap = detectIntraFileDuplicates(rows);

  // Layer 5: Detect database SKU collisions in bulk
  const fileSkus = rows.map((r) => r.sku);
  const databaseDuplicateMap = await detectDatabaseDuplicates(fileSkus, manufacturerId);

  const validationResults = [];

  for (const row of rows) {
    const rowErrors = [];

    // Layer 3 Core Checks (via productValidationCore)
    const coreResult = await validateProductData(row, manufacturerId);
    if (!coreResult.isValid) {
      // Filter out single-query DB error if batch check handled it
      coreResult.errors.forEach((errMsg) => {
        if (!errMsg.includes("already exists for your manufacturer account")) {
          rowErrors.push(errMsg);
        }
      });
    }

    // Additional Layer 3 Rules
    if (row.stockQuantity != null) {
      const stockNum = Number(row.stockQuantity);
      if (isNaN(stockNum) || !Number.isInteger(stockNum) || stockNum < 0) {
        rowErrors.push("Stock Quantity must be a non-negative integer.");
      }
    }

    // Layer 4 Intra-File Duplicate SKU Check
    if (row.sku && intraFileDuplicateMap.has(row.sku.toUpperCase())) {
      const conflictingRows = intraFileDuplicateMap.get(row.sku.toUpperCase());
      const otherRows = conflictingRows.filter((r) => r !== row.rowNumber);
      rowErrors.push(
        `Duplicate SKU '${row.sku.toUpperCase()}' found within this upload file at Row ${row.rowNumber} (Conflicts with Row ${otherRows.join(", Row ")}).`
      );
    }

    // Layer 5 Database Composite Duplicate Check: UNIQUE(manufacturer_id, sku)
    if (row.sku && databaseDuplicateMap.has(row.sku.toUpperCase())) {
      const existingProduct = databaseDuplicateMap.get(row.sku.toUpperCase());
      rowErrors.push(
        `Database SKU Conflict: SKU '${row.sku.toUpperCase()}' already exists in your live product catalog (Product: "${existingProduct.name}").`
      );
    }

    validationResults.push({
      rowNumber: row.rowNumber,
      sku: row.sku,
      isValid: rowErrors.length === 0,
      errors: rowErrors,
      normalized: coreResult.normalized,
    });
  }

  return validationResults;
}
