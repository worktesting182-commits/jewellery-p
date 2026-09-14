/**
 * CJP Version 2.0 - Bulk Product Import Configuration (importConfig.js)
 * Configurable limits for file size, row limits, batch processing size, and file type whitelists.
 */

export const PRODUCT_IMPORT_CONFIG = {
  // Configurable File & Row Limits (can be overridden via environment variables)
  MAX_FILE_SIZE_BYTES: parseInt(process.env.IMPORT_MAX_FILE_SIZE || `${10 * 1024 * 1024}`, 10), // 10 MB default
  MAX_ROWS: parseInt(process.env.IMPORT_MAX_ROWS || "1000", 10), // 1000 rows max per file
  BATCH_SIZE: parseInt(process.env.IMPORT_BATCH_SIZE || "100", 10), // 100 rows per batch

  // File Extension & MIME Type Whitelist (.xlsx, .xls, .csv ONLY)
  ALLOWED_EXTENSIONS: [".xlsx", ".xls", ".csv"],
  ALLOWED_MIME_TYPES: [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
    "application/csv",
    "text/plain", // Plaintext CSV fallback
    "text/x-csv",
    "application/x-csv",
  ],

  // Storage Bucket
  IMPORT_STORAGE_BUCKET: "product-imports",
};
