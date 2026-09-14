import * as retailerAccessService from "../services/retailerAccessService.js";

/**
 * POST /api/retailer-access/validate-code
 * Public endpoint to validate retailer code existence and status.
 */
export const validateRetailerCode = async (req, res) => {
  try {
    const code = req.body.code || req.body.retailer_code || req.query.code;
    const result = await retailerAccessService.validateRetailerCode(code);

    return res.status(200).json({
      success: true,
      message: "Retailer access code is valid.",
      data: result,
      retailer: result.retailer,
    });
  } catch (err) {
    console.error("Error in validateRetailerCode controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Invalid retailer access code.",
    });
  }
};

/**
 * POST /api/retailer-access/join
 * Authenticated customer endpoint to join a retailer via valid code or retailer_id.
 */
export const joinRetailer = async (req, res) => {
  try {
    const userId = req.user.id;
    const codeOrId = req.body.code || req.body.retailer_code || req.body.retailer_id;

    const result = await retailerAccessService.joinRetailer(userId, codeOrId);

    return res.status(200).json({
      success: true,
      alreadyJoined: result.alreadyJoined,
      message: result.message,
      membership: result.membership,
      retailer: result.retailer,
      data: result,
    });
  } catch (err) {
    console.error("Error in joinRetailer controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to join retailer storefront.",
    });
  }
};

/**
 * GET /api/retailer-access/my-stores
 * Authenticated customer endpoint returning authorized retailer stores ("My Stores").
 */
export const getMyRetailers = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await retailerAccessService.getMyRetailers(userId);

    return res.status(200).json({
      success: true,
      message: "Authorized retailer stores retrieved successfully.",
      count: result.count,
      stores: result.stores,
      data: result.stores,
    });
  } catch (err) {
    console.error("Error in getMyRetailers controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to retrieve authorized stores.",
    });
  }
};

/**
 * GET /api/retailer-access/membership/:retailerId
 * Authenticated customer endpoint checking membership status for a specific retailer.
 */
export const getRetailerMembership = async (req, res) => {
  try {
    const userId = req.user.id;
    const retailerId = req.params.retailerId;

    const result = await retailerAccessService.getRetailerMembership(userId, retailerId);

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error in getRetailerMembership controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to check retailer membership.",
    });
  }
};

/**
 * DELETE /api/retailer-access/leave/:retailerId
 * Authenticated customer endpoint to leave / remove a retailer store membership.
 */
export const leaveRetailer = async (req, res) => {
  try {
    const userId = req.user.id;
    const retailerId = req.params.retailerId;

    const result = await retailerAccessService.leaveRetailer(userId, retailerId);

    return res.status(200).json({
      success: true,
      message: result.message || "Store membership removed successfully.",
    });
  } catch (err) {
    console.error("Error in leaveRetailer controller:", err);
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      message: err.message || "Failed to remove retailer store membership.",
    });
  }
};
