import { supabaseAdmin } from "../config/supabase.js";
import {
    successResponse,
    errorResponse,
} from "../utils/response.js";

// GET /api/categories
export const getCategories = async (req, res) => {
    try {
        const { data: categories, error } = await supabaseAdmin
            .from("categories")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) {
            return errorResponse(res, 500, error.message);
        }

        // Fetch products count per category
        const { data: prods } = await supabaseAdmin
            .from("manufacturer_products")
            .select("id, category_id");

        const countMap = new Map();
        (prods || []).forEach((p) => {
            if (p.category_id) {
                countMap.set(p.category_id, (countMap.get(p.category_id) || 0) + 1);
            }
        });

        const formatted = (categories || []).map((cat) => ({
            ...cat,
            products_count: countMap.get(cat.id) || 0,
            product_count: countMap.get(cat.id) || 0,
        }));

        return successResponse(res, 200, "Categories fetched successfully", formatted);
    } catch (err) {
        return errorResponse(res, 500, err.message);
    }
};

// GET /api/categories/:id
export const getCategory = async (req, res) => {
    const { id } = req.params;

    const { data, error } = await supabaseAdmin
        .from("categories")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        return errorResponse(
            res,
            404,
            "Category not found"
        );
    }

    return successResponse(
        res,
        200,
        "Category fetched successfully",
        data
    );
};

// POST /api/categories (Admin Only)
export const createCategory = async (req, res) => {
    const { name, description, image_url } = req.body;

    if (!name) {
        return errorResponse(res, 400, "Category name is required");
    }

    const payload = { name, description: description || "" };
    if (image_url) payload.image_url = image_url;

    const { data, error } = await supabaseAdmin
        .from("categories")
        .insert([payload])
        .select();

    if (error) {
        return errorResponse(
            res,
            400,
            error.message
        );
    }

    return successResponse(
        res,
        201,
        "Category created successfully",
        data[0] || data
    );
};

// PUT /api/categories/:id (Admin Only)
export const updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, image_url } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = name;
    if (description !== undefined) payload.description = description;
    if (image_url !== undefined) payload.image_url = image_url;

    const { data, error } = await supabaseAdmin
        .from("categories")
        .update(payload)
        .eq("id", id)
        .select();

    if (error) {
        return errorResponse(
            res,
            400,
            error.message
        );
    }

    return successResponse(
        res,
        200,
        "Category updated successfully",
        data[0] || data
    );
};

// DELETE /api/categories/:id (Admin Only)
export const deleteCategory = async (req, res) => {
    const { id } = req.params;

    const { error } = await supabaseAdmin
        .from("categories")
        .delete()
        .eq("id", id);

    if (error) {
        return errorResponse(
            res,
            400,
            error.message
        );
    }

    return successResponse(
        res,
        200,
        "Category deleted successfully"
    );
};