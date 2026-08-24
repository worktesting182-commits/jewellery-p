import * as cartService from "../services/cartService.js";

/**
 * GET /api/cart
 * Returns the logged-in customer's cart.
 */
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await cartService.getCart(userId);
    
    // Provide both spec response format and backward compatibility
    return res.status(200).json({
      success: true,
      message: "Cart retrieved successfully",
      cart: result.cart,
      data: {
        items: result.cart.items,
        total_amount: result.cart.grandTotal,
        item_count: result.cart.items.reduce((acc, item) => acc + item.quantity, 0),
      },
    });
  } catch (err) {
    console.error("Error in getCart controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to retrieve cart",
    });
  }
};

/**
 * POST /api/cart
 * Add product to cart.
 */
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.body.productId || req.body.product_id;
    const quantity = req.body.quantity || 1;

    const result = await cartService.addToCart(userId, productId, quantity);
    return res.status(201).json(result);
  } catch (err) {
    console.error("Error in addToCart controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to add product to cart",
    });
  }
};

/**
 * PUT /api/cart/:id
 * Update cart item quantity.
 */
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;
    const { quantity } = req.body;

    const result = await cartService.updateCartItem(userId, itemId, quantity);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in updateCartItem controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to update cart item",
    });
  }
};

/**
 * DELETE /api/cart/:id
 * Remove a single cart item.
 */
export const removeCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const itemId = req.params.id;

    const result = await cartService.removeCartItem(userId, itemId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in removeCartItem controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to remove cart item",
    });
  }
};

/**
 * DELETE /api/cart
 * Clear complete cart.
 */
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await cartService.clearCart(userId);
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error in clearCart controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to clear cart",
    });
  }
};
