import { supabaseAdmin } from "../config/supabase.js";
import { normalizeProduct } from "../utils/productModel.js";
import { getLatestBenchmarkRates } from "../utils/pricingEngine.js";

// Helper to resolve or auto-create retailer profile for logged-in user
async function resolveRetailerProfile(user) {
  let { data: retailer } = await supabaseAdmin
    .from("retailers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!retailer) {
    const { data: newRet, error } = await supabaseAdmin
      .from("retailers")
      .insert({
        user_id: user.id,
        shop_name: user.full_name || "Aura Artisan Jewellers",
        description: "Curated fine jewellery retailer store.",
        is_verified: true,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to create retailer profile: " + error.message);
    retailer = newRet;
  }

  return retailer;
}

// =========================
// GET RETAILER PROFILE
// =========================
export const getProfile = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    return res.status(200).json({
      success: true,
      data: retailer,
      retailer: retailer,
    });
  } catch (err) {
    console.error("Error in getProfile:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// UPDATE RETAILER PROFILE
// =========================
export const updateProfile = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);

    const { shop_name, gst_number, address, postal_code, website, description } = req.body;

    const updateFields = {
      updated_at: new Date().toISOString(),
    };

    if (shop_name !== undefined) updateFields.shop_name = shop_name;
    if (gst_number !== undefined) updateFields.gst_number = gst_number;
    if (address !== undefined) updateFields.address = address;
    if (postal_code !== undefined) updateFields.postal_code = postal_code;
    if (website !== undefined) updateFields.website = website;
    if (description !== undefined) updateFields.description = description;

    const { data: updated, error } = await supabaseAdmin
      .from("retailers")
      .update(updateFields)
      .eq("id", retailer.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Retailer profile updated successfully",
      data: updated,
      retailer: updated,
    });
  } catch (err) {
    console.error("Error in updateProfile:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GET STORE LISTINGS (retailer_products & products)
// =========================
export const getStoreListings = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);

    const { data: listings, error } = await supabaseAdmin
      .from("retailer_products")
      .select(`
        *,
        manufacturer_product:manufacturer_products (
          id, name, description, material, purity, weight, category_id, manufacturer_price, status,
          manufacturer:manufacturers(id, company_name)
        )
      `)
      .eq("retailer_id", retailer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error querying retailer_products:", error);
    }

    // Also fetch standalone retailer products from products table
    let standaloneProducts = [];
    try {
      const { data: prodData } = await supabaseAdmin
        .from("products")
        .select("*, category:categories(id, name)")
        .eq("retailer_id", retailer.id);
      if (prodData) standaloneProducts = prodData;
    } catch (_) {}

    // Fetch live rates for dynamic pricing
    const liveRates = await getLatestBenchmarkRates();

    // Fetch primary product images
    const { data: images } = await supabaseAdmin.from("product_images").select("*");
    const imageMap = new Map();
    (images || []).forEach((img) => {
      if (img.manufacturer_product_id && !imageMap.has(img.manufacturer_product_id)) {
        imageMap.set(img.manufacturer_product_id, img.image_url);
      }
      if (img.product_id && !imageMap.has(img.product_id)) {
        imageMap.set(img.product_id, img.image_url);
      }
    });

    const existingProductIds = new Set();

    const formattedListings = (listings || []).map((l) => {
      const mp = l.manufacturer_product || {};
      const p = l.product || {};

      if (p.id) existingProductIds.add(p.id);
      if (l.product_id) existingProductIds.add(l.product_id);

      const name = p.name || mp.name || l.name || "Custom Jewellery Item";
      const description = p.description || mp.description || l.description || "";
      const material = p.material || mp.material || l.material || "Gold";
      const purity = p.purity || mp.purity || l.purity || "22K";
      const weight = p.weight || mp.weight || l.weight || "10.0";
      const categoryId = p.category_id || mp.category_id || l.category_id;

      const isCustom =
        l.product_source === "RETAILER" ||
        p.product_source === "RETAILER" ||
        !mp.manufacturer?.id ||
        mp.manufacturer?.company_name === "In-House Retailer Artisans" ||
        mp.manufacturer?.company_name?.includes("In-House") ||
        mp.description?.includes("[RETAILER_CUSTOM]") ||
        l.is_custom === true;

      const imgUrl = imageMap.get(p.id) || imageMap.get(mp.id) || imageMap.get(l.id);

      return normalizeProduct({
        id: l.id,
        retailer_product_id: l.id,
        product_id: p.id || l.product_id || null,
        manufacturer_product_id: mp.id || l.manufacturer_product_id || null,
        manufacturer_id: mp.manufacturer_id,
        retailer_id: l.retailer_id,
        product_source: isCustom ? "RETAILER" : "MANUFACTURER",
        name,
        description,
        material,
        purity,
        weight,
        making_charge_type: p.making_charge_type || mp.making_charge_type || l.making_charge_type,
        making_charge_value: p.making_charge_value || mp.making_charge_value || l.making_charge_value,
        stone_price: p.stone_price || mp.stone_price || l.stone_price,
        stone_cost: p.stone_cost || mp.stone_cost || l.stone_cost,
        stone_details: p.stone_details || mp.stone_details || l.stone_details,
        category_id: categoryId,
        manufacturer_name: isCustom ? (retailer.shop_name || "In-House Local Artisans") : mp.manufacturer?.company_name,
        retailer_name: retailer.shop_name,
        manufacturer_price: isCustom ? null : mp.manufacturer_price,
        selling_price: l.selling_price || p.retailer_price,
        stock: l.stock,
        status: l.status || p.status,
        image_url: imgUrl,
        created_at: l.created_at,
        updated_at: l.updated_at,
      }, liveRates);
    });

    const formattedStandalone = standaloneProducts
      .filter((p) => !existingProductIds.has(p.id))
      .map((p) => {
        const imgUrl = imageMap.get(p.id);
        return normalizeProduct({
          ...p,
          product_source: "RETAILER",
          retailer_id: retailer.id,
          retailer_name: retailer.shop_name,
          manufacturer_price: null,
          selling_price: p.retailer_price || p.selling_price,
          image_url: imgUrl || p.image_url,
        }, liveRates);
      });

    const formatted = [...formattedListings, ...formattedStandalone];

    return res.status(200).json({
      success: true,
      data: formatted,
      listings: formatted,
    });
  } catch (err) {
    console.error("Error in getStoreListings:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// CREATE STORE LISTING (Add product to store)
// =========================
export const createListing = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);

    const { manufacturer_product_id, selling_price, stock, status } = req.body;

    if (!manufacturer_product_id || selling_price == null || stock == null) {
      return res.status(400).json({
        success: false,
        message: "manufacturer_product_id, selling_price, and stock are required",
      });
    }

    if (Number(selling_price) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Selling price must be greater than zero",
      });
    }

    // Check if manufacturer product exists
    const { data: mProd } = await supabaseAdmin
      .from("manufacturer_products")
      .select("id, name, manufacturer_price")
      .eq("id", manufacturer_product_id)
      .maybeSingle();

    if (!mProd) {
      return res.status(404).json({
        success: false,
        message: "Manufacturer catalog product not found",
      });
    }

    // Check if listing already exists for this retailer
    const { data: existing } = await supabaseAdmin
      .from("retailer_products")
      .select("*")
      .eq("retailer_id", retailer.id)
      .eq("manufacturer_product_id", manufacturer_product_id)
      .maybeSingle();

    if (existing) {
      // Update existing listing
      const { data: updated, error: uErr } = await supabaseAdmin
        .from("retailer_products")
        .update({
          selling_price: Number(selling_price),
          stock: Number(stock),
          status: Number(stock) > 0 ? (status || "ACTIVE") : "OUT_OF_STOCK",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (uErr) {
        return res.status(400).json({ success: false, message: uErr.message });
      }

      return res.status(200).json({
        success: true,
        message: "Updated existing store listing",
        data: updated,
      });
    }

    // Create new store listing
    const { data: newListing, error: iErr } = await supabaseAdmin
      .from("retailer_products")
      .insert({
        retailer_id: retailer.id,
        manufacturer_product_id: manufacturer_product_id,
        selling_price: Number(selling_price),
        stock: Number(stock),
        status: Number(stock) > 0 ? (status || "ACTIVE") : "OUT_OF_STOCK",
      })
      .select()
      .single();

    if (iErr) {
      return res.status(400).json({
        success: false,
        message: iErr.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product listed in your store successfully",
      data: newListing,
    });
  } catch (err) {
    console.error("Error in createListing:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GET SINGLE RETAILER PRODUCT BY ID
// =========================
export const getRetailerProductById = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const { id } = req.params;

    // Check retailer_products table first
    const { data: listing } = await supabaseAdmin
      .from("retailer_products")
      .select(`
        *,
        manufacturer_product:manufacturer_products (
          id, name, description, material, purity, weight, category_id, manufacturer_price, status,
          manufacturer:manufacturers(id, company_name)
        )
      `)
      .eq("id", id)
      .eq("retailer_id", retailer.id)
      .maybeSingle();

    if (listing) {
      const mp = listing.manufacturer_product || {};
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("image_url")
        .or(`manufacturer_product_id.eq.${mp.id},product_id.eq.${listing.product_id || listing.id}`)
        .maybeSingle();

      const normalized = normalizeProduct({
        id: listing.id,
        retailer_product_id: listing.id,
        product_id: listing.product_id,
        manufacturer_product_id: listing.manufacturer_product_id,
        retailer_id: retailer.id,
        retailer_name: retailer.shop_name,
        name: mp.name || listing.name || "Retailer Product",
        description: mp.description || listing.description || "",
        material: mp.material || listing.material || "Gold",
        purity: mp.purity || listing.purity || "22K",
        weight: mp.weight || listing.weight || 10,
        category_id: mp.category_id || listing.category_id,
        selling_price: listing.selling_price,
        stock: listing.stock,
        status: listing.status || "ACTIVE",
        image_url: img?.image_url,
        created_at: listing.created_at,
        updated_at: listing.updated_at,
      });

      return res.status(200).json({
        success: true,
        data: normalized,
        product: normalized,
      });
    }

    // Check products table fallback for standalone retailer product
    const { data: standalone } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", id)
      .eq("retailer_id", retailer.id)
      .maybeSingle();

    if (standalone) {
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("image_url")
        .eq("product_id", standalone.id)
        .maybeSingle();

      const normalized = normalizeProduct({
        ...standalone,
        product_source: "RETAILER",
        retailer_id: retailer.id,
        retailer_name: retailer.shop_name,
        selling_price: standalone.retailer_price || standalone.selling_price,
        image_url: img?.image_url || standalone.image_url,
      });

      return res.status(200).json({
        success: true,
        data: normalized,
        product: normalized,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Retailer product not found or unauthorized",
    });
  } catch (err) {
    console.error("Error in getRetailerProductById:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// UPDATE STORE LISTING / PRODUCT (Edit price/stock/status/details - Owner Retailer Only)
// =========================
export const updateListing = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const { id } = req.params;
    const { selling_price, stock, status, name, description, material, purity, weight, category_id } = req.body;

    // Check retailer_products table first
    const { data: existing } = await supabaseAdmin
      .from("retailer_products")
      .select("id, retailer_id, product_id, manufacturer_product_id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      if (existing.retailer_id !== retailer.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only edit listings owned by your retailer account",
        });
      }

      const updateFields = {
        updated_at: new Date().toISOString(),
      };

      if (selling_price != null) updateFields.selling_price = Number(selling_price);
      if (stock != null) {
        const numStock = Number(stock);
        updateFields.stock = numStock;
        if (numStock === 0) {
          updateFields.status = "OUT_OF_STOCK";
        }
      }
      if (status && updateFields.stock !== 0) updateFields.status = status;

      const { data: updated, error } = await supabaseAdmin
        .from("retailer_products")
        .update(updateFields)
        .eq("id", id)
        .eq("retailer_id", retailer.id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      // If product details provided and linked to custom standalone product, update products table as well
      if (existing.product_id && (name || description || material || purity || weight || category_id)) {
        const pFields = {};
        if (name) pFields.name = name;
        if (description) pFields.description = description;
        if (material) pFields.material = material;
        if (purity) pFields.purity = purity;
        if (weight != null) pFields.weight = Number(weight);
        if (category_id) pFields.category_id = category_id;
        if (selling_price != null) pFields.retailer_price = Number(selling_price);
        if (status) pFields.status = status;

        try {
          await supabaseAdmin.from("products").update(pFields).eq("id", existing.product_id);
        } catch (_) {}
      }

      return res.status(200).json({
        success: true,
        message: "Listing updated successfully",
        data: updated,
      });
    }

    // Fallback: Check products table for standalone custom retailer product
    const { data: standalone } = await supabaseAdmin
      .from("products")
      .select("id, retailer_id")
      .eq("id", id)
      .maybeSingle();

    if (standalone) {
      if (standalone.retailer_id !== retailer.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only edit products owned by your retailer account",
        });
      }

      const pFields = { updated_at: new Date().toISOString() };
      if (name) pFields.name = name;
      if (description) pFields.description = description;
      if (material) pFields.material = material;
      if (purity) pFields.purity = purity;
      if (weight != null) pFields.weight = Number(weight);
      if (category_id) pFields.category_id = category_id;
      if (selling_price != null) pFields.retailer_price = Number(selling_price);
      if (status) pFields.status = status;

      const { data: updatedProd, error: pErr } = await supabaseAdmin
        .from("products")
        .update(pFields)
        .eq("id", id)
        .select()
        .single();

      if (pErr) {
        return res.status(400).json({ success: false, message: pErr.message });
      }

      return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        data: updatedProd,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Retailer product not found",
    });
  } catch (err) {
    console.error("Error in updateListing:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// PATCH RETAILER PRODUCT STATUS (ACTIVE / INACTIVE / OUT_OF_STOCK)
// =========================
export const updateRetailerProductStatus = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required (e.g. ACTIVE or INACTIVE)",
      });
    }

    const upperStatus = status.toUpperCase();

    // Check retailer_products table first
    const { data: existing } = await supabaseAdmin
      .from("retailer_products")
      .select("id, retailer_id, product_id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      if (existing.retailer_id !== retailer.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only update products owned by your retailer account",
        });
      }

      const { data: updated, error } = await supabaseAdmin
        .from("retailer_products")
        .update({
          status: upperStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        return res.status(400).json({ success: false, message: error.message });
      }

      // Also update linked standalone product if exists
      if (existing.product_id) {
        try {
          await supabaseAdmin
            .from("products")
            .update({ status: upperStatus, updated_at: new Date().toISOString() })
            .eq("id", existing.product_id);
        } catch (_) {}
      }

      return res.status(200).json({
        success: true,
        message: `Product status updated to ${upperStatus} successfully`,
        data: updated,
      });
    }

    // Check products table fallback for standalone retailer product
    const { data: standalone } = await supabaseAdmin
      .from("products")
      .select("id, retailer_id")
      .eq("id", id)
      .maybeSingle();

    if (standalone) {
      if (standalone.retailer_id !== retailer.id) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You can only update products owned by your retailer account",
        });
      }

      const { data: updatedProd, error: pErr } = await supabaseAdmin
        .from("products")
        .update({
          status: upperStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (pErr) {
        return res.status(400).json({ success: false, message: pErr.message });
      }

      return res.status(200).json({
        success: true,
        message: `Product status updated to ${upperStatus} successfully`,
        data: updatedProd,
      });
    }

    return res.status(404).json({
      success: false,
      message: "Retailer product not found",
    });
  } catch (err) {
    console.error("Error in updateRetailerProductStatus:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// DELETE STORE LISTING (Owner Retailer Only)
// =========================
export const deleteListing = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const { id } = req.params;

    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("retailer_products")
      .select("id, retailer_id")
      .eq("id", id)
      .maybeSingle();

    if (existing && existing.retailer_id !== retailer.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only delete listings owned by your retailer account",
      });
    }

    const { error } = await supabaseAdmin
      .from("retailer_products")
      .delete()
      .eq("id", id)
      .eq("retailer_id", retailer.id);

    // Also attempt deleting standalone product from products table if matching
    try {
      await supabaseAdmin.from("products").delete().eq("id", id).eq("retailer_id", retailer.id);
    } catch (_) {}

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Listing removed from store successfully",
    });
  } catch (err) {
    console.error("Error in deleteListing:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GET STORE CUSTOMER ORDERS (Retailer Order Tracking)
// =========================
export const getStoreOrders = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);

    // Fetch retailer's listed products
    const { data: listings } = await supabaseAdmin
      .from("retailer_products")
      .select("id, manufacturer_product_id")
      .eq("retailer_id", retailer.id);

    const listingIds = (listings || []).map((l) => l.id);
    const mProdIds = (listings || []).map((l) => l.manufacturer_product_id);

    if (listingIds.length === 0 && mProdIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        orders: [],
      });
    }

    // Query order_items that match retailer product or manufacturer product
    const { data: orderItems } = await supabaseAdmin
      .from("order_items")
      .select("order_id, product_id, quantity, price");

    const matchedOrderIds = new Set();
    (orderItems || []).forEach((oi) => {
      if (listingIds.includes(oi.product_id) || mProdIds.includes(oi.product_id)) {
        matchedOrderIds.add(oi.order_id);
      }
    });

    if (matchedOrderIds.size === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        orders: [],
      });
    }

    // Fetch full order details including customer, order_items
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        customer:customers(
          id, user_id, address, phone
        ),
        items:order_items(*)
      `)
      .in("id", Array.from(matchedOrderIds))
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
      });
    }

    // Fetch customer user records to get customer full_name, email, phone
    const userIds = (orders || [])
      .map((o) => o.customer?.user_id)
      .filter(Boolean);
    
    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: usersData } = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, phone")
        .in("id", userIds);
      (usersData || []).forEach((u) => userMap.set(u.id, u));
    }

    // Fetch manufacturer_products and manufacturers details
    const { data: mProds } = await supabaseAdmin
      .from("manufacturer_products")
      .select(`
        id, name, description, material, purity, weight,
        manufacturer:manufacturers(id, company_name)
      `);
    
    const mProdMap = new Map();
    (mProds || []).forEach((mp) => mProdMap.set(mp.id, mp));

    // Fetch retailer_products mapping to manufacturer_products
    const { data: rProds } = await supabaseAdmin
      .from("retailer_products")
      .select("id, manufacturer_product_id");
    const rProdMap = new Map();
    (rProds || []).forEach((rp) => rProdMap.set(rp.id, rp.manufacturer_product_id));

    // Fetch product images
    const { data: images } = await supabaseAdmin.from("product_images").select("*");
    const imageMap = new Map();
    (images || []).forEach((img) => {
      if (!imageMap.has(img.manufacturer_product_id)) {
        imageMap.set(img.manufacturer_product_id, img.image_url);
      }
    });

    // Process and enrich orders with 5 mandatory attributes:
    // Customer, Manufacturer, Product, Total, Fulfillment Status
    const formattedOrders = (orders || []).map((ord) => {
      const custUser = userMap.get(ord.customer?.user_id) || {};
      const customerName = custUser.full_name || "Valued Customer";
      const customerEmail = custUser.email || "";
      const customerPhone = custUser.phone || ord.customer?.phone || "";
      const shippingAddr = ord.shipping_address || ord.customer?.address || "Address Provided at Checkout";

      const enrichedItems = (ord.items || []).map((item) => {
        let mpId = item.product_id;
        if (rProdMap.has(item.product_id)) {
          mpId = rProdMap.get(item.product_id);
        }

        const mp = mProdMap.get(mpId) || {};
        const productName = mp.name || "Handcrafted Jewellery";
        const manufacturerName = mp.manufacturer?.company_name || "Master Artisan";
        const imageUrl = imageMap.get(mpId) || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";
        const itemPrice = Number(item.price || 0);
        const qty = Number(item.quantity || 1);
        const subtotal = itemPrice * qty;

        return {
          id: item.id,
          product_id: item.product_id,
          product_name: productName,
          name: productName,
          manufacturer_name: manufacturerName,
          manufacturer: manufacturerName,
          price: itemPrice,
          quantity: qty,
          subtotal: subtotal,
          image_url: imageUrl,
          image: imageUrl,
        };
      });

      const primaryProduct = enrichedItems.map((i) => `${i.product_name} (x${i.quantity})`).join(", ") || "Handcrafted Jewellery";
      const primaryManufacturer = Array.from(new Set(enrichedItems.map((i) => i.manufacturer_name))).join(", ") || "Master Artisan";

      return {
        id: ord.id,
        order_number: ord.id?.startsWith("ORD-") ? ord.id : `ORD-${ord.id?.slice(0, 8)}`,
        created_at: ord.created_at,
        customer: {
          name: customerName,
          full_name: customerName,
          email: customerEmail,
          phone: customerPhone,
          address: shippingAddr,
        },
        customer_name: customerName,
        shipping_address: shippingAddr,
        product_name: primaryProduct,
        manufacturer_name: primaryManufacturer,
        manufacturer: primaryManufacturer,
        items: enrichedItems,
        total_amount: Number(ord.total_amount || 0),
        total: Number(ord.total_amount || 0),
        order_status: ord.order_status || "PENDING",
        fulfillment_status: ord.order_status || "PENDING",
        status: ord.order_status || "PENDING",
        payment_status: ord.payment_status || "PAID",
        payment_method: ord.payment_method || "Online Payment",
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedOrders,
      orders: formattedOrders,
    });
  } catch (err) {
    console.error("Error in getStoreOrders:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GET BULLION RATES (Live Gold, Silver, Platinum market rates)
// =========================
export const getBullionRates = async (req, res) => {
  try {
    const live = await getLatestBenchmarkRates();
    const g24 = live.gold_24k;
    const rates = {
      gold24k: g24,
      gold22k: Math.round(g24 * (22 / 24)),
      gold18k: Math.round(g24 * (18 / 24)),
      gold14k: Math.round(g24 * (14 / 24)),
      silver925: live.silver,
      platinum950: 3120,
      currency: "INR",
      lastUpdated: new Date().toISOString(),
      priceLockDurationHours: 2,
    };

    return res.status(200).json({
      success: true,
      data: rates,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// CREATE CUSTOM RETAILER-OWNED PRODUCT
// =========================
export const createCustomProduct = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);

    const {
      name,
      description,
      category,
      category_id,
      material = "Gold",
      purity = "22K",
      weight = 10,
      fixed_price,
      retailer_price,
      selling_price = 0,
      stock = 5,
      status = "ACTIVE",
      image_url = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });
    }

    const rPrice = Number(selling_price || retailer_price || fixed_price || 0);

    // Resolve category ID
    let finalCategoryId = category_id;
    if (!finalCategoryId && category) {
      const { data: cat } = await supabaseAdmin
        .from("categories")
        .select("id")
        .ilike("name", `%${category}%`)
        .maybeSingle();
      if (cat) finalCategoryId = cat.id;
    }

    if (!finalCategoryId) {
      const { data: cats } = await supabaseAdmin.from("categories").select("id").limit(1);
      if (cats && cats.length > 0) finalCategoryId = cats[0].id;
    }

    // Rule for retailer-created product:
    // manufacturer_id = NULL
    // retailer_id = retailer.id
    // product_source = RETAILER
    const productPayload = {
      manufacturer_id: null,
      retailer_id: retailer.id,
      category_id: finalCategoryId,
      name,
      description: description || "Retailer exclusive product.",
      material,
      purity,
      weight: weight != null ? Number(weight) : null,
      manufacturer_price: null,
      retailer_price: rPrice,
      product_source: "RETAILER",
      status: status || "ACTIVE",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    let createdProduct = null;

    // 1. Try inserting into products table
    const { data: prodData } = await supabaseAdmin
      .from("products")
      .insert(productPayload)
      .select()
      .maybeSingle();

    if (prodData) {
      createdProduct = prodData;

      // Upload image if provided
      if (image_url) {
        try {
          await supabaseAdmin.from("product_images").insert({
            product_id: prodData.id,
            image_url: image_url,
            is_primary: true,
          });
        } catch (_) {}
      }

      // Insert store listing into retailer_products
      const { data: listingData } = await supabaseAdmin
        .from("retailer_products")
        .insert({
          retailer_id: retailer.id,
          product_id: prodData.id,
          selling_price: rPrice,
          stock: Number(stock) || 1,
          status: Number(stock) > 0 ? "ACTIVE" : "OUT_OF_STOCK",
        })
        .select()
        .maybeSingle();

      createdProduct = {
        ...prodData,
        retailer_product_id: listingData?.id || prodData.id,
        retailer_id: retailer.id,
        product_source: "RETAILER",
        is_custom: true,
        sourcing_type: "RETAILER_CUSTOM",
        selling_price: rPrice,
        stock: Number(stock) || 1,
        image_url: image_url || prodData.image_url,
      };
    } else {
      // 2. Fallback if products table does not exist yet in Supabase schema cache:
      // Resolve or create dedicated "In-House Retailer Artisans" manufacturer profile
      let { data: mfg } = await supabaseAdmin
        .from("manufacturers")
        .select("id, company_name")
        .eq("company_name", "In-House Retailer Artisans")
        .maybeSingle();

      if (!mfg) {
        const { data: newMfg, error: mfgErr } = await supabaseAdmin
          .from("manufacturers")
          .insert({
            user_id: req.user?.id,
            company_name: "In-House Retailer Artisans",
            description: "System in-house artisan profile for retailer custom stock",
          })
          .select("id, company_name")
          .single();

        if (!mfgErr && newMfg) {
          mfg = newMfg;
        } else {
          // Fallback to first available mfg record if user_id conflict occurs
          const { data: firstMfg } = await supabaseAdmin
            .from("manufacturers")
            .select("id, company_name")
            .limit(1)
            .single();
          mfg = firstMfg;
        }
      }

      // Insert master item into manufacturer_products with [RETAILER_CUSTOM] tag
      const customDesc = `[RETAILER_CUSTOM] ${description || "Retailer in-house product"}`;
      const { data: mData, error: mErr } = await supabaseAdmin
        .from("manufacturer_products")
        .insert({
          manufacturer_id: mfg.id,
          category_id: finalCategoryId,
          name,
          description: customDesc,
          material,
          purity,
          weight: weight != null ? Number(weight) : null,
          manufacturer_price: 0,
          status: status || "ACTIVE",
        })
        .select()
        .single();

      if (mErr) {
        console.error("Error creating custom product fallback:", mErr);
        return res.status(400).json({ success: false, message: mErr.message });
      }

      // Insert image if provided
      if (image_url) {
        try {
          await supabaseAdmin.from("product_images").insert({
            manufacturer_product_id: mData.id,
            image_url: image_url,
            is_primary: true,
          });
        } catch (_) {}
      }

      // Insert store listing into retailer_products
      const { data: listingData } = await supabaseAdmin
        .from("retailer_products")
        .insert({
          retailer_id: retailer.id,
          manufacturer_product_id: mData.id,
          selling_price: rPrice,
          stock: Number(stock) || 1,
          status: Number(stock) > 0 ? "ACTIVE" : "OUT_OF_STOCK",
        })
        .select()
        .single();

      createdProduct = {
        id: listingData?.id || mData.id,
        retailer_product_id: listingData?.id || mData.id,
        manufacturer_product_id: mData.id,
        retailer_id: retailer.id,
        product_source: "RETAILER",
        is_custom: true,
        sourcing_type: "RETAILER_CUSTOM",
        name,
        description,
        material,
        purity,
        weight: Number(weight),
        selling_price: rPrice,
        stock: Number(stock),
        status: "ACTIVE",
        image_url,
        image: image_url,
      };
    }

    return res.status(201).json({
      success: true,
      message: "Retailer-owned custom product created successfully",
      data: createdProduct,
    });
  } catch (err) {
    console.error("Error in createCustomProduct:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
