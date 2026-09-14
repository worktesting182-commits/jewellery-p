import { supabaseAdmin } from "../config/supabase.js";

/**
 * Service 1: Validate Public Retailer Access Code
 * Normalizes input string (UPPER(TRIM(code))) and checks existence and status.
 */
export async function validateRetailerCode(code) {
  if (!code || typeof code !== "string" || !code.trim()) {
    const error = new Error("Retailer access code is required.");
    error.statusCode = 400;
    throw error;
  }

  const normalizedCode = code.trim().toUpperCase();

  // Query retailers table by public access identifier (retailer_code)
  const { data: retailer, error: fetchErr } = await supabaseAdmin
    .from("retailers")
    .select("id, shop_name, gst_number, address, postal_code, website, description, retailer_code, is_verified, created_at")
    .ilike("retailer_code", normalizedCode)
    .maybeSingle();

  if (fetchErr) {
    console.error("Error fetching retailer by code:", fetchErr);
    const error = new Error("Failed to validate retailer code.");
    error.statusCode = 500;
    throw error;
  }

  if (!retailer) {
    const error = new Error("Invalid retailer access code. Please check the code provided by your jeweller.");
    error.statusCode = 404;
    throw error;
  }

  return {
    valid: true,
    retailer: {
      id: retailer.id,
      shop_name: retailer.shop_name || "Jewellery Retailer",
      business_name: retailer.shop_name || "Jewellery Retailer",
      retailer_code: retailer.retailer_code,
      address: retailer.address || "",
      website: retailer.website || "",
      is_verified: retailer.is_verified !== false,
    },
  };
}

/**
 * Helper: Resolve customer ID from system user ID (handles users.id or auth_user_id)
 */
export async function getCustomerByUserId(userId) {
  if (!userId) {
    const err = new Error("User ID is required.");
    err.statusCode = 400;
    throw err;
  }

  // 1. Check if customers.user_id matches directly
  let { data: customer } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (customer) return customer;

  // 2. Check if userId is customers.id (direct customer PK)
  const { data: customerById } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (customerById) return customerById;

  // 3. Resolve user from users table (by internal PK or auth_user_id)
  let { data: userProfile } = await supabaseAdmin
    .from("users")
    .select("id, auth_user_id")
    .or(`id.eq.${userId},auth_user_id.eq.${userId}`)
    .maybeSingle();

  if (userProfile) {
    // Try matching customer by resolved users.id
    const { data: custByResolvedId } = await supabaseAdmin
      .from("customers")
      .select("*")
      .eq("user_id", userProfile.id)
      .maybeSingle();

    if (custByResolvedId) return custByResolvedId;

    // Auto-create customer profile if missing
    const { data: newCust } = await supabaseAdmin
      .from("customers")
      .insert({ user_id: userProfile.id })
      .select("*")
      .maybeSingle();

    if (newCust) return newCust;
  }

  const err = new Error("Customer profile not found.");
  err.statusCode = 404;
  throw err;
}

/**
 * Service: Leave / Remove Authorized Retailer Storefront
 */
export async function leaveRetailer(userId, retailerId) {
  const customer = await getCustomerByUserId(userId);

  // Delete membership mapping row from customer_retailers
  const { error: delErr } = await supabaseAdmin
    .from("customer_retailers")
    .delete()
    .eq("customer_id", customer.id)
    .eq("retailer_id", retailerId);

  if (delErr) {
    console.error("Error leaving retailer store:", delErr);
    const error = new Error("Failed to remove retailer store membership.");
    error.statusCode = 500;
    throw error;
  }

  return {
    success: true,
    message: "Store membership removed successfully.",
  };
}

/**
 * Service 2: Join Retailer & Establish Authorized Customer–Retailer Relationship
 * Idempotently creates record in customer_retailers mapping table.
 */
export async function joinRetailer(userId, codeOrId) {
  if (!codeOrId || typeof codeOrId !== "string" || !codeOrId.trim()) {
    const error = new Error("Retailer code or retailer ID is required.");
    error.statusCode = 400;
    throw error;
  }

  const customer = await getCustomerByUserId(userId);
  const inputTarget = codeOrId.trim();

  // Resolve retailer by UUID or public retailer_code
  let retailer = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(inputTarget);

  if (isUuid) {
    const { data: retById } = await supabaseAdmin
      .from("retailers")
      .select("*")
      .eq("id", inputTarget)
      .maybeSingle();
    retailer = retById;
  }

  if (!retailer) {
    const { data: retByCode } = await supabaseAdmin
      .from("retailers")
      .select("*")
      .ilike("retailer_code", inputTarget.toUpperCase())
      .maybeSingle();
    retailer = retByCode;
  }

  if (!retailer) {
    const error = new Error("Retailer not found. Please provide a valid retailer access code.");
    error.statusCode = 404;
    throw error;
  }

  // Check if mapping already exists
  const { data: existing } = await supabaseAdmin
    .from("customer_retailers")
    .select("*")
    .eq("customer_id", customer.id)
    .eq("retailer_id", retailer.id)
    .maybeSingle();

  if (existing) {
    return {
      success: true,
      alreadyJoined: true,
      message: `You are already authorized to access ${retailer.shop_name || retailer.retailer_code}.`,
      membership: existing,
      retailer: {
        id: retailer.id,
        shop_name: retailer.shop_name || "Jewellery Retailer",
        retailer_code: retailer.retailer_code,
      },
    };
  }

  // Insert new active membership mapping
  const newMembership = {
    customer_id: customer.id,
    retailer_id: retailer.id,
    status: "ACTIVE",
    joined_at: new Date().toISOString(),
  };

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("customer_retailers")
    .insert(newMembership)
    .select()
    .single();

  if (insertErr) {
    console.error("Error inserting customer_retailer mapping:", insertErr);
    const error = new Error("Failed to authorize customer–retailer access.");
    error.statusCode = 500;
    throw error;
  }

  return {
    success: true,
    alreadyJoined: false,
    message: `Successfully joined ${retailer.shop_name || retailer.retailer_code}! Storefront unlocked.`,
    membership: inserted,
    retailer: {
      id: retailer.id,
      shop_name: retailer.shop_name || "Jewellery Retailer",
      retailer_code: retailer.retailer_code,
    },
  };
}

/**
 * Service 3: Get Authorized Retailers for Customer ("My Stores")
 * Returns only retailers where customer has active customer_retailers mapping.
 */
export async function getMyRetailers(userId) {
  const customer = await getCustomerByUserId(userId);

  // Fetch active customer_retailers records joined with retailers table
  const { data: mappings, error: fetchErr } = await supabaseAdmin
    .from("customer_retailers")
    .select("*, retailer:retailers(*)")
    .eq("customer_id", customer.id)
    .eq("status", "ACTIVE");

  if (fetchErr) {
    console.error("Error fetching customer authorized retailers:", fetchErr);
    const error = new Error("Failed to retrieve authorized stores.");
    error.statusCode = 500;
    throw error;
  }

  const stores = (mappings || [])
    .filter((m) => m.retailer)
    .map((m) => ({
      membership_id: m.id,
      retailer_id: m.retailer.id,
      id: m.retailer.id,
      shop_name: m.retailer.shop_name || "Jewellery Retailer",
      business_name: m.retailer.shop_name || "Jewellery Retailer",
      retailer_code: m.retailer.retailer_code,
      status: m.status,
      joined_at: m.joined_at,
    }));

  return {
    success: true,
    count: stores.length,
    stores: stores,
  };
}

/**
 * Service 4: Get Specific Retailer Membership Status
 */
export async function getRetailerMembership(userId, retailerId) {
  const customer = await getCustomerByUserId(userId);

  const { data: mapping, error: fetchErr } = await supabaseAdmin
    .from("customer_retailers")
    .select("*, retailer:retailers(*)")
    .eq("customer_id", customer.id)
    .eq("retailer_id", retailerId)
    .maybeSingle();

  if (fetchErr) {
    console.error("Error checking retailer membership:", fetchErr);
    const error = new Error("Failed to check retailer membership status.");
    error.statusCode = 500;
    throw error;
  }

  if (!mapping || mapping.status !== "ACTIVE") {
    return {
      isAuthorized: false,
      status: mapping ? mapping.status : "NONE",
      message: "Customer does not have an active membership with this retailer.",
    };
  }

  return {
    isAuthorized: true,
    status: mapping.status,
    joined_at: mapping.joined_at,
    retailer: {
      id: mapping.retailer.id,
      shop_name: mapping.retailer.shop_name,
      retailer_code: mapping.retailer.retailer_code,
    },
  };
}
