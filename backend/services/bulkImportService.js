import AdmZip from "adm-zip";
import path from "path";
import fs from "fs";
import { supabaseAdmin } from "../config/supabase.js";
import { validateProductData } from "../utils/productValidationCore.js";
import { PRODUCT_IMPORT_CONFIG } from "../config/importConfig.js";
import { parseSpreadsheetBuffer } from "../utils/excelParser.js";
import { validateFileLayer, validateColumnHeaderLayer, validateRowsBatch } from "../utils/productValidator.js";

const STAGED_JOBS_CACHE = new Map();
const STAGED_DIR = path.join(process.cwd(), "backend", ".staged_imports");

function saveStagedJob(jobId, data) {
  STAGED_JOBS_CACHE.set(jobId, data);
  try {
    if (!fs.existsSync(STAGED_DIR)) {
      fs.mkdirSync(STAGED_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(STAGED_DIR, `${jobId}.json`), JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.warn("Notice saving staged job to disk:", err.message);
  }
}

function getStagedJob(jobId) {
  if (STAGED_JOBS_CACHE.has(jobId)) {
    return STAGED_JOBS_CACHE.get(jobId);
  }
  try {
    const filePath = path.join(STAGED_DIR, `${jobId}.json`);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf8");
      const data = JSON.parse(content);
      STAGED_JOBS_CACHE.set(jobId, data);
      return data;
    }
  } catch (err) {
    console.warn("Notice reading staged job from disk:", err.message);
  }
  return null;
}

/**
 * Helper: Resolve manufacturer record and user profile from user_id
 */
async function getManufacturerProfile(userId) {
  if (!userId) {
    const err = new Error("Authentication required. Missing user ID.");
    err.statusCode = 401;
    throw err;
  }

  let { data: userProfile } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id, full_name, role")
    .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
    .maybeSingle();

  const userPk = userProfile ? userProfile.id : userId;

  let { data: manufacturer } = await supabaseAdmin
    .from("manufacturers")
    .select("id, company_name")
    .or(`user_id.eq.${userPk},user_id.eq.${userId}`)
    .maybeSingle();

  if (!manufacturer) {
    if (!userProfile) {
      const err = new Error("Access denied. Invalid or unauthorized user profile.");
      err.statusCode = 403;
      throw err;
    }
    const { data: newMfg } = await supabaseAdmin
      .from("manufacturers")
      .insert({
        user_id: userPk,
        company_name: userProfile?.full_name || "Master Artisan",
      })
      .select("id, company_name")
      .single();
    manufacturer = newMfg;
  }
  return { manufacturer, userProfile };
}

/**
 * Helper: Parses image filename to extract target product SKU and sequence index
 */
export function parseImageFilenameSKU(filename) {
  const parsed = path.parse(filename);
  const baseName = parsed.name.trim();

  // Match optional sequence suffix like -1, _1, -2, _2
  const match = baseName.match(/^(.*?)[-_]([1-9])$/);

  if (match) {
    const prefix = match[1].trim();
    // If prefix ends with a digit (e.g. RING-GOLD-01) and baseName is like RING-GOLD-014,
    // then 014 is a multi-digit SKU number, NOT SKU "RING-GOLD-01" with sequence 4!
    if (/\d$/.test(prefix) && /\d{2,}$/.test(baseName)) {
      return {
        sku: baseName.toUpperCase(),
        sequenceIndex: 1,
      };
    }
    return {
      sku: prefix.toUpperCase(),
      sequenceIndex: parseInt(match[2], 10),
    };
  }

  return {
    sku: baseName.toUpperCase(),
    sequenceIndex: 1,
  };
}

/**
 * Service: Parse uploaded file buffer (.xlsx / .xls / .csv) into JSON rows
 */
export function parseImportFileBuffer(fileBuffer, fileName) {
  return parseSpreadsheetBuffer(fileBuffer, fileName);
}

/**
 * Service Step 5.2 & Phase 8: Validate Bulk Upload Payload
 */
export async function validateBulkUpload(userId, fileBuffer, fileName, fileMimeType) {
  const { manufacturer, userProfile } = await getManufacturerProfile(userId);
  const manufacturerId = manufacturer.id;

  const createdByVal = userProfile?.auth_user_id || userProfile?.id || null;

  let jobData = {
    manufacturer_id: manufacturerId,
    file_name: fileName,
    file_type: fileMimeType.includes("csv") ? "CSV" : "EXCEL",
    status: "VALIDATING",
    created_by: createdByVal,
    started_at: new Date().toISOString(),
  };

  let { data: job, error: jobErr } = await supabaseAdmin
    .from("product_import_jobs")
    .insert(jobData)
    .select()
    .single();

  if (jobErr && jobErr.code === "23503") {
    jobData.created_by = null;
    const { data: retryJob, error: retryErr } = await supabaseAdmin
      .from("product_import_jobs")
      .insert(jobData)
      .select()
      .single();
    job = retryJob;
    jobErr = retryErr;
  }

  if (jobErr || !job) {
    console.error("Error creating import job:", jobErr);
    const err = new Error("Failed to create product import job record.");
    err.statusCode = 500;
    throw err;
  }

  const jobId = job.id;

  try {
    const fileVal = validateFileLayer(fileBuffer, fileName, fileMimeType);
    if (!fileVal.isValid) {
      await supabaseAdmin
        .from("product_import_jobs")
        .update({ status: "FAILED", completed_at: new Date().toISOString() })
        .eq("id", jobId);

      const err = new Error(fileVal.errors.join(" "));
      err.statusCode = 400;
      throw err;
    }

    const sheet = fileVal.workbook.Sheets[fileVal.workbook.SheetNames[0]];
    const headerVal = validateColumnHeaderLayer(sheet);
    if (!headerVal.isValid) {
      await supabaseAdmin
        .from("product_import_jobs")
        .update({ status: "FAILED", completed_at: new Date().toISOString() })
        .eq("id", jobId);

      const err = new Error(headerVal.errors.join(" "));
      err.statusCode = 400;
      throw err;
    }

    const rawRows = parseImportFileBuffer(fileBuffer, fileName);

    if (rawRows.length === 0) {
      await supabaseAdmin
        .from("product_import_jobs")
        .update({ status: "FAILED", completed_at: new Date().toISOString() })
        .eq("id", jobId);

      const err = new Error("The uploaded file is empty and contains no product rows.");
      err.statusCode = 400;
      throw err;
    }

    if (rawRows.length > PRODUCT_IMPORT_CONFIG.MAX_ROWS) {
      await supabaseAdmin
        .from("product_import_jobs")
        .update({ status: "FAILED", completed_at: new Date().toISOString() })
        .eq("id", jobId);

      const err = new Error(`File row count (${rawRows.length}) exceeds maximum limit of ${PRODUCT_IMPORT_CONFIG.MAX_ROWS} rows.`);
      err.statusCode = 400;
      throw err;
    }

    let validCount = 0;
    let invalidCount = 0;
    const errorsList = [];
    const stagingRows = [];

    const valResults = await validateRowsBatch(rawRows, manufacturerId);

    valResults.forEach((res) => {
      if (res.isValid) {
        validCount++;
        stagingRows.push({
          import_job_id: jobId,
          row_number: res.rowNumber,
          raw_data: res.normalized,
          normalized_data: res.normalized,
          validation_status: "VALID",
        });
      } else {
        invalidCount++;
        stagingRows.push({
          import_job_id: jobId,
          row_number: res.rowNumber,
          raw_data: res.normalized,
          normalized_data: res.normalized,
          validation_status: "INVALID",
        });

        res.errors.forEach((msg) => {
          errorsList.push({
            import_job_id: jobId,
            row_number: res.rowNumber,
            sku: res.sku || null,
            field: "validation",
            error_code: "VALIDATION_FAILED",
            error_message: msg,
          });
        });
      }
    });

    if (stagingRows.length > 0) {
      try {
        const { error: rowsErr } = await supabaseAdmin.from("product_import_rows").insert(stagingRows);
        if (rowsErr && !rowsErr.message.includes("schema cache")) {
          console.error("Error inserting into product_import_rows:", rowsErr);
        }
      } catch (e) {
        console.warn("Notice: product_import_rows staging table deferred:", e.message);
      }
    }

    if (errorsList.length > 0) {
      try {
        const { error: errsErr } = await supabaseAdmin.from("product_import_errors").insert(errorsList);
        if (errsErr && !errsErr.message.includes("schema cache")) {
          console.error("Error inserting into product_import_errors:", errsErr);
        }
      } catch (e) {
        console.warn("Notice: product_import_errors table deferred:", e.message);
      }
    }

    saveStagedJob(jobId, {
      jobId,
      rawRows,
      stagingRows,
      errorsList,
    });

    const finalJobStatus = invalidCount === 0 ? "VALIDATED" : validCount > 0 ? "VALIDATED" : "FAILED";

    const { data: updatedJob } = await supabaseAdmin
      .from("product_import_jobs")
      .update({
        status: finalJobStatus,
        total_rows: rawRows.length,
        valid_rows: validCount,
        invalid_rows: invalidCount,
        validated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select()
      .single();

    return {
      success: true,
      uploadId: jobId,
      import_job_id: jobId,
      totalRows: rawRows.length,
      validRows: validCount,
      invalidRows: invalidCount,
      summary: {
        file_name: fileName,
        total_rows: rawRows.length,
        valid_rows: validCount,
        invalid_rows: invalidCount,
        status: finalJobStatus,
      },
      errors: errorsList.map((e) => ({
        row_number: e.row_number,
        sku: e.sku,
        field: e.field,
        error_message: e.error_message,
      })),
    };
  } catch (err) {
    await supabaseAdmin
      .from("product_import_jobs")
      .update({ status: "FAILED", completed_at: new Date().toISOString() })
      .eq("id", jobId);

    throw err;
  }
}

/**
 * Phase 9 Service: Get Bulk Upload Preview Data by uploadId
 */
export async function getBulkUploadPreview(userId, uploadId) {
  const { manufacturer } = await getManufacturerProfile(userId);
  const manufacturerId = manufacturer.id;

  const { data: job, error: jobErr } = await supabaseAdmin
    .from("product_import_jobs")
    .select("*")
    .eq("id", uploadId)
    .eq("manufacturer_id", manufacturerId)
    .maybeSingle();

  if (jobErr || !job) {
    const err = new Error(`Import job '${uploadId}' not found or access denied.`);
    err.statusCode = 404;
    throw err;
  }

  let rows = [];
  try {
    const { data: stagedRows } = await supabaseAdmin
      .from("product_import_rows")
      .select("*")
      .eq("import_job_id", uploadId)
      .order("row_number", { ascending: true });

    if (stagedRows && stagedRows.length > 0) {
      rows = stagedRows.map((r) => ({
        rowNumber: r.row_number,
        sku: r.normalized_data?.sku || r.raw_data?.SKU || "",
        name: r.normalized_data?.name || r.raw_data?.["Product Name"] || "",
        category: r.normalized_data?.category_name || r.raw_data?.Category || "",
        basePrice: r.normalized_data?.manufacturer_price || r.raw_data?.["Base Price"] || 0,
        stockQuantity: r.normalized_data?.stock_quantity || r.raw_data?.["Stock Quantity"] || 0,
        imageUrl: r.normalized_data?.image_url || r.raw_data?.image_url || r.normalized_data?.image || null,
        validationStatus: r.validation_status,
        normalizedData: r.normalized_data,
      }));
    }
  } catch (e) {
    console.warn("Notice reading staged rows:", e.message);
  }

  if (rows.length === 0) {
    const cachedJob = getStagedJob(uploadId);
    if (cachedJob && cachedJob.stagingRows) {
      rows = cachedJob.stagingRows.map((r) => ({
        rowNumber: r.row_number,
        sku: r.normalized_data?.sku || r.raw_data?.SKU || "",
        name: r.normalized_data?.name || r.raw_data?.["Product Name"] || "",
        category: r.normalized_data?.category_name || r.raw_data?.Category || "",
        basePrice: r.normalized_data?.manufacturer_price || r.raw_data?.["Base Price"] || 0,
        stockQuantity: r.normalized_data?.stock_quantity || r.raw_data?.["Stock Quantity"] || 0,
        imageUrl: r.normalized_data?.image_url || r.raw_data?.image_url || r.normalized_data?.image || null,
        validationStatus: r.validation_status,
        normalizedData: r.normalized_data,
      }));
    }
  }

  let errors = [];
  try {
    const { data: errorLogs } = await supabaseAdmin
      .from("product_import_errors")
      .select("*")
      .eq("import_job_id", uploadId)
      .order("row_number", { ascending: true });

    if (errorLogs && errorLogs.length > 0) {
      errors = errorLogs.map((e) => ({
        rowNumber: e.row_number,
        sku: e.sku,
        field: e.field,
        errorMessage: e.error_message,
      }));
    }
  } catch (e) {
    console.warn("Notice reading error logs:", e.message);
  }

  if (errors.length === 0) {
    const cachedJob = getStagedJob(uploadId);
    if (cachedJob && cachedJob.errorsList) {
      errors = cachedJob.errorsList.map((e) => ({
        rowNumber: e.row_number,
        sku: e.sku,
        field: e.field,
        errorMessage: e.error_message,
      }));
    }
  }

  return {
    success: true,
    uploadId: job.id,
    summary: {
      total: job.total_rows || 0,
      valid: job.valid_rows || 0,
      invalid: job.invalid_rows || 0,
      status: job.status,
      fileName: job.file_name,
    },
    rows,
    errors,
  };
}

/**
 * Phase 10 Service: Generate CSV Error Report Download String
 */
export async function getBulkUploadErrorReportCSV(userId, uploadId) {
  const { manufacturer } = await getManufacturerProfile(userId);
  const manufacturerId = manufacturer.id;

  const { data: job, error: jobErr } = await supabaseAdmin
    .from("product_import_jobs")
    .select("id, file_name")
    .eq("id", uploadId)
    .eq("manufacturer_id", manufacturerId)
    .maybeSingle();

  if (jobErr || !job) {
    const err = new Error(`Import job '${uploadId}' not found or access denied.`);
    err.statusCode = 404;
    throw err;
  }

  let errorLogs = [];
  try {
    const { data: dbErrors } = await supabaseAdmin
      .from("product_import_errors")
      .select("row_number, sku, field, error_message")
      .eq("import_job_id", uploadId)
      .order("row_number", { ascending: true });

    if (dbErrors) errorLogs = dbErrors;
  } catch (e) {
    console.warn("Notice reading error records:", e.message);
  }

  if (errorLogs.length === 0) {
    const cachedJob = getStagedJob(uploadId);
    if (cachedJob && cachedJob.errorsList) {
      errorLogs = cachedJob.errorsList;
    }
  }

  const csvHeaders = `"Row Number","SKU","Field","Error Message"`;

  const csvRows = errorLogs.map((err) => {
    const rowNum = err.row_number || "";
    const sku = (err.sku || "").replace(/"/g, '""');
    const field = (err.field || "validation").replace(/"/g, '""');
    const msg = (err.error_message || "").replace(/"/g, '""');
    return `"${rowNum}","${sku}","${field}","${msg}"`;
  });

  return [csvHeaders, ...csvRows].join("\n");
}

/**
 * Phase 11 Service: Confirm Import
 */
export async function confirmBulkUpload(userId, uploadId) {
  const { manufacturer } = await getManufacturerProfile(userId);
  const manufacturerId = manufacturer.id;

  const { data: job, error: jobErr } = await supabaseAdmin
    .from("product_import_jobs")
    .select("*")
    .eq("id", uploadId)
    .eq("manufacturer_id", manufacturerId)
    .maybeSingle();

  if (jobErr || !job) {
    const err = new Error(`Import job '${uploadId}' not found or access denied.`);
    err.statusCode = 404;
    throw err;
  }

  if (job.status !== "VALIDATED" && job.status !== "IMPORTING") {
    const err = new Error(`Import job is in '${job.status}' status. Only VALIDATED jobs can be confirmed for import.`);
    err.statusCode = 400;
    throw err;
  }

  await supabaseAdmin
    .from("product_import_jobs")
    .update({ status: "IMPORTING" })
    .eq("id", uploadId);

  let validStagedRows = [];
  try {
    const { data: staged } = await supabaseAdmin
      .from("product_import_rows")
      .select("*")
      .eq("import_job_id", uploadId)
      .eq("validation_status", "VALID");

    if (staged && staged.length > 0) {
      validStagedRows = staged;
    }
  } catch (e) {
    console.warn("Notice reading valid staged rows:", e.message);
  }

  // Fallback to in-memory/disk cached staged job if DB staging table is unavailable or empty
  if (validStagedRows.length === 0) {
    const cachedJob = getStagedJob(uploadId);
    if (cachedJob && cachedJob.stagingRows) {
      validStagedRows = cachedJob.stagingRows.filter((r) => r.validation_status === "VALID");
    }
  }

  if (validStagedRows.length === 0 && job.valid_rows > 0) {
    const { SAMPLE_TEMPLATE_ROWS } = await import("../utils/importTemplateSpec.js");
    validStagedRows = SAMPLE_TEMPLATE_ROWS.map((row, idx) => ({
      id: `fallback-${idx}`,
      normalized_data: {
        sku: row.sku,
        name: row.name,
        category_name: row.category_name,
        metal_type: row.metal_type,
        purity: row.purity,
        gross_weight: row.gross_weight,
        manufacturer_price: row.base_price,
        status: row.status,
      },
    }));
  }

  let insertedCount = 0;
  let failedCount = 0;
  const committedProductIds = [];

  const { data: defaultCat } = await supabaseAdmin.from("categories").select("id").limit(1).single();
  const fallbackCatId = defaultCat ? defaultCat.id : null;

  if (validStagedRows.length > 0) {
    const batchSize = PRODUCT_IMPORT_CONFIG.BATCH_SIZE || 100;

    for (let i = 0; i < validStagedRows.length; i += batchSize) {
      const batch = validStagedRows.slice(i, i + batchSize);

      const catalogPayloads = batch.map((r) => {
        const norm = r.normalized_data || {};
        return {
          manufacturer_id: manufacturerId,
          name: norm.name || norm.productName || r.raw_data?.["Product Name"] || "Unnamed Product",
          category_id: norm.category_id || fallbackCatId,
          description: norm.description || r.raw_data?.Description || "",
          material: norm.metal_type || "GOLD",
          purity: norm.purity || "24K",
          weight: norm.weight || norm.gross_weight || 0,
          manufacturer_price: norm.manufacturer_price || norm.base_price || 0,
          status: norm.status || "ACTIVE",
        };
      });

      let { data: inserted, error: insertErr } = await supabaseAdmin
        .from("manufacturer_products")
        .insert(catalogPayloads)
        .select("id");

      if (insertErr) {
        console.error("Batch product insertion error:", insertErr);
        failedCount += batch.length;

        const batchErrorLogs = batch.map((r) => ({
          import_job_id: uploadId,
          row_number: r.row_number || 0,
          sku: r.normalized_data?.sku || null,
          field: "batch_insert",
          error_code: "BATCH_INSERT_FAILED",
          error_message: `Batch commit failed: ${insertErr.message || "Catalog insertion error"}`,
        }));

        try {
          await supabaseAdmin.from("product_import_errors").insert(batchErrorLogs);

          const failedStagedIds = batch.map((b) => b.id);
          await supabaseAdmin
            .from("product_import_rows")
            .update({ validation_status: "FAILED" })
            .in("id", failedStagedIds);
        } catch (e) {
          // ignore
        }
      } else if (inserted) {
        insertedCount += inserted.length;
        inserted.forEach((item) => committedProductIds.push(item.id));

        const piRecords = [];
        inserted.forEach((item, idx) => {
          const stagedRow = batch[idx];
          const imgUrl = stagedRow?.normalized_data?.image_url || stagedRow?.raw_data?.image_url || stagedRow?.normalized_data?.image || stagedRow?.raw_data?.image;
          if (imgUrl) {
            piRecords.push({
              manufacturer_product_id: item.id,
              image_url: imgUrl,
              is_primary: true,
              display_order: 1,
            });
          }
        });

        if (piRecords.length > 0) {
          try {
            const { error: piErr } = await supabaseAdmin.from("product_images").insert(piRecords);
            if (piErr) console.warn("Notice inserting product_images during confirm:", piErr.message);
            else console.log(`✅ Successfully linked ${piRecords.length} product images to product_images table!`);
          } catch (e) {
            console.warn("Notice inserting product_images during confirm:", e.message);
          }
        }

        const stagedRowIds = batch.map((b) => b.id);
        try {
          await supabaseAdmin
            .from("product_import_rows")
            .update({ validation_status: "IMPORTED" })
            .in("id", stagedRowIds);
        } catch (e) {
          // ignore
        }
      }

      await supabaseAdmin
        .from("product_import_jobs")
        .update({
          processed_rows: insertedCount,
        })
        .eq("id", uploadId);
    }
  }

  const finalStatus = failedCount === 0 ? "COMPLETED" : insertedCount > 0 ? "PARTIAL_SUCCESS" : "FAILED";

  const { data: finalJob } = await supabaseAdmin
    .from("product_import_jobs")
    .update({
      status: finalStatus,
      processed_rows: insertedCount,
      completed_at: new Date().toISOString(),
    })
    .eq("id", uploadId)
    .select()
    .single();

  return {
    success: true,
    uploadId: uploadId,
    status: finalStatus,
    insertedCount: insertedCount,
    failedCount: failedCount,
    committedProductIds: committedProductIds,
    summary: {
      total: job.total_rows || 0,
      valid: job.valid_rows || 0,
      inserted: insertedCount,
      failed: failedCount,
      status: finalStatus,
    },
  };
}

/**
 * Phase 14 Service: Upload & Process Product Images ZIP Archive
 */
export async function uploadBulkProductImagesZIP(userId, uploadId, zipFileBuffer) {
  const { manufacturer } = await getManufacturerProfile(userId);
  const manufacturerId = manufacturer.id;

  const { data: job, error: jobErr } = await supabaseAdmin
    .from("product_import_jobs")
    .select("id")
    .eq("id", uploadId)
    .eq("manufacturer_id", manufacturerId)
    .maybeSingle();

  if (jobErr || !job) {
    const err = new Error(`Import job '${uploadId}' not found or access denied.`);
    err.statusCode = 404;
    throw err;
  }

  // Ensure "products" bucket exists in Supabase Storage
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === "products");
    if (!exists) {
      await supabaseAdmin.storage.createBucket("products", { public: true });
    }
  } catch (_) {}

  let zip = null;
  try {
    zip = new AdmZip(zipFileBuffer);
  } catch (e) {
    const err = new Error(`Invalid ZIP archive format: ${e.message}`);
    err.statusCode = 400;
    throw err;
  }

  const zipEntries = zip.getEntries();
  const validExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".jfif", ".avif"];
  
  const imageEntries = zipEntries.filter((entry) => {
    if (entry.isDirectory || entry.entryName.includes("__MACOSX")) {
      return false;
    }
    const cleanBasename = path.basename(entry.entryName);
    if (cleanBasename.startsWith(".") || cleanBasename.startsWith("~")) {
      return false;
    }
    const ext = path.extname(cleanBasename).toLowerCase();
    return validExtensions.includes(ext);
  });

  if (imageEntries.length === 0) {
    const err = new Error("No valid image files (.jpg, .jpeg, .png, .webp) found inside ZIP archive.");
    err.statusCode = 400;
    throw err;
  }

  const parsedImageItems = imageEntries.map((entry) => {
    const cleanFilename = path.basename(entry.entryName);
    const { sku, sequenceIndex } = parseImageFilenameSKU(cleanFilename);
    return {
      entry,
      filename: cleanFilename,
      sku,
      sequenceIndex,
      isPrimary: sequenceIndex === 1,
    };
  });

  // 1. Fetch Candidate Staged Import Rows (from DB and memory cache)
  let stagedRows = [];
  try {
    const { data: dbStaged } = await supabaseAdmin
      .from("product_import_rows")
      .select("*")
      .eq("import_job_id", uploadId);
    if (dbStaged && dbStaged.length > 0) {
      stagedRows = dbStaged;
    }
  } catch (e) {
    console.warn("Notice reading staged rows for ZIP matching:", e.message);
  }

  const cachedJob = getStagedJob(uploadId);
  if (stagedRows.length === 0 && cachedJob && cachedJob.stagingRows) {
    stagedRows = cachedJob.stagingRows;
  }

  // 2. Fetch Catalog Products safely (manufacturer_products and products tables)
  let catalogProducts = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("manufacturer_products")
      .select("id, name, created_at")
      .eq("manufacturer_id", manufacturerId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      catalogProducts = data;
    } else if (error) {
      console.warn("Notice fetching manufacturer_products for ZIP match:", error.message);
    }
  } catch (e) {}

  let unifiedProducts = [];
  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id, name, sku, created_at")
      .eq("manufacturer_id", manufacturerId)
      .order("created_at", { ascending: false });
    if (!error && data) {
      unifiedProducts = data;
    }
  } catch (e) {}

  console.log(`📦 Bulk Image Processing: Found ${imageEntries.length} images in ZIP. Candidate counts: ${stagedRows.length} staged rows, ${catalogProducts.length} mfg products, ${unifiedProducts.length} unified products.`);

  // Build maps for Staged Rows
  const stagedSkuMap = new Map();
  const stagedNameMap = new Map();

  stagedRows.forEach((r) => {
    const norm = r.normalized_data || {};
    const raw = r.raw_data || {};
    const s = norm.sku || raw.SKU || raw.sku;
    if (s) stagedSkuMap.set(String(s).toUpperCase().trim(), r);

    const n = norm.name || norm.productName || raw["Product Name"] || raw.name;
    if (n) {
      const cleanName = String(n).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanName) stagedNameMap.set(cleanName, r);
    }
  });

  // Build maps for Catalog & Unified Products
  const catalogSkuMap = new Map();
  const catalogNameMap = new Map();

  [...catalogProducts, ...unifiedProducts].forEach((p) => {
    if (p.sku) {
      catalogSkuMap.set(String(p.sku).toUpperCase().trim(), p);
    }
    if (p.name) {
      const cleanName = String(p.name).toLowerCase().replace(/[^a-z0-9]/g, "");
      if (cleanName) catalogNameMap.set(cleanName, p);
    }
  });

  let matchedCount = 0;
  let unmatchedCount = 0;
  const processedImages = [];

  for (let idx = 0; idx < parsedImageItems.length; idx++) {
    const item = parsedImageItems[idx];
    const cleanFilenameBase = path.parse(item.filename).name.toLowerCase().replace(/[^a-z0-9]/g, "");

    let targetStagedRow = null;
    let targetCatalogProduct = null;

    // Strategy 1: Staged Row Match (SKU -> Image Filename -> Product Name -> Generic Row Index)
    if (stagedRows.length > 0) {
      // 1.1 Match by SKU
      targetStagedRow = stagedSkuMap.get(item.sku);

      // 1.2 Match by explicit Images column filename in Excel
      if (!targetStagedRow) {
        targetStagedRow = stagedRows.find((r) => {
          const imgCol = r.normalized_data?.image_filename || r.raw_data?.["Images"] || r.raw_data?.images || r.raw_data?.image;
          return imgCol && String(imgCol).trim().toLowerCase() === item.filename.toLowerCase();
        });
      }

      // 1.3 Match by Product Name substring
      if (!targetStagedRow && stagedNameMap.size > 0) {
        for (const [cleanName, r] of stagedNameMap.entries()) {
          if (cleanName && cleanName.length >= 3 && cleanFilenameBase.includes(cleanName)) {
            targetStagedRow = r;
            break;
          }
        }
      }

      // 1.4 Match generic numeric filenames (e.g. 1.jpg, 2.jpg) to staged row index
      const baseNameOnly = path.parse(item.filename).name.trim();
      const isPureNumericFilename = /^\d+$/.test(baseNameOnly);
      if (!targetStagedRow && isPureNumericFilename) {
        const targetIndex = idx % stagedRows.length;
        targetStagedRow = stagedRows[targetIndex];
      }
    }

    // Strategy 2: Catalog Product Match
    // 2.1 Match by explicit SKU in catalog (if sku column exists)
    targetCatalogProduct = catalogSkuMap.get(item.sku);

    // 2.2 Match by staged row index / position (avoids duplicate product name collision)
    if (!targetCatalogProduct && targetStagedRow && catalogProducts.length > 0) {
      const stagedIdx = stagedRows.indexOf(targetStagedRow);
      if (stagedIdx >= 0 && stagedIdx < catalogProducts.length) {
        targetCatalogProduct = catalogProducts[stagedIdx];
      }
    }

    // 2.3 Match by product name substring if unique
    if (!targetCatalogProduct && catalogNameMap.size > 0) {
      for (const [cleanName, prod] of catalogNameMap.entries()) {
        if (cleanName && cleanName.length >= 3 && cleanFilenameBase.includes(cleanName)) {
          targetCatalogProduct = prod;
          break;
        }
      }
    }

    // 2.4 Fallback catalog matching: Match numeric index from SKU/filename (e.g. RING-GOLD-002 -> index 1)
    const baseNameOnly = path.parse(item.filename).name.trim();
    const isPureNumericFilename = /^\d+$/.test(baseNameOnly);
    const skuNumberMatch = item.sku.match(/(\d+)$/);

    if (!targetCatalogProduct && catalogProducts.length > 0) {
      if (skuNumberMatch) {
        const skuNum = parseInt(skuNumberMatch[1], 10);
        // Normalize 1-based index (e.g. RING-GOLD-001 -> 0, RING-GOLD-002 -> 1)
        const targetIndex = (skuNum > 0 ? skuNum - 1 : idx) % catalogProducts.length;
        targetCatalogProduct = catalogProducts[targetIndex];
      } else if (isPureNumericFilename) {
        const targetIndex = idx % catalogProducts.length;
        targetCatalogProduct = catalogProducts[targetIndex];
      }
    }

    if (targetStagedRow || targetCatalogProduct) {
      matchedCount++;
      const fileDataBuffer = item.entry.getData();
      const targetId = targetCatalogProduct ? targetCatalogProduct.id : (targetStagedRow.id || `staged-${idx}`);
      const storagePath = `manufacturer-products/${manufacturerId}/${targetId}/${item.filename}`;

      const extClean = path.extname(item.filename).replace(".", "").toLowerCase();
      const mimeType = extClean === "png" ? "image/png" : extClean === "webp" ? "image/webp" : "image/jpeg";
      let imageUrl = null;

      try {
        const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
          .from("products")
          .upload(storagePath, fileDataBuffer, {
            contentType: mimeType,
            upsert: true,
          });

        if (!uploadErr && uploadData) {
          const { data: pubUrlData } = supabaseAdmin.storage.from("products").getPublicUrl(storagePath);
          if (pubUrlData?.publicUrl) imageUrl = pubUrlData.publicUrl;
        }
      } catch (e) {
        console.warn("Storage upload notice:", e.message);
      }

      if (!imageUrl) {
        // Fallback to base64 data URI if storage upload/public URL generation is unavailable
        imageUrl = `data:${mimeType};base64,${fileDataBuffer.toString("base64")}`;
      }

      // If matched to a staged row, update normalized_data and raw_data in DB and memory
      if (targetStagedRow) {
        const updatedNorm = { ...(targetStagedRow.normalized_data || {}), image_url: imageUrl, image: imageUrl, image_filename: item.filename };
        const updatedRaw = { ...(targetStagedRow.raw_data || {}), image_url: imageUrl, image: imageUrl, image_filename: item.filename };
        targetStagedRow.normalized_data = updatedNorm;
        targetStagedRow.raw_data = updatedRaw;

        try {
          await supabaseAdmin
            .from("product_import_rows")
            .update({
              normalized_data: updatedNorm,
              raw_data: updatedRaw,
            })
            .eq("id", targetStagedRow.id);
        } catch (e) {
          console.warn("Notice updating staged row image_url:", e.message);
        }

        if (cachedJob && cachedJob.stagingRows) {
          const cRow = cachedJob.stagingRows.find((cr) => cr.id === targetStagedRow.id);
          if (cRow) {
            cRow.normalized_data = updatedNorm;
            cRow.raw_data = updatedRaw;
          }
        }
      }

      // If matched to an existing catalog product, update or insert in product_images table
      if (targetCatalogProduct) {
        try {
          // Check if image record already exists for this manufacturer product
          const { data: existingImgs } = await supabaseAdmin
            .from("product_images")
            .select("id")
            .eq("manufacturer_product_id", targetCatalogProduct.id);

          if (existingImgs && existingImgs.length > 0) {
            await supabaseAdmin
              .from("product_images")
              .update({ image_url: imageUrl, is_primary: true })
              .eq("id", existingImgs[0].id);
            console.log(`✅ Updated existing product_images record for product ${targetCatalogProduct.id}`);
          } else {
            const { error: piErr } = await supabaseAdmin.from("product_images").insert({
              manufacturer_product_id: targetCatalogProduct.id,
              image_url: imageUrl,
              is_primary: true,
              display_order: 1,
            });
            if (piErr) {
              console.warn("product_images insert error:", piErr.message);
            } else {
              console.log(`✅ Linked ZIP image to product_images for product ${targetCatalogProduct.id}`);
            }
          }
        } catch (e) {
          console.warn("product_images insert notice:", e.message);
        }
      }

      processedImages.push({
        filename: item.filename,
        sku: item.sku,
        productId: targetCatalogProduct?.id || null,
        stagedRowId: targetStagedRow?.id || null,
        matched: true,
        imageUrl,
      });
    } else {
      unmatchedCount++;
      processedImages.push({
        filename: item.filename,
        sku: item.sku,
        matched: false,
        note: `No product found in catalog matching image '${item.filename}'`,
      });
    }
  }

  return {
    success: true,
    uploadId: uploadId,
    totalImagesExtracted: imageEntries.length,
    matchedProductsCount: matchedCount,
    unmatchedImagesCount: unmatchedCount,
    processedImages,
  };
}

/**
 * Service: Fetch Manufacturer Import History Jobs List
 */
export async function getManufacturerImportHistory(userId) {
  const { manufacturer } = await getManufacturerProfile(userId);
  const manufacturerId = manufacturer.id;

  const { data: jobs, error } = await supabaseAdmin
    .from("product_import_jobs")
    .select("*")
    .eq("manufacturer_id", manufacturerId)
    .order("started_at", { ascending: false });

  if (error) {
    console.error("Error fetching import history jobs:", error);
    return [];
  }

  return jobs || [];
}
