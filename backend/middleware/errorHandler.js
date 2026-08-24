/**
 * Centralized Error Handling Middleware for Consistent API Responses (Module 5)
 */

// 404 Not Found Middleware for unhandled API routes
export const notFoundHandler = (req, res, next) => {
  return res.status(404).json({
    success: false,
    statusCode: 404,
    message: `API endpoint '${req.originalUrl}' not found`,
    error: "NOT_FOUND",
  });
};

// Global 500 Error Handler Middleware for server exceptions
export const globalErrorHandler = (err, req, res, next) => {
  console.error("Global Server Exception:", err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "An unexpected server error occurred";

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error: err.name || "SERVER_ERROR",
  });
};
