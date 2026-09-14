import crypto from "crypto";

/**
 * Generate a unique retailer access code formatted like CJP-XXXXXX
 * (e.g. CJP-4F8A2D)
 */
export function generateRetailerCode() {
  const suffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CJP-${suffix}`;
}
