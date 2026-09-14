import * as XLSX from "xlsx";

/**
 * CJP Version 2.0 - Excel / CSV Spreadsheet Parser Utility (excelParser.js)
 * Reads CSV, XLSX, and XLS file buffers, extracts headers, trims strings, converts numbers,
 * and returns clean structured rows with rowNumber metadata.
 */

/**
 * Safely parses string values by trimming whitespace
 */
function cleanString(val) {
  if (val === null || val === undefined) return "";
  return String(val).trim();
}

/**
 * Safely converts input values to valid positive/non-negative numbers
 */
function cleanNumber(val, defaultValue = null) {
  if (val === null || val === undefined || val === "") return defaultValue;
  const num = Number(val);
  return isNaN(num) ? defaultValue : num;
}

/**
 * Maps raw spreadsheet row header variations to standardized product keys
 */
function extractRowData(rawRow, rowNumber) {
  // Extract string values & trim
  const sku = cleanString(rawRow["SKU"] || rawRow["sku"] || rawRow["Sku"] || rawRow["Product Code"] || "");
  const productName = cleanString(rawRow["Product Name"] || rawRow["productName"] || rawRow["name"] || rawRow["Name"] || rawRow["Item Name"] || "");
  const category = cleanString(rawRow["Category"] || rawRow["category"] || rawRow["category_name"] || rawRow["Category Name"] || "");
  const subcategory = cleanString(rawRow["Subcategory"] || rawRow["subcategory"] || "");
  const metalType = cleanString(rawRow["Metal Type"] || rawRow["metalType"] || rawRow["metal_type"] || "GOLD").toUpperCase();
  const purity = cleanString(rawRow["Purity"] || rawRow["purity"] || "24K");
  const stoneType = cleanString(rawRow["Stone Type"] || rawRow["stoneType"] || rawRow["stone_type"] || "");
  const description = cleanString(rawRow["Description"] || rawRow["description"] || "");
  const status = cleanString(rawRow["Status"] || rawRow["status"] || "ACTIVE").toUpperCase();

  // Extract & convert numbers
  const grossWeight = cleanNumber(rawRow["Gross Weight"] || rawRow["grossWeight"] || rawRow["gross_weight"] || rawRow["Weight"] || rawRow["weight"]);
  const netWeight = cleanNumber(rawRow["Net Weight"] || rawRow["netWeight"] || rawRow["net_weight"]);
  const stoneWeight = cleanNumber(rawRow["Stone Weight"] || rawRow["stoneWeight"] || rawRow["stone_weight"]);
  const makingCharge = cleanNumber(rawRow["Making Charge"] || rawRow["makingCharge"] || rawRow["making_charge"]);
  const basePrice = cleanNumber(rawRow["Base Price"] || rawRow["basePrice"] || rawRow["base_price"] || rawRow["Manufacturer Price"] || rawRow["price"] || 0, 0);
  const stockQuantity = cleanNumber(rawRow["Stock Quantity"] || rawRow["stockQuantity"] || rawRow["stock_quantity"] || rawRow["Stock"] || 0, 0);

  return {
    rowNumber,
    sku: sku ? sku.toUpperCase() : "",
    productName,
    name: productName,
    category,
    category_name: category,
    subcategory,
    metalType,
    metal_type: metalType,
    purity,
    grossWeight,
    gross_weight: grossWeight,
    netWeight,
    net_weight: netWeight,
    stoneType,
    stone_type: stoneType,
    stoneWeight,
    stone_weight: stoneWeight,
    makingCharge,
    making_charge: makingCharge,
    basePrice,
    base_price: basePrice,
    manufacturer_price: basePrice,
    stockQuantity,
    stock_quantity: stockQuantity,
    description,
    status: status || "ACTIVE",
  };
}

/**
 * Main Parser Function: Converts CSV/Excel buffer into normalized structured row objects
 * @param {Buffer} fileBuffer - File binary buffer from Multer
 * @param {string} fileName - Original file name
 * @returns {Array<Object>} Array of normalized row objects
 */
export function parseSpreadsheetBuffer(fileBuffer, fileName) {
  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error("Invalid file buffer provided to excelParser.");
  }

  // Parse workbook via SheetJS
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });

  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    throw new Error("Invalid spreadsheet: No worksheets found.");
  }

  // First sheet contains product data ("Products" or Sheet1)
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Worksheet '${sheetName}' could not be loaded.`);
  }

  // Convert sheet to JSON objects with default string fallback
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  // Map & normalize each row
  const normalizedRows = rawRows.map((rawRow, index) => {
    return extractRowData(rawRow, index + 2); // Excel Row 2 is first data row (Row 1 = Headers)
  });

  return normalizedRows;
}
