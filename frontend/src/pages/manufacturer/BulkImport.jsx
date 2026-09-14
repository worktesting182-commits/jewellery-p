import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileSpreadsheet,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  ArrowRight,
  RefreshCw,
  Archive,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowLeft,
} from "lucide-react";
import { getAuthToken } from "../../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function BulkImport() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const zipInputRef = useRef(null);

  // Flow State & Data
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationProgress, setValidationProgress] = useState(0);
  const [validationLayerStep, setValidationLayerStep] = useState("");
  const [uploadId, setUploadId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [errorsList, setErrorsList] = useState([]);
  const [showErrorTable, setShowErrorTable] = useState(true);

  // Confirm Import State
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmResult, setConfirmResult] = useState(null);

  // ZIP Image Upload State
  const [zipFile, setZipFile] = useState(null);
  const [isUploadingZip, setIsUploadingZip] = useState(false);
  const [zipResult, setZipResult] = useState(null);

  // Global Error Banner
  const [errorMessage, setErrorMessage] = useState("");

  // 1. Download Import Template
  const handleDownloadTemplate = async (format = "excel") => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/products/bulk/template?format=${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to download import template");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "csv" ? "CJP_Product_Import_Template.csv" : "CJP_Product_Import_Template.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setErrorMessage(err.message || "Failed to download template.");
    }
  };

  // Drag and Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMessage("");
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setErrorMessage("");
    }
  };

  // 2. Validate Product File Upload
  const handleStartValidation = async () => {
    if (!selectedFile) return;

    setIsValidating(true);
    setValidationProgress(10);
    setValidationLayerStep("Layer 1: Verifying File & Extensions...");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      setTimeout(() => {
        setValidationProgress(40);
        setValidationLayerStep("Layer 2 & 3: Validating Required Headers & Row Business Rules...");
      }, 500);

      setTimeout(() => {
        setValidationProgress(75);
        setValidationLayerStep("Layer 4 & 5: Checking Intra-File & Database SKU Duplicates...");
      }, 1000);

      const token = await getAuthToken();

      const response = await fetch(`${API_BASE_URL}/products/bulk/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Validation failed.");
      }

      setValidationProgress(100);
      setUploadId(data.uploadId);
      setSummary(data.summary);
      setErrorsList(data.errors || []);

      // Fetch Preview rows
      const previewRes = await fetch(`${API_BASE_URL}/products/bulk/${data.uploadId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const previewData = await previewRes.json();
      if (previewData.success) {
        setPreviewRows(previewData.rows || []);
      }
    } catch (err) {
      setErrorMessage(err.message || "Validation process failed.");
    } finally {
      setIsValidating(false);
    }
  };

  // Download Error Report CSV
  const handleDownloadErrorReport = async () => {
    if (!uploadId) return;
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/products/bulk/${uploadId}/errors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to download error report");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `CJP_Import_Error_Report_${uploadId.substring(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      setErrorMessage(err.message || "Failed to download error report.");
    }
  };

  // 7. Confirm Import
  const handleConfirmImport = async () => {
    if (!uploadId) return;
    setIsConfirming(true);
    setErrorMessage("");

    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/products/bulk/${uploadId}/confirm`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Confirm import failed.");
      }
      setConfirmResult(data);
    } catch (err) {
      setErrorMessage(err.message || "Failed to confirm product import.");
    } finally {
      setIsConfirming(false);
    }
  };

  // 8. Upload Product Images ZIP
  const handleUploadZip = async () => {
    if (!zipFile || !uploadId) return;
    setIsUploadingZip(true);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", zipFile);

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/products/bulk/${uploadId}/images`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to process image ZIP archive.");
      }
      setZipResult(data);

      // Re-fetch preview rows to reflect matched images
      const previewRes = await fetch(`${API_BASE_URL}/products/bulk/${uploadId}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const previewData = await previewRes.json();
      if (previewData.success) {
        setPreviewRows(previewData.rows || []);
      }
    } catch (err) {
      setErrorMessage(err.message || "Failed to upload image ZIP.");
    } finally {
      setIsUploadingZip(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadId(null);
    setSummary(null);
    setPreviewRows([]);
    setErrorsList([]);
    setConfirmResult(null);
    setZipFile(null);
    setZipResult(null);
    setErrorMessage("");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 lg:p-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-950/10 pb-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-amber-800/70 mb-1">
              <Link to="/manufacturer/products" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" /> Products Catalog
              </Link>
              <span>/</span>
              <span className="font-semibold text-amber-900">Bulk Import</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-amber-950 tracking-tight">
              Bulk Product Import Center
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Upload, 5-layer validate, and batch import your jewelry products catalog via Excel or CSV.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleDownloadTemplate("excel")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl font-medium text-sm hover:bg-amber-100 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              Excel Template (.xlsx)
            </button>
            <button
              onClick={() => handleDownloadTemplate("csv")}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-50 text-amber-900 border border-amber-300 rounded-xl font-medium text-sm hover:bg-amber-100 transition"
            >
              <Download className="w-4 h-4 text-amber-700" />
              CSV Template
            </button>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{errorMessage}</p>
                {(errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("authorization") || errorMessage.toLowerCase().includes("expired")) && (
                  <p className="text-xs text-red-600 mt-1">
                    Your login session has expired. Please log in again to continue bulk uploading.
                  </p>
                )}
              </div>
            </div>
            {(errorMessage.toLowerCase().includes("token") || errorMessage.toLowerCase().includes("authorization") || errorMessage.toLowerCase().includes("expired")) && (
              <button
                onClick={() => navigate("/login")}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-xs transition flex-shrink-0"
              >
                Log In Again
              </button>
            )}
          </div>
        )}

        {/* SECTION 1 & 2: Download Template & Upload File */}
        {!summary && (
          <div className="bg-white border border-amber-950/10 rounded-2xl p-8 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center text-amber-900 font-serif font-bold">
                1
              </div>
              <div>
                <h2 className="text-lg font-serif font-bold text-amber-950">Upload Product File</h2>
                <p className="text-xs text-slate-500">Supports .xlsx, .xls, and .csv files up to 10MB (Max 1,000 rows)</p>
              </div>
            </div>

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center ${
                isDragging
                  ? "border-amber-600 bg-amber-50/50"
                  : selectedFile
                  ? "border-emerald-500 bg-emerald-50/20"
                  : "border-slate-300 hover:border-amber-500 hover:bg-amber-50/20"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <UploadCloud className={`w-12 h-12 mb-3 ${selectedFile ? "text-emerald-600" : "text-amber-800/60"}`} />

              {selectedFile ? (
                <div>
                  <p className="font-semibold text-slate-800 text-base">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Spreadsheet"}
                  </p>
                  <span className="inline-block mt-3 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                    Ready for 5-Layer Validation
                  </span>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-700">
                    Drag and drop your product spreadsheet here, or <span className="text-amber-800 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Accepts .xlsx, .xls, or .csv</p>
                </div>
              )}
            </div>

            {/* Validation Trigger Button */}
            {selectedFile && (
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setSelectedFile(null)}
                  className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  Clear Selection
                </button>
                <button
                  onClick={handleStartValidation}
                  disabled={isValidating}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-xl font-medium text-sm transition shadow-sm disabled:opacity-50"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Validating Spreadsheet...
                    </>
                  ) : (
                    <>
                      <Layers className="w-4 h-4" />
                      Run 5-Layer Validation
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SECTION 3: Validation Progress Indicator */}
        {isValidating && (
          <div className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm space-y-3">
            <div className="flex justify-between text-xs font-semibold text-amber-950">
              <span>{validationLayerStep}</span>
              <span>{validationProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-800 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${validationProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* SECTION 4: Validation Summary Dashboard */}
        {summary && (
          <div className="space-y-6">
            <div className="bg-white border border-amber-950/10 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    summary.status === "VALIDATED" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                  }`}>
                    {summary.status}
                  </span>
                  <span className="text-xs text-slate-500">• File: {summary.file_name}</span>
                </div>
                <h3 className="text-xl font-serif font-bold text-amber-950 mt-1">Validation Completed</h3>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 w-full md:w-auto">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center min-w-[100px]">
                  <p className="text-xs text-slate-500 font-medium">Total Found</p>
                  <p className="text-xl font-serif font-bold text-slate-900">{summary.total_rows || summary.total}</p>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center min-w-[100px]">
                  <p className="text-xs text-emerald-700 font-medium">✓ Valid</p>
                  <p className="text-xl font-serif font-bold text-emerald-800">{summary.valid_rows || summary.valid}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center min-w-[100px]">
                  <p className="text-xs text-red-700 font-medium">✗ Invalid</p>
                  <p className="text-xl font-serif font-bold text-red-800">{summary.invalid_rows || summary.invalid}</p>
                </div>
              </div>
            </div>

            {/* SECTION 6: Error List & Report Download */}
            {errorsList.length > 0 && (
              <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <h3 className="font-serif font-bold text-red-950 text-base">
                      Validation Errors Identified ({errorsList.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadErrorReport}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-800 hover:bg-red-200 rounded-lg text-xs font-semibold transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Error Report CSV
                    </button>
                    <button
                      onClick={() => setShowErrorTable(!showErrorTable)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      {showErrorTable ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {showErrorTable && (
                  <div className="overflow-x-auto rounded-xl border border-red-100 max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-red-50/50 text-red-900 font-semibold sticky top-0">
                        <tr>
                          <th className="p-3">Row #</th>
                          <th className="p-3">SKU</th>
                          <th className="p-3">Field</th>
                          <th className="p-3">Error Message</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-red-100 text-slate-700">
                        {errorsList.map((err, idx) => (
                          <tr key={idx} className="hover:bg-red-50/20">
                            <td className="p-3 font-semibold text-slate-900">{err.row_number || err.rowNumber}</td>
                            <td className="p-3 font-mono">{err.sku || "N/A"}</td>
                            <td className="p-3 capitalize">{err.field || "Validation"}</td>
                            <td className="p-3 text-red-700 font-medium">{err.error_message || err.errorMessage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* SECTION 5: Staged Product Preview Table & Image ZIP Upload */}
            {previewRows.length > 0 && (
              <div className="bg-white border border-amber-950/10 rounded-2xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-serif font-bold text-amber-950 text-lg">Staged Products Preview</h3>
                    <p className="text-xs text-slate-500">Review validated products and attached image status before importing.</p>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">Showing {previewRows.length} parsed rows</span>
                </div>

                {/* Optional Image ZIP Upload prior to confirmation */}
                {!confirmResult && (
                  <div className="p-4 bg-amber-50/40 border border-amber-200/80 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-amber-800" />
                      <h4 className="font-serif font-bold text-amber-950 text-sm">Upload Product Images Archive (.zip)</h4>
                    </div>
                    <p className="text-xs text-slate-600">
                      Upload a ZIP archive containing product images named by SKU (e.g. <span className="font-mono text-amber-900 font-semibold">RING-GOLD-001.jpg</span>). Images will automatically match to staged products below.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        onClick={() => zipInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-3.5 py-2 border border-amber-300 rounded-xl text-xs font-medium text-amber-900 bg-white hover:bg-amber-50 transition"
                      >
                        <Archive className="w-3.5 h-3.5 text-amber-800" />
                        {zipFile ? zipFile.name : "Choose product-images.zip"}
                      </button>

                      {zipFile && (
                        <button
                          onClick={handleUploadZip}
                          disabled={isUploadingZip}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-xs font-medium transition disabled:opacity-50"
                        >
                          {isUploadingZip ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              Matching Images...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="w-3.5 h-3.5" />
                              Upload & Match Images
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {zipResult && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                        <p className="font-semibold">
                          ✓ ZIP Processing Complete: {zipResult.matchedProductsCount} of {zipResult.totalImagesExtracted} images matched to products!
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="overflow-x-auto rounded-xl border border-slate-200 max-h-96 overflow-y-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-50/60 text-amber-950 font-serif font-semibold sticky top-0">
                      <tr>
                        <th className="p-3">Row</th>
                        <th className="p-3">Image</th>
                        <th className="p-3">SKU</th>
                        <th className="p-3">Product Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Base Price</th>
                        <th className="p-3">Stock</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-amber-50/10">
                          <td className="p-3 font-mono text-xs text-slate-400">{row.rowNumber}</td>
                          <td className="p-3">
                            {row.imageUrl ? (
                              <img
                                src={row.imageUrl}
                                alt={row.name}
                                className="w-9 h-9 object-cover rounded-lg border border-amber-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-xs font-mono" title="No Image Attached">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-mono font-medium text-slate-900">{row.sku}</td>
                          <td className="p-3 font-medium text-slate-800">{row.name}</td>
                          <td className="p-3">{row.category}</td>
                          <td className="p-3 font-semibold text-amber-900">₹{(row.basePrice || 0).toLocaleString("en-IN")}</td>
                          <td className="p-3">{row.stockQuantity}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              row.validationStatus === "VALID" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}>
                              {row.validationStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SECTION 7: Confirm Import Actions */}
            {!confirmResult && (
              <div className="bg-amber-900 text-amber-50 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-md">
                <div>
                  <h4 className="font-serif font-bold text-lg">Ready to Commit Products to Live Catalog?</h4>
                  <p className="text-xs text-amber-200 mt-0.5">
                    {summary.valid_rows || summary.valid} valid products will be batch inserted into your wholesale catalog.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2 text-sm text-amber-200 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={isConfirming || (summary.valid_rows === 0 && summary.valid === 0)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition shadow disabled:opacity-50"
                  >
                    {isConfirming ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Batch Importing...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Confirm & Import {summary.valid_rows || summary.valid} Products
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* SECTION 8 & 9: Upload Images & Import Result */}
            {confirmResult && (
              <div className="space-y-6">
                {/* Result Card */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-emerald-900 space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <div>
                      <h3 className="text-xl font-serif font-bold text-emerald-950">
                        Successfully Imported {confirmResult.insertedCount} Products!
                      </h3>
                      <p className="text-xs text-emerald-700">
                        Status: <span className="font-semibold">{confirmResult.status}</span> • Your wholesale catalog is now updated.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Images ZIP Upload Dropzone */}
                <div className="bg-white border border-amber-950/10 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-950 font-serif font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-amber-950 text-base">Bulk Upload Product Images (.zip)</h3>
                      <p className="text-xs text-slate-500">
                        Name image files using SKU format e.g. <span className="font-mono text-amber-900 font-semibold">ABC-RING-001-1.jpg</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <input
                      ref={zipInputRef}
                      type="file"
                      accept=".zip"
                      onChange={(e) => setZipFile(e.target.files[0])}
                      className="hidden"
                    />
                    <button
                      onClick={() => zipInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 border border-amber-300 rounded-xl text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 transition"
                    >
                      <Archive className="w-4 h-4 text-amber-800" />
                      {zipFile ? zipFile.name : "Select product-images.zip"}
                    </button>

                    {zipFile && (
                      <button
                        onClick={handleUploadZip}
                        disabled={isUploadingZip}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-sm font-medium transition disabled:opacity-50"
                      >
                        {isUploadingZip ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Extracting & Matching...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-4 h-4" />
                            Upload & Match Images
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {zipResult && (
                    <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                      <p className="font-semibold text-amber-950">
                        ZIP Processing Summary: {zipResult.matchedProductsCount} of {zipResult.totalImagesExtracted} images matched!
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleReset}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition"
                  >
                    Import Another File
                  </button>
                  <Link
                    to="/manufacturer/products"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-sm font-semibold transition"
                  >
                    View Catalog <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
