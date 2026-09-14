import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  History,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Eye,
  ArrowLeft,
  Plus,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { getAuthToken } from "../../lib/supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export default function ImportHistory() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchImportHistory = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/products/bulk/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch import history.");
      }
      setJobs(data.jobs || []);
    } catch (err) {
      setErrorMessage(err.message || "Failed to load import history jobs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const handleDownloadErrors = async (uploadId) => {
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
      alert(err.message || "Failed to download error report.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "COMPLETED":
        return <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">COMPLETED</span>;
      case "PARTIAL_SUCCESS":
        return <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-bold">PARTIAL SUCCESS</span>;
      case "VALIDATED":
        return <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">VALIDATED</span>;
      case "IMPORTING":
      case "VALIDATING":
        return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold animate-pulse">PROCESSING</span>;
      case "FAILED":
      default:
        return <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">FAILED</span>;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
              <span className="font-semibold text-amber-900">Import History</span>
            </div>
            <h1 className="text-3xl font-serif font-bold text-amber-950 tracking-tight flex items-center gap-3">
              <History className="w-8 h-8 text-amber-900" />
              Bulk Product Import History
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Audit log of all past spreadsheet upload jobs, validation metrics, and error reports.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchImportHistory}
              className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl transition"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            </button>
            <Link
              to="/manufacturer/products/bulk-import"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-900 hover:bg-amber-950 text-amber-50 rounded-xl font-medium text-sm transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              New Bulk Import
            </Link>
          </div>
        </div>

        {/* Global Error Banner */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && jobs.length === 0 && (
          <div className="bg-white border border-amber-950/10 rounded-2xl p-12 text-center space-y-3 shadow-sm">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-800 mx-auto" />
            <p className="text-sm text-slate-600 font-medium">Loading import history jobs...</p>
          </div>
        )}

        {/* Empty History State */}
        {!isLoading && jobs.length === 0 && (
          <div className="bg-white border border-amber-950/10 rounded-2xl p-12 text-center space-y-4 shadow-sm">
            <FileSpreadsheet className="w-12 h-12 text-amber-800/40 mx-auto" />
            <div>
              <h3 className="text-lg font-serif font-bold text-amber-950">No Bulk Import Jobs Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                You haven't uploaded any product import spreadsheets yet. Click below to start your first bulk import!
              </p>
            </div>
            <Link
              to="/manufacturer/products/bulk-import"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-900 hover:bg-amber-950 text-white rounded-xl text-sm font-semibold transition"
            >
              Start Bulk Import
            </Link>
          </div>
        )}

        {/* Import History Table */}
        {jobs.length > 0 && (
          <div className="bg-white border border-amber-950/10 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-amber-950/10 flex items-center justify-between">
              <h2 className="font-serif font-bold text-amber-950 text-lg">Past Import Jobs ({jobs.length})</h2>
              <span className="text-xs text-slate-500">Sorted by most recent upload date</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-50/60 text-amber-950 font-serif font-semibold border-b border-amber-950/10">
                  <tr>
                    <th className="p-4">File Name</th>
                    <th className="p-4">Upload Date</th>
                    <th className="p-4">Total Rows</th>
                    <th className="p-4">Valid Rows</th>
                    <th className="p-4">Invalid Rows</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Completed Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-amber-50/10 transition">
                      <td className="p-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-emerald-700 flex-shrink-0" />
                          <span className="truncate max-w-[180px]">{job.file_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{formatDate(job.started_at || job.created_at)}</td>
                      <td className="p-4 font-mono font-medium text-slate-800">{job.total_rows || 0}</td>
                      <td className="p-4 font-mono font-semibold text-emerald-700">{job.valid_rows || 0}</td>
                      <td className="p-4 font-mono font-semibold text-red-700">{job.invalid_rows || 0}</td>
                      <td className="p-4 whitespace-nowrap">{getStatusBadge(job.status)}</td>
                      <td className="p-4 text-xs text-slate-500 whitespace-nowrap">{formatDate(job.completed_at || job.validated_at)}</td>
                      <td className="p-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {job.invalid_rows > 0 && (
                            <button
                              onClick={() => handleDownloadErrors(job.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Download Error Report CSV"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
