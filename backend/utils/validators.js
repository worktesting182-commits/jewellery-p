/**
 * Central Input Validation Utilities for Security Audit
 */

// Email regex pattern
export const isValidEmail = (email) => {
  if (!email || typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// UUID v4 / Standard UUID regex pattern
export const isValidUuid = (uuid) => {
  if (!uuid || typeof uuid !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid.trim());
};

// Price non-negative check
export const isValidPrice = (price) => {
  const num = Number(price);
  return !isNaN(num) && num >= 0;
};

// Stock non-negative integer check
export const isValidStock = (stock) => {
  const num = Number(stock);
  return !isNaN(num) && Number.isInteger(num) && num >= 0;
};

// Sanitizer for text input to prevent XSS / malicious injection
export const sanitizeInput = (text) => {
  if (typeof text !== "string") return text;
  return text
    .trim()
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
};
