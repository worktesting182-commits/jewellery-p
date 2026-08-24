import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import roleMiddleware from "../middleware/roleMiddleware.js";

import {
    getCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);

router.get("/:id", getCategory);

router.post("/", authMiddleware, roleMiddleware("ADMIN"), createCategory);

router.put("/:id", authMiddleware, roleMiddleware("ADMIN"), updateCategory);

router.delete("/:id", authMiddleware, roleMiddleware("ADMIN"), deleteCategory);

export default router;
