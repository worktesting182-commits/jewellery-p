import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getProfile,
    updateProfile,
    getUsers,
    getUserById
} from "../controllers/userController.js";

const router = express.Router();

// Logged-in User
router.get("/profile", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);

// Admin Only
router.get(
    "/",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getUsers
);

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware("ADMIN"),
    getUserById
);

export default router;