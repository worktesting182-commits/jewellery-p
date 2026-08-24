import * as orderService from "../services/orderService.js";

/**
 * POST /api/orders
 * Create new customer order (Single Logical Operation Flow).
 */
export const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderPayload = req.body || {};

    const result = await orderService.createOrder(userId, orderPayload);

    return res.status(201).json({
      success: true,
      message: result.message || "Order created successfully",
      order: result.order,
      data: result.order,
    });
  } catch (err) {
    console.error("Error in createOrder controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to create order",
    });
  }
};

/**
 * GET /api/orders
 * Get logged-in customer's order history.
 */
export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await orderService.getUserOrders(userId);

    return res.status(200).json({
      success: true,
      message: "Orders retrieved successfully",
      orders: result.orders,
      data: result.orders,
    });
  } catch (err) {
    console.error("Error in getOrders controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to retrieve orders",
    });
  }
};

/**
 * GET /api/orders/:id
 * Get single order details by ID.
 */
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const result = await orderService.getOrderById(userId, orderId);

    return res.status(200).json({
      success: true,
      message: "Order details retrieved successfully",
      order: result.order,
      data: result.order,
    });
  } catch (err) {
    console.error("Error in getOrderById controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Order not found",
    });
  }
};

/**
 * PUT /api/orders/:id/cancel
 * Cancel order (allowed ONLY while status is PENDING).
 */
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;

    const result = await orderService.cancelOrder(userId, orderId);

    return res.status(200).json({
      success: true,
      message: result.message || "Order cancelled successfully",
      order: result.order,
      data: result.order,
    });
  } catch (err) {
    console.error("Error in cancelOrder controller:", err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to cancel order",
    });
  }
};

/**
 * PUT /api/orders/:id/status
 * Update order status (PENDING -> PROCESSING -> SHIPPED -> DELIVERED).
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const orderId = req.params.id;
    const { status, tracking_number, carrier_name, estimated_delivery_date } = req.body;

    const trackingInfo = (tracking_number || carrier_name || estimated_delivery_date)
      ? { tracking_number, carrier_name, estimated_delivery_date }
      : null;

    const result = await orderService.updateOrderStatus(userId, orderId, status, trackingInfo);

    return res.status(200).json({
      success: true,
      message: result.message || `Order status updated to ${status}`,
      order: result.order,
      data: result.order,
    });
  } catch (err) {
    console.error("Error in updateOrderStatus controller:", err);
    const statusCode = err.statusCode || 400;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to update order status",
    });
  }
};

/**
 * GET /api/orders/manufacturer
 * Get orders for products owned by logged-in manufacturer.
 */
export const getManufacturerOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await orderService.getManufacturerOrders(userId);

    return res.status(200).json({
      success: true,
      orders: result.orders,
      data: result.orders,
    });
  } catch (err) {
    console.error("Error in getManufacturerOrders controller:", err);
    return res.status(500).json({
      success: false,
      message: err.message || "Failed to retrieve manufacturer orders",
    });
  }
};
