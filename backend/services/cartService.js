import { supabaseAdmin } from "../config/supabase.js";
import { normalizeProduct } from "../utils/productModel.js";
import { getLatestBenchmarkRates } from "../utils/pricingEngine.js";

// Operational resilience fallback store keyed by user ID
const inMemoryCarts = new Map();

/**
 * Fetch product details from Supabase products table
 */
export async function getProductDetails(productId) {
  try {
    const liveRates = await getLatestBenchmarkRates();

    // 1. Check products table directly
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

    // 2. Query retailer_products table (Customer Marketplace Item)
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

    // 4. Query manufacturer_products table directly
    const { data: mpOnly } = await supabaseAdmin
      .from("manufacturer_products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (mpOnly) {
      const { data: img } = await supabaseAdmin
        .from("product_images")
        .select("image_url")
        .eq("manufacturer_product_id", mpOnly.id)
        .maybeSingle();

      const imgUrl = img?.image_url;
      return normalizeProduct({
        id: mpOnly.id,
        manufacturer_product_id: mpOnly.id,
        manufacturer_id: mpOnly.manufacturer_id,
        product_source: "MANUFACTURER",
        name: mpOnly.name,
        description: mpOnly.description,
        material: mpOnly.material,
        purity: mpOnly.purity,
        weight: mpOnly.weight,
        making_charge_type: mpOnly.making_charge_type,
        making_charge_value: mpOnly.making_charge_value,
        stone_price: mpOnly.stone_price,
        stone_cost: mpOnly.stone_cost,
        stone_details: mpOnly.stone_details,
        manufacturer_price: mpOnly.manufacturer_price,
        selling_price: mpOnly.wholesale_price || mpOnly.manufacturer_price || mpOnly.price,
        price: mpOnly.wholesale_price || mpOnly.manufacturer_price || mpOnly.price,
        stock: mpOnly.stock_quantity !== undefined ? mpOnly.stock_quantity : (mpOnly.stock || 10),
        status: mpOnly.status || "ACTIVE",
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
 * Service 1: Get Customer Cart
 */
export const getCart = async (userId) => {
  let items = [];
  let cartId = `cart_${userId}`;

  // Try fetching from Supabase `carts` table
  const { data: dbCart, error: dbErr } = await supabaseAdmin
    .from("carts")
    .select("*, product:products(*)")
    .eq("user_id", userId);

  if (!dbErr && dbCart && dbCart.length > 0) {
    cartId = dbCart[0].id || cartId;
    items = dbCart.map((row) => formatCartItem(row, row.product));
  } else {
    // Fallback to in-memory store
    const userCart = inMemoryCarts.get(userId) || [];
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
      items: items,
      grandTotal: grandTotal,
    },
  };
};

/**
 * Service 2: Add Product to Cart
 */
export const addToCart = async (userId, productId, quantity) => {
  if (!productId) {
    const error = new Error("productId is required");
    error.statusCode = 400;
    throw error;
  }

  const addQty = parseInt(quantity, 10);
  if (isNaN(addQty) || addQty <= 0) {
    const error = new Error("Quantity must be a positive integer");
    error.statusCode = 400;
    throw error;
  }

  // Rule 1: Product must exist
  const product = await getProductDetails(productId);
  if (!product) {
    const error = new Error("Product not found");
    error.statusCode = 404;
    throw error;
  }

  // Rule 4 (Module 9): Prevent ordering discontinued products
  const isDiscontinued = product.is_discontinued === true || product.status === "discontinued" || product.status === "DISCONTINUED";
  if (isDiscontinued) {
    const error = new Error(`Product "${product.name || "item"}" has been discontinued and cannot be ordered.`);
    error.statusCode = 400;
    throw error;
  }

  // Rule 5 (Module 9): Prevent ordering unavailable products
  const stock = product.stock !== undefined ? product.stock : (product.stock_quantity !== undefined ? product.stock_quantity : 999);
  const isUnavailable = product.is_active === false || product.status === "inactive" || product.status === "UNAVAILABLE" || product.status === "OUT_OF_STOCK" || stock <= 0;
  if (isUnavailable) {
    const error = new Error(`Product "${product.name || "item"}" is currently unavailable or out of stock.`);
    error.statusCode = 409;
    throw error;
  }

  // Fetch current existing quantity in cart
  let currentCartQty = 0;
  let existingItem = null;

  const { data: dbItem } = await supabaseAdmin
    .from("carts")
    .select("*")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (dbItem) {
    existingItem = dbItem;
    currentCartQty = dbItem.quantity || 0;
  } else {
    const userCart = inMemoryCarts.get(userId) || [];
    const memItem = userCart.find((i) => i.product_id === productId);
    if (memItem) {
      existingItem = memItem;
      currentCartQty = memItem.quantity || 0;
    }
  }

  const totalRequestedQty = currentCartQty + addQty;

  // Rule 5: Cannot exceed stock
  if (totalRequestedQty > stock) {
    const error = new Error(`Only ${stock} available.`);
    error.statusCode = 409;
    throw error;
  }

  // Rule 4: If already exists, quantity += new quantity
  if (existingItem) {
    const { error: updateErr } = await supabaseAdmin
      .from("carts")
      .update({ quantity: totalRequestedQty })
      .eq("user_id", userId)
      .eq("product_id", productId);

    if (updateErr) {
      // Update in-memory fallback
      let userCart = inMemoryCarts.get(userId) || [];
      const index = userCart.findIndex((i) => i.product_id === productId);
      if (index > -1) {
        userCart[index].quantity = totalRequestedQty;
      }
      inMemoryCarts.set(userId, userCart);
    }
  } else {
    // Insert new item
    const newItem = {
      id: `cart_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: userId,
      product_id: productId,
      quantity: addQty,
    };

    const { error: insertErr } = await supabaseAdmin
      .from("carts")
      .insert(newItem);

    if (insertErr) {
      let userCart = inMemoryCarts.get(userId) || [];
      userCart.push(newItem);
      inMemoryCarts.set(userId, userCart);
    }
  }

  return {
    success: true,
    message: "Product added to cart",
  };
};

/**
 * Service 3: Update Cart Quantity
 */
export const updateCartItem = async (userId, itemId, quantity) => {
  const newQty = parseInt(quantity, 10);

  // Business Rule: Quantity must be > 0
  if (isNaN(newQty) || newQty <= 0) {
    const error = new Error("Quantity must be greater than 0");
    error.statusCode = 400;
    throw error;
  }

  // Find cart item
  let productId = null;
  const { data: dbItem } = await supabaseAdmin
    .from("carts")
    .select("*")
    .or(`id.eq.${itemId},product_id.eq.${itemId}`)
    .eq("user_id", userId)
    .maybeSingle();

  if (dbItem) {
    productId = dbItem.product_id;
  } else {
    const userCart = inMemoryCarts.get(userId) || [];
    const memItem = userCart.find((i) => i.id === itemId || i.product_id === itemId);
    if (memItem) {
      productId = memItem.product_id;
    }
  }

  if (!productId) {
    const error = new Error("Cart item not found");
    error.statusCode = 404;
    throw error;
  }

  // Check product stock limit
  const product = await getProductDetails(productId);
  if (product) {
    const stock = product.stock !== undefined ? product.stock : (product.stock_quantity !== undefined ? product.stock_quantity : 999);
    if (newQty > stock) {
      const error = new Error(`Only ${stock} available.`);
      error.statusCode = 409;
      throw error;
    }
  }

  // Perform update in database
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("carts")
    .update({ quantity: newQty })
    .or(`id.eq.${itemId},product_id.eq.${itemId}`)
    .eq("user_id", userId)
    .select()
    .maybeSingle();

  if (updateErr || !updated) {
    // Update in-memory store
    let userCart = inMemoryCarts.get(userId) || [];
    const index = userCart.findIndex((i) => i.id === itemId || i.product_id === itemId);
    if (index > -1) {
      userCart[index].quantity = newQty;
      inMemoryCarts.set(userId, userCart);
    }
  }

  return {
    success: true,
    message: "Cart updated",
  };
};

/**
 * Service 4: Remove Single Item
 */
export const removeCartItem = async (userId, itemId) => {
  if (!itemId) {
    return { success: true, message: "Item removed" };
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId);
    if (isUuid) {
      await supabaseAdmin
        .from("carts")
        .delete()
        .or(`id.eq.${itemId},product_id.eq.${itemId}`)
        .eq("user_id", userId);
    } else {
      await supabaseAdmin
        .from("carts")
        .delete()
        .eq("id", itemId)
        .eq("user_id", userId);
    }
  } catch (err) {
    console.error("Supabase delete cart item error:", err);
  }

  // Remove from in-memory fallback
  let userCart = inMemoryCarts.get(userId) || [];
  userCart = userCart.filter(
    (i) => i.id !== itemId && i.product_id !== itemId && i._id !== itemId && i.productId !== itemId
  );
  inMemoryCarts.set(userId, userCart);

  return {
    success: true,
    message: "Item removed",
  };
};

/**
 * Service 5: Clear Complete Cart
 */
export const clearCart = async (userId) => {
  await supabaseAdmin
    .from("carts")
    .delete()
    .eq("user_id", userId);

  // Clear in-memory fallback
  inMemoryCarts.delete(userId);

  return {
    success: true,
    message: "Cart cleared",
  };
};
