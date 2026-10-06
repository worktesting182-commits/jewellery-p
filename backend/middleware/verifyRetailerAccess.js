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

    // 2. Resolve customer ID for authenticated user
    let { data: customer, error: custErr } = await supabaseAdmin
      .from("customers")
      .select("id, user_id")
      .eq("user_id", req.user.id)
      .maybeSingle();

    if (!customer) {
      // Auto-create customer profile if missing for authenticated user
      const { data: createdCust } = await supabaseAdmin
        .from("customers")
        .insert({ user_id: req.user.id })
        .select("id, user_id")
        .maybeSingle();
      if (createdCust) {
        customer = createdCust;
        custErr = null;
      }
    }

    if (custErr || !customer) {
      return res.status(403).json({
        success: false,
        message: "Customer profile not found. Access denied.",
      });
    }

    // 3. Extract requested retailer identifier safely from all possible inputs (Headers > Params > Query > Body)
    const rawRetailerId =
      req.headers?.["x-retailer-id"] ||
      req.headers?.["retailer-id"] ||
      req.params?.retailerId ||
      req.query?.retailer_id ||
      req.query?.retailerId ||
      req.body?.retailer_id ||
      req.body?.retailerId;

    let targetInput = (typeof rawRetailerId === "string" ? rawRetailerId.trim() : "");
    if (targetInput === "null" || targetInput === "undefined") {
      targetInput = "";
    }

    // Check if this is a read-only cart inspection (GET /cart)
    const isCartGet = req.method === "GET" && (req.baseUrl?.includes("cart") || req.path?.includes("cart"));

    // If no retailer identifier is provided:
    if (!targetInput) {
      // Try to auto-resolve active retailer from customer's active membership
      if (customer?.id) {
        const { data: activeMembership } = await supabaseAdmin
          .from("customer_retailers")
          .select("id, status, joined_at, retailer_id, retailers:retailers(id, shop_name, retailer_code)")
          .eq("customer_id", customer.id)
          .eq("status", "ACTIVE")
          .order("joined_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activeMembership?.retailers) {
          req.customer = customer;
          req.retailerId = activeMembership.retailers.id;
          req.retailer = activeMembership.retailers;
          req.membership = activeMembership;
          return next();
        }
      }

      // For read-only cart inspection (GET /cart), allow proceeding with empty retailer context
      // so customers with empty carts or without an active store don't get blocked with sync errors
      if (isCartGet) {
        req.customer = customer;
        req.retailerId = null;
        req.retailer = null;
        req.membership = null;
        return next();
      }

      return res.status(400).json({
        success: false,
        message: "Retailer context (x-retailer-id header, query parameter, or body field) is required.",
      });
    }

    // 4. Resolve retailer record by internal UUID or public retailer_code
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetInput);
    let retailer = null;

    if (isUuid) {
      const { data: retById } = await supabaseAdmin
        .from("retailers")
        .select("id, shop_name, retailer_code")
        .eq("id", targetInput)
        .maybeSingle();
      retailer = retById;
    }

    if (!retailer) {
      const { data: retByCode } = await supabaseAdmin
        .from("retailers")
        .select("id, shop_name, retailer_code")
        .ilike("retailer_code", targetInput.toUpperCase())
        .maybeSingle();
      retailer = retByCode;
    }

    if (!retailer) {
      // If reading cart on GET and requested retailer is not found, fall back gracefully to empty cart
      if (isCartGet) {
        req.customer = customer;
        req.retailerId = null;
        req.retailer = null;
        req.membership = null;
        return next();
      }

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
      // If reading cart on GET, allow empty cart display without blocking
      if (isCartGet) {
        req.customer = customer;
        req.retailerId = null;
        req.retailer = null;
        req.membership = null;
        return next();
      }

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
      error: err?.message,
    });
  }
};

export default verifyRetailerAccess;
