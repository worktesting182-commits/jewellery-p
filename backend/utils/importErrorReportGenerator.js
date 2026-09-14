/**
 * Utility: Generates CSV string for bulk product import error reports.
 */
export function generateImportErrorReportCSV(errorLogs = []) {
  const csvHeaders = `"Row Number","SKU","Field","Error Message"`;

  const csvRows = errorLogs.map((err) => {
    const rowNum = err.row_number || err.rowNumber || "";
    const sku = (err.sku || "").replace(/"/g, '""');
    const field = (err.field || "validation").replace(/"/g, '""');
    const msg = (err.error_message || err.errorMessage || "").replace(/"/g, '""');
    return `"${rowNum}","${sku}","${field}","${msg}"`;
  });

  return [csvHeaders, ...csvRows].join("\n");
}
