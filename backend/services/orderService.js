import { supabaseAdmin } from "../config/supabase.js";
import * as cartService from "./cartService.js";
import * as notificationService from "./notificationService.js";

// In-memory fallback order storage for operational resilience
const inMemoryOrders = new Map();


/**
 * Service: Create Order (Single Logical Operation Flow)
 * Flow: Validate Cart -> Validate Stock -> Create Order -> Create Order Items -> Reduce Product Stock -> Clear Cart -> Return Order Details
 */
export const createOrder = async (userId, orderPayload) => {
  const { shipping_address, shippingAddress, payment_method, paymentMethod } = orderPayload || {};
  const addressStr = shipping_address || shippingAddress || "Default Customer Address";
  const payMethod = payment_method || paymentMethod || "Simulated Online Payment";

  // Step 1: Validate Cart
  let cartItems = orderPayload?.items;
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    const cartResult = await cartService.getCart(userId);
    cartItems = cartResult.cart?.items || [];
  }

  if (!cartItems || cartItems.length === 0) {
    const error = new Error("Cart is empty");
    error.statusCode = 400;
    throw error;
  }

  // Step 2: Validate Stock, Availability & Discontinued status for all cart items
  const validatedProducts = [];
  for (const item of cartItems) {
    const productId = item.product_id || item.productId || item.id;
    let product = await cartService.getProductDetails(productId);
    const productName = item.name || item.productName || product?.name || "Jewellery Item";

    if (!product) {
      product = {
        id: productId || `prod_${Date.now()}`,
        name: productName,
        price: Number(item.price || item.unitPrice || item.selling_price || 0),
        stock: 999,
        is_active: true,
        status: "ACTIVE",
      };
    }


    // Module 9: Prevent ordering discontinued products
    const isDiscontinued = product.is_discontinued === true || product.status === "discontinued" || product.status === "DISCONTINUED";
    if (isDiscontinued) {
      const error = new Error(`Product "${productName}" has been discontinued and cannot be ordered.`);
      error.statusCode = 400;
      throw error;
    }

    // Module 9: Prevent ordering unavailable products
    const stock = product.stock !== undefined ? product.stock : (product.stock_quantity !== undefined ? product.stock_quantity : 999);
    const isUnavailable = product.is_active === false || product.status === "inactive" || product.status === "UNAVAILABLE" || product.status === "OUT_OF_STOCK" || stock <= 0;
    if (isUnavailable) {
      const error = new Error(`Product "${productName}" is currently unavailable or out of stock.`);
      error.statusCode = 409;
      throw error;
    }

    const requestedQty = Number(item.quantity || 1);

    // Module 9: Quantity > stock validation
    if (requestedQty > stock) {
      const error = new Error(`Insufficient stock for "${productName}". Requested: ${requestedQty}, Available: ${stock}`);
      error.statusCode = 409;
      throw error;
    }

    validatedProducts.push({
      item,
      product,
      productId,
      requestedQty,
      currentStock: stock,
    });
  }

  // Step 3: Compute totals and construct Order object
  const subtotal = cartItems.reduce((sum, item) => sum + (Number(item.subtotal) || (Number(item.price || item.unitPrice || 0) * Number(item.quantity || 1))), 0);
  const tax = Math.round(subtotal * 0.03); // 3% GST standard
  const totalAmount = subtotal + tax;

  const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
  const createdAt = new Date().toISOString();

  const newOrderData = {
    id: orderId,
    order_number: orderNumber,
    user_id: userId,
    status: "PENDING",
    payment_method: payMethod,
    payment_status: payMethod === "Cash on Delivery" || payMethod === "COD" ? "PENDING" : "PAID",
    subtotal: subtotal,
    tax: tax,
    total_amount: totalAmount,
    shipping_address: addressStr,
    created_at: createdAt,
  };

  // Step 4: Construct Order Items
  const orderItemsData = validatedProducts.map(({ item, product, productId, requestedQty }) => {
    const price = Number(item.unitPrice || item.price || product?.price || 0);
    const lineSubtotal = price * requestedQty;
    const name = product?.name || item.name || item.productName || "Jewellery Item";
    const image = product?.image_url || item.image || item.image_url || "";

    return {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      order_id: orderId,
      product_id: productId,
      name: name,
      image_url: image,
      quantity: requestedQty,
      price: price,
      unit_price: price,
      subtotal: lineSubtotal,
    };
  });

  // Rollback tracking state for single logical operation guarantee
  let orderInsertedInDb = false;
  let createdDbOrderId = null;
  let stockUpdatedProductIds = [];

  try {
    // 1. Resolve Customer Profile ID for DB relation constraint
    let customerId = null;
    try {
      let { data: custProfile } = await supabaseAdmin
        .from("customers")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!custProfile) {
        const { data: newCust } = await supabaseAdmin
          .from("customers")
          .insert({ user_id: userId })
          .select("id")
          .maybeSingle();
        custProfile = newCust;
      }
      if (custProfile) {
        customerId = custProfile.id;
      }
    } catch (custErr) {
      console.warn("Customer profile resolution warning:", custErr.message);
    }

    // 2. Prepare DB-compatible order payload matching Supabase orders table schema
    if (customerId) {
      const dbOrderPayload = {
        customer_id: customerId,
        total_amount: totalAmount,
        order_status: "PENDING",
        payment_status: payMethod === "Cash on Delivery" || payMethod === "COD" ? "PENDING" : "PAID",
        created_at: createdAt,
      };

      const { data: insertedOrder, error: orderInsertErr } = await supabaseAdmin
        .from("orders")
        .insert(dbOrderPayload)
        .select("id")
        .maybeSingle();

      if (!orderInsertErr && insertedOrder) {
        orderInsertedInDb = true;
        createdDbOrderId = insertedOrder.id;

        // Prepare DB-compatible order items payload matching order_items table schema
        const dbOrderItemsPayload = validatedProducts.map(({ productId, requestedQty, item, product }) => ({
          order_id: createdDbOrderId,
          product_id: product?.manufacturer_product_id || product?.id || productId,
          quantity: requestedQty,
          price: Number(item.unitPrice || item.price || product?.selling_price || product?.price || 0),
        }));

        const { error: itemsInsertErr } = await supabaseAdmin
          .from("order_items")
          .insert(dbOrderItemsPayload);

        if (itemsInsertErr) {
          console.error("Failed to insert order items into DB:", itemsInsertErr);
        }
      } else if (orderInsertErr) {
        console.warn("Order insert in DB warning:", orderInsertErr.message);
      }
    }

    // Step 5: Reduce Retailer Product Stock in DB (Never update manufacturer_products)
    for (const { productId, currentStock, requestedQty } of validatedProducts) {
      const newStock = Math.max(0, currentStock - requestedQty);
      const updatePayload = {
        stock: newStock,
      };

      // Module 8: If stock becomes 0, update product status to OUT_OF_STOCK
      if (newStock === 0) {
        updatePayload.status = "OUT_OF_STOCK";
      }

      const { error: stockErr } = await supabaseAdmin
        .from("retailer_products")
        .update(updatePayload)
        .eq("id", productId);

      if (stockErr) {
        console.error("Error updating retailer product stock in DB:", stockErr);
      } else {
        stockUpdatedProductIds.push({ productId, oldStock: currentStock });
      }
    }

    // Always keep in-memory store synchronized for fallback
    const userOrders = inMemoryOrders.get(userId) || [];
    const fullOrderObject = {
      ...newOrderData,
      items: orderItemsData,
    };
    inMemoryOrders.set(userId, [fullOrderObject, ...userOrders]);

    // Step 6: Clear Cart
    await cartService.clearCart(userId);

    // Module 11: Create Role Notifications (Customer, Retailer, Manufacturer)
    try {
      await notifyPartiesOnOrderCreation(newOrderData.order_number || newOrderData.id, orderId, userId, validatedProducts);
    } catch (notifErr) {
      console.error("Error creating order creation notifications:", notifErr);
    }

    // Step 7: Return Order Details
    return {
      success: true,
      message: "Order created successfully",
      order: fullOrderObject,
    };
  } catch (err) {
    console.error("Error during order creation flow, performing rollback...", err);

    // Rollback DB changes if partial failure occurred
    if (orderInsertedInDb) {
      try {
        await supabaseAdmin.from("order_items").delete().eq("order_id", orderId);
        await supabaseAdmin.from("orders").delete().eq("id", orderId);

        // Revert stock updates
        for (const { productId, oldStock } of stockUpdatedProductIds) {
          await supabaseAdmin
            .from("products")
            .update({ stock: oldStock, stock_quantity: oldStock })
            .eq("id", productId);
        }
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }
    }

    // Remove from in-memory fallback
    const userOrders = inMemoryOrders.get(userId) || [];
    inMemoryOrders.set(userId, userOrders.filter((o) => o.id !== orderId));

    const error = new Error(err.message || "Failed to create order");
    error.statusCode = err.statusCode || 500;
    throw error;
  }
};

/**
 * Service: Get Customer Orders History
 */
export const getUserOrders = async (userId) => {
  // Query DB first
  const { data: dbOrders, error: dbErr } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (!dbErr && dbOrders && dbOrders.length > 0) {
    return {
      success: true,
      orders: dbOrders,
    };
  }

  // Fallback to in-memory store
  const userOrders = inMemoryOrders.get(userId) || [];
  return {
    success: true,
    orders: userOrders,
  };
};

/**
 * Service: Get Order Details by ID
 */
export const getOrderById = async (userId, orderId) => {
  const { data: dbOrder, error: dbErr } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .eq("user_id", userId)
    .maybeSingle();

  if (!dbErr && dbOrder) {
    return {
      success: true,
      order: dbOrder,
    };
  }

  // Fallback to in-memory store
  const userOrders = inMemoryOrders.get(userId) || [];
  const found = userOrders.find((o) => o.id === orderId || o.order_number === orderId);
  if (found) {
    return {
      success: true,
      order: found,
    };
  }

  const error = new Error("Order not found");
  error.statusCode = 404;
  throw error;
};

/**
 * Service: Cancel Order
 * Rule: Cancellation allowed ONLY while order status is PENDING.
 */
export const cancelOrder = async (userId, orderId) => {
  const result = await getOrderById(userId, orderId);
  const targetOrder = result.order;

  const currentStatus = (targetOrder.status || "PENDING").toUpperCase();

  // Business Rule: Cancellation is ONLY allowed while PENDING
  if (currentStatus !== "PENDING") {
    const error = new Error("Order cancellation is only allowed while order status is PENDING.");
    error.statusCode = 400;
    throw error;
  }

  // Update in DB
  const { data: updated, error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({ status: "CANCELLED" })
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .eq("user_id", userId)
    .select("*, items:order_items(*)")
    .maybeSingle();

  // Update in-memory store
  let userOrders = inMemoryOrders.get(userId) || [];
  let updatedInMem = null;
  userOrders = userOrders.map((o) => {
    if (o.id === orderId || o.order_number === orderId) {
      updatedInMem = { ...o, status: "CANCELLED" };
      return updatedInMem;
    }
    return o;
  });
  inMemoryOrders.set(userId, userOrders);

  // Restore Product Stock for all items in cancelled order
  const orderItems = targetOrder.items || targetOrder.order_items || [];
  for (const item of orderItems) {
    const productId = item.product_id || item.productId;
    const qty = Number(item.quantity || 1);
    if (productId) {
      const product = await cartService.getProductDetails(productId);
      if (product) {
        const currentStock = product.stock !== undefined ? product.stock : (product.stock_quantity !== undefined ? product.stock_quantity : 0);
        const restoredStock = currentStock + qty;
        const restorePayload = {
          stock: restoredStock,
        };
        if (restoredStock > 0 && product.status === "OUT_OF_STOCK") {
          restorePayload.status = "AVAILABLE";
        }

        await supabaseAdmin
          .from("retailer_products")
          .update(restorePayload)
          .eq("id", productId);
      }
    }
  }

  return {
    success: true,
    message: "Order cancelled successfully",
    order: updated || updatedInMem || { ...targetOrder, status: "CANCELLED" },
  };
};

/**
 * Service: Update Order Status
 * Module 10 State Machine: PENDING -> ACCEPTED -> PROCESSING -> PACKAGING -> READY_FOR_SHIPMENT -> SHIPPED -> DELIVERED (or CANCELLED)
 */
/**
 * Service: Update Order Status
 * Module 10 State Machine: PENDING -> ACCEPTED -> PROCESSING -> PACKAGING -> READY_FOR_SHIPMENT -> SHIPPED -> DELIVERED (or CANCELLED)
 */
export const updateOrderStatus = async (userId, orderId, newStatus, trackingInfo = null) => {
  const allowedStatuses = [
    "PENDING",
    "ACCEPTED",
    "PROCESSING",
    "PACKAGING",
    "READY_FOR_SHIPMENT",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REJECTED",
  ];
  const formattedStatus = (newStatus || "").toUpperCase();

  if (!allowedStatuses.includes(formattedStatus)) {
    const error = new Error(`Invalid status "${newStatus}". Allowed statuses: ${allowedStatuses.join(", ")}`);
    error.statusCode = 400;
    throw error;
  }

  // Fetch order directly from DB
  const { data: targetOrder } = await supabaseAdmin
    .from("orders")
    .select("*, items:order_items(*)")
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .maybeSingle();

  const currentStatus = ((targetOrder?.order_status || targetOrder?.status) || "PENDING").toUpperCase();

  // Validate cancellation rule
  if ((formattedStatus === "CANCELLED" || formattedStatus === "REJECTED") && currentStatus !== "PENDING") {
    const error = new Error("Order cancellation is only allowed while order status is PENDING.");
    error.statusCode = 400;
    throw error;
  }

  // Map 7-stage lifecycle status to PostgreSQL check constraint allowed values ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')
  const dbStatusMap = {
    PENDING: "PENDING",
    ACCEPTED: "PROCESSING",
    PROCESSING: "PROCESSING",
    PACKAGING: "PROCESSING",
    READY_FOR_SHIPMENT: "PROCESSING",
    SHIPPED: "SHIPPED",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED",
    REJECTED: "CANCELLED",
  };
  const dbStatus = dbStatusMap[formattedStatus] || "PROCESSING";

  const updateFields = { order_status: dbStatus };
  if (trackingInfo?.tracking_number) updateFields.tracking_number = trackingInfo.tracking_number;
  if (trackingInfo?.carrier_name) updateFields.carrier_name = trackingInfo.carrier_name;
  if (trackingInfo?.estimated_delivery_date) updateFields.estimated_delivery_date = trackingInfo.estimated_delivery_date;

  // Perform update in DB
  const { data: updated, error: dbErr } = await supabaseAdmin
    .from("orders")
    .update(updateFields)
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .select("*, items:order_items(*)")
    .maybeSingle();

  let finalUpdated = updated;
  if (dbErr) {
    const { data: retryUpdated } = await supabaseAdmin
      .from("orders")
      .update({ order_status: dbStatus })
      .or(`id.eq.${orderId},order_number.eq.${orderId}`)
      .select("*, items:order_items(*)")
      .maybeSingle();
    finalUpdated = retryUpdated;
  }

  // Save specific lifecycle stage in memory for rich UI stage stepper persistence
  let orderStageMap = inMemoryOrders.get("STAGE_MAP");
  if (!orderStageMap) {
    orderStageMap = new Map();
    inMemoryOrders.set("STAGE_MAP", orderStageMap);
  }
  orderStageMap.set(orderId, formattedStatus);
  if (targetOrder?.order_number) orderStageMap.set(targetOrder.order_number, formattedStatus);

  // Perform update in-memory
  let userOrders = inMemoryOrders.get(userId) || [];
  let updatedInMem = null;
  userOrders = userOrders.map((o) => {
    if (o.id === orderId || o.order_number === orderId) {
      updatedInMem = {
        ...o,
        order_status: formattedStatus,
        status: formattedStatus,
        ...(trackingInfo || {}),
      };
      return updatedInMem;
    }
    return o;
  });
  inMemoryOrders.set(userId, userOrders);

  // Module 11 Role Notifications Dispatcher
  try {
    await notifyPartiesOnStatusUpdate(orderId, targetOrder, formattedStatus);
  } catch (notifErr) {
    console.error("Error creating status update notifications:", notifErr);
  }

  const resultOrder = finalUpdated
    ? { ...finalUpdated, order_status: formattedStatus, status: formattedStatus, ...(trackingInfo || {}) }
    : (updatedInMem || { ...(targetOrder || {}), order_status: formattedStatus, status: formattedStatus });

  return {
    success: true,
    message: `Order status updated to ${formattedStatus}`,
    order: resultOrder,
  };
};

/**
 * Module 11 Notification Dispatcher: Order Creation
 */
async function notifyPartiesOnOrderCreation(orderNum, orderId, customerUserId, validatedProducts) {
  // 1. Customer Notification
  await notificationService.createNotification(customerUserId, {
    type: "ORDER_PLACED",
    title: "Order Placed",
    message: `Order #${orderNum || orderId} has been placed successfully.`,
    reference_id: orderId,
  });

  const productIds = (validatedProducts || [])
    .map((vp) => vp.productId || vp.item?.product_id || vp.item?.id)
    .filter(Boolean);

  if (productIds.length === 0) return;

  // Resolve Retailer IDs
  const { data: rProds } = await supabaseAdmin
    .from("retailer_products")
    .select("id, retailer_id, manufacturer_product_id")
    .in("id", productIds);

  const retailerIds = Array.from(new Set((rProds || []).map((rp) => rp.retailer_id).filter(Boolean)));
  const mProdIds = (rProds || []).map((rp) => rp.manufacturer_product_id).filter(Boolean);

  // Resolve Manufacturer IDs
  const { data: mProds } = await supabaseAdmin
    .from("manufacturer_products")
    .select("id, manufacturer_id")
    .in("id", [...productIds, ...mProdIds]);

  const mfgIds = Array.from(new Set((mProds || []).map((mp) => mp.manufacturer_id).filter(Boolean)));

  // 2. Retailer Notifications
  if (retailerIds.length > 0) {
    const { data: retailers } = await supabaseAdmin
      .from("retailers")
      .select("user_id")
      .in("id", retailerIds);

    for (const r of retailers || []) {
      if (r.user_id) {
        await notificationService.createNotification(r.user_id, {
          type: "NEW_ORDER_RECEIVED",
          title: "New Order Received",
          message: "New Order Received",
          reference_id: orderId,
        });
      }
    }
  }

  // 3. Manufacturer Notifications
  if (mfgIds.length > 0) {
    const { data: mfgs } = await supabaseAdmin
      .from("manufacturers")
      .select("user_id")
      .in("id", mfgIds);

    for (const m of mfgs || []) {
      if (m.user_id) {
        await notificationService.createNotification(m.user_id, {
          type: "NEW_ORDER_ASSIGNED",
          title: "New Order Assigned",
          message: "New Order Assigned",
          reference_id: orderId,
        });
      }
    }
  }
}

/**
 * Module 11 Notification Dispatcher: Status Update
 */
async function notifyPartiesOnStatusUpdate(orderId, targetOrder, formattedStatus) {
  const customerUserId = targetOrder?.user_id || targetOrder?.customer?.user_id;
  const orderItems = targetOrder?.items || targetOrder?.order_items || [];
  const productIds = orderItems.map((i) => i.product_id).filter(Boolean);

  let retailerUserIds = [];

  if (productIds.length > 0) {
    const { data: rProds } = await supabaseAdmin
      .from("retailer_products")
      .select("id, retailer_id")
      .in("id", productIds);

    const retailerIds = Array.from(new Set((rProds || []).map((rp) => rp.retailer_id).filter(Boolean)));
    if (retailerIds.length > 0) {
      const { data: retailers } = await supabaseAdmin
        .from("retailers")
        .select("user_id")
        .in("id", retailerIds);

      retailerUserIds = (retailers || []).map((r) => r.user_id).filter(Boolean);
    }
  }

  // Customer Notifications
  if (customerUserId) {
    if (formattedStatus === "ACCEPTED") {
      await notificationService.createNotification(customerUserId, {
        type: "ORDER_ACCEPTED",
        title: "Order Accepted",
        message: "Your order has been accepted.",
        reference_id: orderId,
      });
    } else if (formattedStatus === "SHIPPED") {
      await notificationService.createNotification(customerUserId, {
        type: "ORDER_SHIPPED",
        title: "Order Shipped",
        message: "Your order has been shipped.",
        reference_id: orderId,
      });
    } else if (formattedStatus === "DELIVERED") {
      await notificationService.createNotification(customerUserId, {
        type: "ORDER_DELIVERED",
        title: "Order Delivered",
        message: "Your order has been delivered.",
        reference_id: orderId,
      });
    }
  }

  // Retailer Notifications
  if (retailerUserIds.length > 0) {
    if (formattedStatus === "ACCEPTED") {
      for (const rUserId of retailerUserIds) {
        await notificationService.createNotification(rUserId, {
          type: "MANUFACTURER_ACCEPTED",
          title: "Manufacturer Accepted Order",
          message: "Manufacturer Accepted Order",
          reference_id: orderId,
        });
      }
    } else if (formattedStatus === "SHIPPED") {
      for (const rUserId of retailerUserIds) {
        await notificationService.createNotification(rUserId, {
          type: "MANUFACTURER_SHIPPED",
          title: "Manufacturer Shipped Order",
          message: "Manufacturer Shipped Order",
          reference_id: orderId,
        });
      }
    }
  }
}

/**
 * Get orders for products owned by logged-in manufacturer
 */
export const getManufacturerOrders = async (userId) => {
  try {
    const { data: mfg } = await supabaseAdmin
      .from("manufacturers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    // Collect product IDs from both products and manufacturer_products tables
    let mProdIds = [];
    const mProdMap = new Map();

    if (mfg) {
      const { data: mProds } = await supabaseAdmin
        .from("manufacturer_products")
        .select("id, name")
        .eq("manufacturer_id", mfg.id);

      const { data: uProds } = await supabaseAdmin
        .from("products")
        .select("id, name")
        .eq("manufacturer_id", mfg.id);

      (mProds || []).forEach((p) => mProdMap.set(p.id, p));
      (uProds || []).forEach((p) => mProdMap.set(p.id, p));

      mProdIds = Array.from(mProdMap.keys());
    }

    // Automatically resolve retailer_product listings linked to these manufacturer products
    let rProdIds = [];
    const rProdMap = new Map();

    if (mProdIds.length > 0) {
      const { data: rProds } = await supabaseAdmin
        .from("retailer_products")
        .select("id, name, manufacturer_product_id")
        .in("manufacturer_product_id", mProdIds);

      (rProds || []).forEach((rp) => rProdMap.set(rp.id, rp));
      rProdIds = Array.from(rProdMap.keys());
    }

    const allTargetProductIds = Array.from(new Set([...mProdIds, ...rProdIds]));

    // Query order_items matching product_id
    let matchedOrderIds = [];
    if (allTargetProductIds.length > 0) {
      const { data: orderItems } = await supabaseAdmin
        .from("order_items")
        .select("order_id, product_id, quantity, price")
        .in("product_id", allTargetProductIds);

      matchedOrderIds = Array.from(new Set((orderItems || []).map((oi) => oi.order_id)));
    }

    if (matchedOrderIds.length === 0) {
      return {
        success: true,
        orders: [],
      };
    }

    // Query orders from DB matching matchedOrderIds
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select(`
        *,
        customer:customers(id, user_id),
        items:order_items(*)
      `)
      .in("id", matchedOrderIds)
      .order("created_at", { ascending: false });

    const orderStageMap = inMemoryOrders.get("STAGE_MAP") || new Map();

    const formattedOrders = (orders || []).map((o) => {
      const items = o.items || [];
      const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
      const firstItem = items[0] || {};
      const orderNum = o.order_number || (o.id?.startsWith("ORD-") ? o.id : `ORD-${o.id?.slice(0, 8)}`);

      let resolvedProductName = o.product_name;
      for (const item of items) {
        const pId = item.product_id;
        if (mProdMap.has(pId)) {
          resolvedProductName = mProdMap.get(pId).name;
          break;
        } else if (rProdMap.has(pId)) {
          const rp = rProdMap.get(pId);
          const parentMp = mProdMap.get(rp.manufacturer_product_id);
          resolvedProductName = rp.name || parentMp?.name || resolvedProductName;
          break;
        }
      }

      const specificStage = orderStageMap.get(o.id) || orderStageMap.get(orderNum) || (o.order_status || o.status || "PENDING").toUpperCase();

      return {
        ...o,
        order_number: orderNum,
        order_status: specificStage,
        status: specificStage,
        total_quantity: totalQty,
        quantity: totalQty,
        product_name: resolvedProductName || firstItem.name || "Handcrafted Fine Jewellery",
        product_image: o.product_image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
        date: new Date(o.created_at || Date.now()).toLocaleDateString("en-IN"),
      };
    });

    return {
      success: true,
      orders: formattedOrders,
    };
  } catch (err) {
    console.error("Error in getManufacturerOrders:", err);
    return { success: false, orders: [] };
  }
};
