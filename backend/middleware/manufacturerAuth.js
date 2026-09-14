import { authenticate } from "./authMiddleware.js";
import { authorize } from "./roleMiddleware.js";

/**
 * Middleware: Enforces JWT authentication and MANUFACTURER role authorization
 */
export const manufacturerAuth = [authenticate, authorize("MANUFACTURER")];
