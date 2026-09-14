import * as XLSX from "xlsx";

/**
 * CJP Version 2.0 - Manufacturer Product Import Template Specification
 * Defines standard column headers, allowed enum values, validation rules, multi-sheet instructions, and generators.
 */

export const ALLOWED_STATUSES = ["ACTIVE", "INACTIVE", "DRAFT"];
export const ALLOWED_METAL_TYPES = ["GOLD", "SILVER", "PLATINUM", "OTHER"];
export const ALLOWED_MAKING_CHARGE_TYPES = ["PERCENTAGE", "FLAT"];

export const CJP_IMPORT_COLUMNS = [
  { header: "SKU", key: "sku", required: true, example: "RING-GOLD-001", type: "STRING" },
  { header: "Product Name", key: "name", required: true, example: "24K Royal Gold Ring", type: "STRING" },
  { header: "Category", key: "category_name", required: true, example: "Rings", type: "STRING" },
  { header: "Subcategory", key: "subcategory", required: false, example: "Band Rings", type: "STRING" },
  { header: "Metal Type", key: "metal_type", required: true, example: "GOLD", type: "ENUM", allowed: ALLOWED_METAL_TYPES },
  { header: "Purity", key: "purity", required: true, example: "24K", type: "STRING" },
  { header: "Gross Weight", key: "gross_weight", required: true, example: 12.5, type: "NUMBER" },
  { header: "Net Weight", key: "net_weight", required: true, example: 12.0, type: "NUMBER" },
  { header: "Stone Type", key: "stone_type", required: false, example: "Diamond", type: "STRING" },
  { header: "Stone Weight", key: "stone_weight", required: false, example: 0.5, type: "NUMBER" },
  { header: "Making Charge", key: "making_charge", required: false, example: 12.5, type: "NUMBER" },
  { header: "Base Price", key: "base_price", required: true, example: 35000, type: "NUMBER" },
  { header: "Stock Quantity", key: "stock_quantity", required: true, example: 10, type: "NUMBER" },
  { header: "Description", key: "description", required: false, example: "Handcrafted 24K gold ring with fine polish.", type: "STRING" },
  { header: "Status", key: "status", required: true, example: "ACTIVE", type: "ENUM", allowed: ALLOWED_STATUSES },
  { header: "Images", key: "image_filename", required: false, example: "RING-GOLD-001.jpg", type: "STRING" },
];

export const SAMPLE_TEMPLATE_ROWS = [
  {
    sku: "RING-GOLD-001",
    name: "24K Royal Gold Ring",
    category_name: "Rings",
    subcategory: "Band Rings",
    metal_type: "GOLD",
    purity: "24K",
    gross_weight: 12.5,
    net_weight: 12.0,
    stone_type: "Diamond",
    stone_weight: 0.5,
    making_charge: 12.5,
    base_price: 35000,
    stock_quantity: 10,
    description: "Handcrafted 24K gold ring with fine polish.",
    status: "ACTIVE",
    image_filename: "RING-GOLD-001.jpg",
  },
  {
    sku: "NECK-SILV-002",
    name: "Sterling Silver Floral Necklace",
    category_name: "Necklaces",
    subcategory: "Chokers",
    metal_type: "SILVER",
    purity: "925",
    gross_weight: 25.0,
    net_weight: 24.5,
    stone_type: "Emerald",
    stone_weight: 0.5,
    making_charge: 10.0,
    base_price: 18000,
    stock_quantity: 5,
    description: "Classic 925 sterling silver floral pattern necklace.",
    status: "ACTIVE",
    image_filename: "NECK-SILV-002.jpg",
  },
];

/**
 * Step 4.3 — Detailed Instructions Sheet Data
 */
export const INSTRUCTIONS_SHEET_DATA = [
  { Rule: "Rule 1: SKU Uniqueness", Requirement: "SKU must be unique for your manufacturer account. Duplicate SKUs within your account will be rejected." },
  { Rule: "Rule 2: Base Price", Requirement: "Base Price / manufacturer_price must be a positive number greater than 0 (e.g., 35000)." },
  { Rule: "Rule 3: Gross & Net Weight", Requirement: "Gross Weight and Net Weight must be non-negative numbers expressed in grams (e.g., 12.5)." },
  { Rule: "Rule 4: Allowed Statuses", Requirement: "Status must be one of the allowed values: ACTIVE, INACTIVE, DRAFT." },
  { Rule: "Rule 5: Metal Types", Requirement: "Metal Type must be one of the allowed values: GOLD, SILVER, PLATINUM, OTHER." },
  { Rule: "Rule 6: CJP Categories", Requirement: "Category must match an existing CJP store category (e.g. Rings, Necklaces, Earrings, Bracelets, Pendants, Bangles, Anklets)." },
  { Rule: "Rule 7: Making Charges", Requirement: "Making Charge represents making charges as a percentage or flat fee." },
  { Rule: "Rule 8: Multi-Step Upload", Requirement: "File will be uploaded -> validated -> previewed for manufacturer confirmation before final catalog insertion." },
];

/**
 * Step 4.3 — Allowed Values Reference Sheet Data
 */
export const ALLOWED_VALUES_SHEET_DATA = [
  { Field: "Status", Allowed_Values: "ACTIVE, INACTIVE, DRAFT", Note: "Required. Controls catalog visibility." },
  { Field: "Metal Type", Allowed_Values: "GOLD, SILVER, PLATINUM, OTHER", Note: "Required. Primary metal alloy." },
  { Field: "Making Charge Type", Allowed_Values: "PERCENTAGE, FLAT", Note: "Optional. Default: PERCENTAGE." },
  { Field: "CJP Categories", Allowed_Values: "Rings, Necklaces, Earrings, Bracelets, Pendants, Bangles, Anklets", Note: "Required. Must match existing CJP taxonomy." },
];

/**
 * Generates a clean CSV template string for manufacturer bulk upload download
 */
export function generateCSVTemplate() {
  const headers = CJP_IMPORT_COLUMNS.map((col) => `"${col.header}"`).join(",");
  
  const sampleLines = SAMPLE_TEMPLATE_ROWS.map((row) => {
    return CJP_IMPORT_COLUMNS.map((col) => {
      const val = row[col.key] !== undefined && row[col.key] !== null ? row[col.key] : "";
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(",");
  });

  return [headers, ...sampleLines].join("\n");
}

/**
 * Step 4.3 — Generates a Multi-Sheet Excel Workbook Buffer (.xlsx)
 * Sheet 1: Products
 * Sheet 2: Instructions
 * Sheet 3: Allowed Values
 */
export function generateExcelTemplateBuffer() {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Products
  const productsSheetData = SAMPLE_TEMPLATE_ROWS.map((row) => {
    const formattedRow = {};
    CJP_IMPORT_COLUMNS.forEach((col) => {
      formattedRow[col.header] = row[col.key] !== undefined ? row[col.key] : "";
    });
    return formattedRow;
  });
  const wsProducts = XLSX.utils.json_to_sheet(productsSheetData);
  XLSX.utils.book_append_sheet(wb, wsProducts, "Products");

  // Sheet 2: Instructions
  const wsInstructions = XLSX.utils.json_to_sheet(INSTRUCTIONS_SHEET_DATA);
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

  // Sheet 3: Allowed Values
  const wsAllowedValues = XLSX.utils.json_to_sheet(ALLOWED_VALUES_SHEET_DATA);
  XLSX.utils.book_append_sheet(wb, wsAllowedValues, "Allowed Values");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
