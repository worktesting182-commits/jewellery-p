import { supabaseAdmin } from "../config/supabase.js";
import { normalizeProduct } from "../utils/productModel.js";
import { getLatestBenchmarkRates } from "../utils/pricingEngine.js";

// Operational resilience fallback store keyed by customer_id:retailer_id
const inMemoryCarts = new Map();

/**
 * Fetch product details from Supabase products or retailer_products table
 */
export async function getProductDetails(productId) {
  try {
    const liveRates = await getLatestBenchmarkRates();

    // 1. Query retailer_products table (Customer Retailer Storefront Listing)
    const { data: listing } = await supabaseAdmin
      .from("retailer_products")
      .select(`
        *,
        manufacturer_product:manufacturer_products (*)
      `)
      .eq("id", productId)
      .maybeSingle();

    if (listing) {
      const mp = listing.manufacturer_product || {};
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("image_url")
        .eq("manufacturer_product_id", mp.id)
        .maybeSingle();

      const imgUrl = img?.image_url;
      return normalizeProduct({
        id: listing.id,
        retailer_product_id: listing.id,
        manufacturer_product_id: mp.id,
        manufacturer_id: mp.manufacturer_id,
        retailer_id: listing.retailer_id,
        product_source: "MANUFACTURER",
        name: mp.name,
        description: mp.description,
        material: mp.material,
        purity: mp.purity,
        weight: mp.weight,
        making_charge_type: mp.making_charge_type || listing.making_charge_type,
        making_charge_value: mp.making_charge_value || listing.making_charge_value,
        stone_price: mp.stone_price || listing.stone_price,
        stone_cost: mp.stone_cost || listing.stone_cost,
        stone_details: mp.stone_details || listing.stone_details,
        manufacturer_price: mp.manufacturer_price,
        selling_price: listing.selling_price,
        stock: listing.stock,
        status: listing.status,
        image_url: imgUrl,
      }, liveRates);
    }

    // 2. Check products table directly
    const { data: prod } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (prod) {
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("image_url")
        .or(`product_id.eq.${prod.id},manufacturer_product_id.eq.${prod.id}`)
        .maybeSingle();

      const imgUrl = img?.image_url;
      return normalizeProduct({
        ...prod,
        image_url: imgUrl || prod.image_url,
      }, liveRates);
    }

    // 3. Fallback: Query retailer_products by manufacturer_product_id
    const { data: listingByMp } = await supabaseAdmin
      .from("retailer_products")
      .select(`
        *,
        manufacturer_product:manufacturer_products (*)
      `)
      .eq("manufacturer_product_id", productId)
      .maybeSingle();

    if (listingByMp) {
      const mp = listingByMp.manufacturer_product || {};
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("image_url")
        .eq("manufacturer_product_id", mp.id)
        .maybeSingle();

      const imgUrl = img?.image_url;
      return normalizeProduct({
        id: listingByMp.id,
        retailer_product_id: listingByMp.id,
        manufacturer_product_id: mp.id,
        manufacturer_id: mp.manufacturer_id,
        retailer_id: listingByMp.retailer_id,
        product_source: "MANUFACTURER",
        name: mp.name,
        description: mp.description,
        material: mp.material,
        purity: mp.purity,
        weight: mp.weight,
        making_charge_type: mp.making_charge_type || listingByMp.making_charge_type,
        making_charge_value: mp.making_charge_value || listingByMp.making_charge_value,
        stone_price: mp.stone_price || listingByMp.stone_price,
        stone_cost: mp.stone_cost || listingByMp.stone_cost,
        stone_details: mp.stone_details || listingByMp.stone_details,
        manufacturer_price: mp.manufacturer_price,
        selling_price: listingByMp.selling_price,
        stock: listingByMp.stock,
        status: listingByMp.status,
        image_url: imgUrl,
      }, liveRates);
    }

    return null;
  } catch (err) {
    console.error("Error fetching product details for cart:", err);
    return null;
  }
}

/**
 * Format a single cart item according to API spec
 */
export function formatCartItem(cartRow, product) {
  const price = Number(product?.price || cartRow.price || cartRow.unitPrice || 0);
  const quantity = Number(cartRow.quantity || 1);
  const subtotal = price * quantity;
  const image = product?.image_url || product?.image || cartRow.image_url || cartRow.image || cartRow.product_image || "";
  const productName = product?.name || cartRow.product_name || cartRow.productName || cartRow.name || "Jewellery Item";
  const productId = cartRow.product_id || product?.id || cartRow.productId;
  const itemId = cartRow.id || cartRow._id || cartRow.product_id || productId;

  return {
    _id: itemId,
    id: itemId,
    cart_id: itemId,
    product_id: productId,
    productId: productId,
    retailer_id: cartRow.retailer_id || product?.retailer_id,
    name: productName,
    productName: productName,
    product_name: productName,
    image: image,
    image_url: image,
    product_image: image,
    price: price,
    unitPrice: price,
    quantity: quantity,
    subtotal: subtotal,
    product: product || {
      id: productId,
      name: productName,
      price: price,
      image_url: image,
    },
  };
}

/**
 * Service 1: Get Customer Cart Isolated strictly by Retailer ID
 */
export const getCart = async (userId, retailerId, customerId) => {
  let items = [];
  const activeRetailerId = retailerId;
  const activeCustId = customerId || userId;
  let cartId = `cart_${activeCustId}_${activeRetailerId}`;

  // Query Supabase `carts` table scoped strictly by customer_id and retailer_id
  let query = supabaseAdmin
    .from("carts")
    .select("*, product:products(*)");

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else {
    query = query.eq("user_id", userId);
  }

  if (activeRetailerId) {
    query = query.eq("retailer_id", activeRetailerId);
  }

  const { data: dbCart, error: dbErr } = await query;

  if (!dbErr && dbCart && dbCart.length > 0) {
    cartId = dbCart[0].id || cartId;
    items = dbCart.map((row) => formatCartItem(row, row.product));
  } else {
    // Fallback to in-memory store keyed by customerId:retailerId
    const memKey = `${activeCustId}:${activeRetailerId}`;
    const userCart = inMemoryCarts.get(memKey) || [];
    for (const item of userCart) {
      const product = await getProductDetails(item.product_id);
      items.push(formatCartItem(item, product));
    }
  }

  const grandTotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  return {
    success: true,
    cart: {
      _id: cartId,
      retailer_id: activeRetailerId,
      items: items,
      grandTotal: grandTotal,
    },
  };
};

/**
 * Service 2: Add Product to Retailer-Scoped Cart
 * CRITICAL RULE: Verifies product belongs strictly to target retailerId.
 * NEVER allows mixing products from Retailer A and Retailer B in one cart.
 */
export const addToCart = async (userId, productId, quantity, retailerId, customerId) => {
  if (!productId) {
    const error = new Error("productId is required.");
    error.statusCode = 400;
    throw error;
  }

  if (!retailerId) {
    const error = new Error("Retailer context (x-retailer-id) is required to add items to cart.");
    error.statusCode = 400;
    throw error;
  }

  const addQty = parseInt(quantity, 10);
  if (isNaN(addQty) || addQty <= 0) {
    const error = new Error("Quantity must be a positive integer.");
    error.statusCode = 400;
    throw error;
  }

  // 1. Fetch product details
  const product = await getProductDetails(productId);
  if (!product) {
    const error = new Error("Product not found.");
    error.statusCode = 404;
    throw error;
  }

  // 2. CRITICAL MULTI-TENANT RULE: Verify product belongs strictly to active retailer context!
  if (product.retailer_id && product.retailer_id !== retailerId) {
    const error = new Error("Conflict: This product belongs to another retailer storefront. Mixed-retailer carts are strictly prohibited.");
    error.statusCode = 409;
    throw error;
  }

  // 3. Status checks (discontinued / unavailable)
  const isDiscontinued = product.is_discontinued === true || product.status === "discontinued" || product.status === "DISCONTINUED";
  if (isDiscontinued) {
    const error = new Error(`Product "${product.name || "item"}" has been discontinued and cannot be ordered.`);
    error.statusCode = 400;
    throw error;
  }

  const stock = product.stock !== undefined ? product.stock : (product.stock_quantity !== undefined ? product.stock_quantity : 999);
  const isUnavailable = product.is_active === false || product.status === "inactive" || product.status === "UNAVAILABLE" || product.status === "OUT_OF_STOCK" || stock <= 0;
  if (isUnavailable) {
    const error = new Error(`Product "${product.name || "item"}" is currently unavailable or out of stock.`);
    error.statusCode = 409;
    throw error;
  }

  // 4. Fetch current existing quantity in active retailer cart
  let currentCartQty = 0;
  let existingItem = null;

  const activeCustId = customerId || userId;

  let query = supabaseAdmin
    .from("carts")
    .select("*")
    .eq("product_id", productId)
    .eq("retailer_id", retailerId);

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else {
    query = query.eq("user_id", userId);
  }

  const { data: dbItem } = await query.maybeSingle();

  if (dbItem) {
    existingItem = dbItem;
    currentCartQty = dbItem.quantity || 0;
  } else {
    const memKey = `${activeCustId}:${retailerId}`;
    const userCart = inMemoryCarts.get(memKey) || [];
    const memItem = userCart.find((i) => i.product_id === productId);
    if (memItem) {
      existingItem = memItem;
      currentCartQty = memItem.quantity || 0;
    }
  }

  const totalRequestedQty = currentCartQty + addQty;

  if (totalRequestedQty > stock) {
    const error = new Error(`Stock limit reached. Only ${stock} available.`);
    error.statusCode = 409;
    throw error;
  }

  // 5. Update existing row or Insert new retailer-scoped cart item
  if (existingItem) {
    await supabaseAdmin
      .from("carts")
      .update({ quantity: totalRequestedQty })
      .eq("id", existingItem.id);
  } else {
    const newItem = {
      customer_id: customerId || null,
      user_id: userId,
      retailer_id: retailerId,
      product_id: productId,
      quantity: addQty,
    };

    const { error: insertErr } = await supabaseAdmin
      .from("carts")
      .insert(newItem);

    if (insertErr) {
      console.warn("Notice inserting into carts table:", insertErr.message);
      const memKey = `${activeCustId}:${retailerId}`;
      let userCart = inMemoryCarts.get(memKey) || [];
      userCart.push({ id: `mem_${Date.now()}`, ...newItem });
      inMemoryCarts.set(memKey, userCart);
    }
  }

  return {
    success: true,
    message: `Product added to ${product.name || "item"} cart for your active retailer.`,
    retailer_id: retailerId,
  };
};

/**
 * Service 3: Update Cart Quantity (Scoped by retailerId)
 */
export const updateCartItem = async (userId, itemId, quantity, retailerId, customerId) => {
  const newQty = parseInt(quantity, 10);
  if (isNaN(newQty) || newQty <= 0) {
    const error = new Error("Quantity must be greater than 0.");
    error.statusCode = 400;
    throw error;
  }

  let query = supabaseAdmin.from("carts").update({ quantity: newQty }).eq("id", itemId);
  if (retailerId) {
    query = query.eq("retailer_id", retailerId);
  }

  await query;

  return {
    success: true,
    message: "Cart item updated successfully.",
  };
};

/**
 * Service 4: Remove Single Item (Scoped by retailerId)
 */
export const removeCartItem = async (userId, itemId, retailerId, customerId) => {
  let query = supabaseAdmin.from("carts").delete().eq("id", itemId);
  if (retailerId) {
    query = query.eq("retailer_id", retailerId);
  }

  await query;

  return {
    success: true,
    message: "Cart item removed.",
  };
};

/**
 * Service 5: Clear Cart (Scoped ONLY to active retailer context)
 */
export const clearCart = async (userId, retailerId, customerId) => {
  let query = supabaseAdmin.from("carts").delete();

  if (customerId) {
    query = query.eq("customer_id", customerId);
  } else {
    query = query.eq("user_id", userId);
  }

  if (retailerId) {
    query = query.eq("retailer_id", retailerId);
  }

  await query;

  const memKey = `${customerId || userId}:${retailerId}`;
  inMemoryCarts.delete(memKey);

  return {
    success: true,
    message: "Active retailer cart cleared.",
  };
};
