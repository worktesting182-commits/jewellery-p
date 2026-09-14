import { supabaseAdmin } from "../config/supabase.js";

/**
 * Multi-Tenant Membership Verification Middleware: verifyRetailerAccess
 * 
 * Flow:
 * Authenticate User -> Resolve Retailer Context -> Check customer_retailers -> Controller
 * 
 * NEVER TRUST THE FRONTEND:
 * Intercepts parameter tampering in headers (x-retailer-id), URLs, query params, or body.
 * Verifies that an ACTIVE customer_retailers mapping exists in database before proceeding.
 */
export const verifyRetailerAccess = async (req, res, next) => {
  try {
    // 1. User profile must be populated by authMiddleware (req.user)
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: "Authentication required before accessing retailer-scoped resources.",
      });
    }

    // Admins have platform-wide governance access
    if (req.user.role === "ADMIN") {
      return next();
    }

    // 2. Extract requested retailer identifier from all possible inputs (Headers > Params > Query > Body)
    const rawRetailerId =
      req.headers["x-retailer-id"] ||
      req.headers["retailer-id"] ||
      req.params.retailerId ||
      req.query.retailer_id ||
      req.query.retailerId ||
      req.body.retailer_id ||
      req.body.retailerId;

    if (!rawRetailerId || typeof rawRetailerId !== "string" || !rawRetailerId.trim()) {
      return res.status(400).json({
        success: false,
        message: "Retailer context (x-retailer-id header, query parameter, or body field) is required.",
      });
    }

    const targetInput = rawRetailerId.trim();

    // 3. Resolve customer ID for authenticated user
    const { data: customer, error: custErr } = await supabaseAdmin
      .from("customers")
      .select("id, user_id")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (custErr || !customer) {
      return res.status(403).json({
        success: false,
        message: "Customer profile not found. Access denied.",
      });
    }

    // 4. Resolve retailer record by internal UUID or public retailer_code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetInput);
    let retailer = null;

    if (isUuid) {
      const { data: retById } = await supabaseAdmin
        .from("retailers")
        .select("id, shop_name, retailer_code, is_verified")
        .eq("id", targetInput)
        .maybeSingle();
      retailer = retById;
    }

    if (!retailer) {
      const { data: retByCode } = await supabaseAdmin
        .from("retailers")
        .select("id, shop_name, retailer_code, is_verified")
        .ilike("retailer_code", targetInput.toUpperCase())
        .maybeSingle();
      retailer = retByCode;
    }

    if (!retailer) {
      return res.status(404).json({
        success: false,
        message: "Retailer storefront not found.",
      });
    }

    // 5. Query customer_retailers table to verify ACTIVE membership
    const { data: membership, error: mapErr } = await supabaseAdmin
      .from("customer_retailers")
      .select("id, status, joined_at")
      .eq("customer_id", customer.id)
      .eq("retailer_id", retailer.id)
      .eq("status", "ACTIVE")
      .maybeSingle();

    if (mapErr || !membership) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have an active membership with this retailer storefront.",
      });
    }

    // 6. Attach validated retailer context to request object
    req.customer = customer;
    req.retailerId = retailer.id;
    req.retailer = retailer;
    req.membership = membership;

    next();
  } catch (err) {
    console.error("Error in verifyRetailerAccess middleware:", err);
    return res.status(500).json({
      success: false,
      message: "Server error verifying retailer access.",
    });
  }
};

export default verifyRetailerAccess;
