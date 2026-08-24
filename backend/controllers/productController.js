import { supabaseAdmin } from "../config/supabase.js";
import { normalizeProduct } from "../utils/productModel.js";
import { getLatestBenchmarkRates } from "../utils/pricingEngine.js";

// =========================
// MANUFACTURER: CREATE MASTER PRODUCT (manufacturer_products)
// =========================
export const createProduct = async (req, res) => {
    try {
        const {
            category_id,
            name,
            description,
            material,
            purity,
            weight,
            price,
            manufacturer_price,
            making_charge_type,
            making_charge_value,
            stone_price,
            stone_cost,
            stone_details,
            status,
            image_url,
        } = req.body;

        const mPrice = Number(manufacturer_price || price || 0);

        if (!category_id || !name || mPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: "category_id, name and price are required",
            });
        }

        // 1. Resolve or auto-create manufacturer profile
        let { data: manufacturer } = await supabaseAdmin
            .from("manufacturers")
            .select("id")
            .eq("user_id", req.user.id)
            .maybeSingle();

        if (!manufacturer) {
            const { data: newMfg } = await supabaseAdmin
                .from("manufacturers")
                .insert({
                    user_id: req.user.id,
                    company_name: req.user.full_name || "Master Artisan",
                })
                .select("id")
                .single();
            manufacturer = newMfg;
        }

        // 2. Validate category
        let finalCategoryId = category_id;
        const { data: category } = await supabaseAdmin
            .from("categories")
            .select("id")
            .eq("id", category_id)
            .maybeSingle();

        if (!category) {
            const { data: existingCats } = await supabaseAdmin
                .from("categories")
                .select("id")
                .limit(1);

            if (existingCats && existingCats.length > 0) {
                finalCategoryId = existingCats[0].id;
            }
        }

        const insertData = {
            manufacturer_id: manufacturer?.id,
            retailer_id: null,
            category_id: finalCategoryId,
            name,
            description: description || "",
            material: material || "Gold",
            purity: purity || "22K",
            weight: weight != null ? Number(weight) : null,
            making_charge_type: making_charge_type || "PERCENTAGE",
            making_charge_value: making_charge_value != null ? Number(making_charge_value) : 12.0,
            stone_price: stone_price != null ? Number(stone_price) : (stone_cost != null ? Number(stone_cost) : 0.0),
            stone_details: stone_details || null,
            manufacturer_price: mPrice,
            retailer_price: null,
            image_url: image_url || null,
            product_source: "MANUFACTURER",
            status: status || "ACTIVE",
        };

        // Try inserting into unified products table first
        let mProduct = null;
        let mErr = null;

        let { data: prodData, error: prodErr } = await supabaseAdmin
            .from("products")
            .insert(insertData)
            .select()
            .single();

        // Fallback retry if products table doesn't have image_url column
        if (prodErr && (prodErr.message.includes("image_url") || prodErr.code === "PGRST204")) {
            delete insertData.image_url;
            const { data: retryProd, error: retryErr } = await supabaseAdmin
                .from("products")
                .insert(insertData)
                .select()
                .single();
            prodData = retryProd;
            prodErr = retryErr;
        }

        if (!prodErr && prodData) {
            mProduct = prodData;
        } else {
            // Fallback to legacy manufacturer_products table
            const legacyInsert = {
                manufacturer_id: manufacturer?.id,
                category_id: finalCategoryId,
                name,
                description: description || "",
                material: material || "Gold",
                purity: purity || "22K",
                weight: weight != null ? Number(weight) : null,
                manufacturer_price: mPrice,
                status: status || "ACTIVE",
            };
            if (image_url) legacyInsert.image_url = image_url;

            let { data: legacyData, error: legacyErr } = await supabaseAdmin
                .from("manufacturer_products")
                .insert(legacyInsert)
                .select()
                .single();

            if (legacyErr && (legacyErr.message.includes("image_url") || legacyErr.code === "PGRST204")) {
                delete legacyInsert.image_url;
                const { data: retryLegacy, error: retryLegacyErr } = await supabaseAdmin
                    .from("manufacturer_products")
                    .insert(legacyInsert)
                    .select()
                    .single();
                legacyData = retryLegacy;
                legacyErr = retryLegacyErr;
            }
            
            mProduct = legacyData;
            mErr = legacyErr;
        }

        if (mErr || !mProduct) {
            console.error("Error creating manufacturer product:", mErr || prodErr);
            return res.status(400).json({
                success: false,
                message: mErr?.message || prodErr?.message || "Failed to create master product",
            });
        }

        // Upload image to product_images table if provided
        if (image_url && mProduct?.id) {
            try {
                const { data: imgData, error: imgErr } = await supabaseAdmin
                    .from("product_images")
                    .insert({
                        manufacturer_product_id: mProduct.id,
                        image_url: image_url,
                        is_primary: true,
                        display_order: 1,
                    })
                    .select();

                if (imgErr) {
                    console.error("Error inserting into product_images:", imgErr);
                } else {
                    console.log("✅ Image successfully linked to product in product_images:", imgData);
                }
            } catch (imgException) {
                console.error("Exception inserting into product_images:", imgException);
            }
        }


        return res.status(201).json({
            success: true,
            message: "Master manufacturer product created successfully",
            data: {
                ...mProduct,
                product_source: "MANUFACTURER",
                manufacturer_id: manufacturer?.id,
                retailer_id: null,
            },
        });

    } catch (err) {
        console.error("Error in createProduct:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// CUSTOMER: GET ALL MARKETPLACE LISTINGS (retailer_products JOIN manufacturer_products)
// =========================
export const getProducts = async (req, res) => {
    try {
        // Query retailer_products joined with manufacturer_products, product_images, manufacturers, and retailers
        const { data: rListings, error: rErr } = await supabaseAdmin
            .from("retailer_products")
            .select(`
                *,
                manufacturer_product:manufacturer_products (
                    id, name, description, material, purity, weight, category_id, status,
                    manufacturer:manufacturers(id, company_name)
                ),
                retailer:retailers (
                    id, shop_name
                )
            `)
            .order("created_at", { ascending: false });

        if (rErr) {
            console.error("Error fetching retailer products:", rErr);
            return res.status(500).json({
                success: false,
                message: rErr.message,
            });
        }

        // Fetch live gold/silver rates for dynamic pricing
        const liveRates = await getLatestBenchmarkRates();

        // Fetch product images
        const { data: images } = await supabaseAdmin.from("product_images").select("*");
        const imageMap = new Map();
        (images || []).forEach((img) => {
            if (!imageMap.has(img.manufacturer_product_id)) {
                imageMap.set(img.manufacturer_product_id, img.image_url);
            }
        });

        // Format customer-facing product list
        let formattedProducts = (rListings || []).map((listing) => {
            const mp = listing.manufacturer_product || {};
            const ret = listing.retailer || {};
            const imgUrl = imageMap.get(mp.id) || imageMap.get(listing.id);
            const mfgName = mp.manufacturer?.company_name || "Master Artisan";
            const shopName = ret.shop_name || "Artisan Retailer";

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
                category_id: mp.category_id,
                manufacturer_name: mfgName,
                sold_by: shopName,
                retailer_name: shopName,
                manufacturer_price: mp.manufacturer_price,
                selling_price: listing.selling_price,
                stock: listing.stock,
                status: listing.status,
                image_url: imgUrl,
                created_at: listing.created_at,
            }, liveRates);
        });

        // Filter out INACTIVE / DISCONTINUED if requested
        if (req.query.category && req.query.category.toLowerCase() !== "all") {
            formattedProducts = formattedProducts.filter((p) => p.category_id === req.query.category);
        }

        return res.status(200).json({
            success: true,
            data: formattedProducts,
            products: formattedProducts,
        });

    } catch (err) {
        console.error("Error in getProducts controller:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// CUSTOMER: GET SINGLE PRODUCT BY ID
// =========================
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const liveRates = await getLatestBenchmarkRates();

        // 1. Check unified products table directly
        const { data: directProd } = await supabaseAdmin
            .from("products")
            .select(`
                *,
                manufacturer:manufacturers(id, company_name),
                retailer:retailers(id, shop_name)
            `)
            .eq("id", id)
            .maybeSingle();

        if (directProd) {
            const { data: img } = await supabaseAdmin
                .from("product_images")
                .select("image_url")
                .or(`product_id.eq.${directProd.id},manufacturer_product_id.eq.${directProd.id}`)
                .maybeSingle();

            const formatted = normalizeProduct({
                ...directProd,
                image_url: img?.image_url || directProd.image_url,
            }, liveRates);

            return res.status(200).json({
                success: true,
                data: formatted,
            });
        }

        // 2. Query retailer_products table by id
        const { data: listing } = await supabaseAdmin
            .from("retailer_products")
            .select(`
                *,
                manufacturer_product:manufacturer_products (*),
                retailer:retailers (id, shop_name)
            `)
            .eq("id", id)
            .maybeSingle();

        if (listing) {
            const mp = listing.manufacturer_product || {};
            const ret = listing.retailer || {};

            const { data: img } = await supabaseAdmin
                .from("product_images")
                .select("image_url")
                .eq("manufacturer_product_id", mp.id)
                .maybeSingle();

            const rawProduct = {
                id: listing.id,
                retailer_product_id: listing.id,
                manufacturer_product_id: mp.id,
                name: mp.name || listing.name || "Jewellery Item",
                description: mp.description || listing.description || "",
                material: mp.material || listing.material || "Gold",
                purity: mp.purity || listing.purity || "22K",
                weight: mp.weight || listing.weight,
                making_charge_type: listing.making_charge_type || mp.making_charge_type,
                making_charge_value: listing.making_charge_value || mp.making_charge_value,
                stone_price: listing.stone_price || mp.stone_price,
                stone_cost: listing.stone_cost || mp.stone_cost,
                stone_details: listing.stone_details || mp.stone_details,
                category_id: mp.category_id || listing.category_id,
                price: Number(listing.selling_price || 0),
                selling_price: Number(listing.selling_price || 0),
                stock: Number(listing.stock || 0),
                status: listing.status || "ACTIVE",
                retailer_name: ret.shop_name || "Artisan Retailer",
                image_url: img?.image_url || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
            };

            const formatted = normalizeProduct(rawProduct, liveRates);

            return res.status(200).json({
                success: true,
                data: formatted,
            });
        }

        // 3. Query retailer_products table by manufacturer_product_id
        const { data: listingByMp } = await supabaseAdmin
            .from("retailer_products")
            .select(`
                *,
                manufacturer_product:manufacturer_products (*),
                retailer:retailers (id, shop_name)
            `)
            .eq("manufacturer_product_id", id)
            .maybeSingle();

        if (listingByMp) {
            const mp = listingByMp.manufacturer_product || {};
            const ret = listingByMp.retailer || {};

            const { data: img } = await supabaseAdmin
                .from("product_images")
                .select("image_url")
                .eq("manufacturer_product_id", mp.id)
                .maybeSingle();

            const rawProduct = {
                id: listingByMp.id,
                retailer_product_id: listingByMp.id,
                manufacturer_product_id: mp.id,
                name: mp.name || listingByMp.name || "Jewellery Item",
                description: mp.description || listingByMp.description || "",
                material: mp.material || listingByMp.material || "Gold",
                purity: mp.purity || listingByMp.purity || "22K",
                weight: mp.weight || listingByMp.weight,
                making_charge_type: listingByMp.making_charge_type || mp.making_charge_type,
                making_charge_value: listingByMp.making_charge_value || mp.making_charge_value,
                stone_price: listingByMp.stone_price || mp.stone_price,
                stone_cost: listingByMp.stone_cost || mp.stone_cost,
                stone_details: listingByMp.stone_details || mp.stone_details,
                category_id: mp.category_id || listingByMp.category_id,
                price: Number(listingByMp.selling_price || 0),
                selling_price: Number(listingByMp.selling_price || 0),
                stock: Number(listingByMp.stock || 0),
                status: listingByMp.status || "ACTIVE",
                retailer_name: ret.shop_name || "Artisan Retailer",
                image_url: img?.image_url || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
            };

            const formatted = normalizeProduct(rawProduct, liveRates);

            return res.status(200).json({
                success: true,
                data: formatted,
            });
        }

        // 4. Query legacy manufacturer_products table directly
        const { data: mItem } = await supabaseAdmin
            .from("manufacturer_products")
            .select(`*, manufacturer:manufacturers(company_name)`)
            .eq("id", id)
            .maybeSingle();

        if (mItem) {
            const { data: img } = await supabaseAdmin
                .from("product_images")
                .select("image_url")
                .eq("manufacturer_product_id", mItem.id)
                .maybeSingle();

            const rawProduct = {
                ...mItem,
                manufacturer_name: mItem.manufacturer?.company_name || "Master Artisan",
                selling_price: Number(mItem.manufacturer_price || mItem.price || 0),
                image_url: img?.image_url || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600",
            };

            const formatted = normalizeProduct(rawProduct, liveRates);

            return res.status(200).json({
                success: true,
                data: formatted,
            });
        }

        return res.status(404).json({
            success: false,
            message: "Product not found",
        });

    } catch (err) {
        console.error("Error in getProductById:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// MANUFACTURER: GET MY MASTER PRODUCTS
// =========================
export const getMyProducts = async (req, res) => {
    try {
        const { data: mfg } = await supabaseAdmin
            .from("manufacturers")
            .select("id")
            .eq("user_id", req.user.id)
            .maybeSingle();

        if (!mfg) {
            return res.status(404).json({
                success: false,
                message: "Manufacturer profile not found",
            });
        }

        // 1. Fetch from unified products table
        const { data: unifiedProds } = await supabaseAdmin
            .from("products")
            .select(`
                *,
                category:categories(id, name)
            `)
            .eq("manufacturer_id", mfg.id)
            .order("created_at", { ascending: false });

        // 2. Fetch from legacy manufacturer_products table
        const { data: legacyProds } = await supabaseAdmin
            .from("manufacturer_products")
            .select(`
                *,
                category:categories(id, name)
            `)
            .eq("manufacturer_id", mfg.id)
            .order("created_at", { ascending: false });

        // 3. Fetch product images
        const { data: images } = await supabaseAdmin.from("product_images").select("*");
        const imageMap = new Map();
        (images || []).forEach((img) => {
            if (img.product_id && !imageMap.has(img.product_id)) {
                imageMap.set(img.product_id, img.image_url);
            }
            if (img.manufacturer_product_id && !imageMap.has(img.manufacturer_product_id)) {
                imageMap.set(img.manufacturer_product_id, img.image_url);
            }
        });

        const seenIds = new Set();
        const mergedList = [];

        // Add unified products
        (unifiedProds || []).forEach((p) => {
            seenIds.add(p.id);
            const imgUrl = p.image_url || imageMap.get(p.id) || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60";
            const priceVal = Number(p.manufacturer_price || p.price || 0);
            mergedList.push({
                ...p,
                price: priceVal,
                manufacturer_price: priceVal,
                image_url: imgUrl,
                image: imgUrl,
                category_name: p.category?.name || "Jewellery",
            });
        });

        // Add legacy products
        (legacyProds || []).forEach((p) => {
            if (!seenIds.has(p.id)) {
                seenIds.add(p.id);
                const imgUrl = p.image_url || imageMap.get(p.id) || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=60";
                const priceVal = Number(p.manufacturer_price || p.price || 0);
                mergedList.push({
                    ...p,
                    price: priceVal,
                    manufacturer_price: priceVal,
                    image_url: imgUrl,
                    image: imgUrl,
                    category_name: p.category?.name || "Jewellery",
                });
            }
        });

        const includeInactive = req.query.include_inactive === "true";
        const filteredList = includeInactive
            ? mergedList
            : mergedList.filter((p) => {
                const s = String(p.status || "ACTIVE").toUpperCase();
                return s !== "INACTIVE" && s !== "DISCONTINUED";
            });

        return res.status(200).json({
            success: true,
            data: filteredList,
            products: filteredList,
        });

    } catch (err) {
        console.error("Error in getMyProducts:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// RETAILER: BROWSE MANUFACTURER CATALOG (With Wholesale Price)
// =========================
export const getManufacturerCatalog = async (req, res) => {
    try {
        const { data: mCatalog, error } = await supabaseAdmin
            .from("manufacturer_products")
            .select(`
                *,
                manufacturer:manufacturers(id, company_name),
                category:categories(id, name)
            `)
            .eq("status", "ACTIVE")
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

        // Fetch primary product images
        const { data: images } = await supabaseAdmin.from("product_images").select("*");
        const imageMap = new Map();
        (images || []).forEach((img) => {
            if (!imageMap.has(img.manufacturer_product_id)) {
                imageMap.set(img.manufacturer_product_id, img.image_url);
            }
        });

        const formatted = (mCatalog || [])
            .filter((item) => {
                const isCustomRetailerProd =
                    item.product_source === "RETAILER" ||
                    item.description?.includes("[RETAILER_CUSTOM]") ||
                    item.name?.toLowerCase().includes("ring ring") ||
                    item.manufacturer?.company_name === "In-House Retailer Artisans" ||
                    item.manufacturer?.company_name?.includes("In-House");
                return !isCustomRetailerProd;
            })
            .map((item) => {
                const imgUrl = imageMap.get(item.id) || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";
                const mfgName = item.manufacturer?.company_name || "Master Artisan";
                const catName = item.category?.name || "Fine Jewellery";

                return {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    material: item.material || "Gold",
                    purity: item.purity || "22K",
                    weight: item.weight ? `${item.weight}g` : "8.5g",
                    manufacturer_name: mfgName,
                    manufacturer: mfgName,
                    category_name: catName,
                    category: catName,
                    manufacturer_price: Number(item.manufacturer_price || item.price || 0),
                    image_url: imgUrl,
                    image: imgUrl,
                    status: item.status,
                };
            });

        return res.status(200).json({
            success: true,
            catalog: formatted,
            data: formatted,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// RETAILER: ADD PRODUCT TO STORE (retailer_products)
// =========================
export const listRetailerProduct = async (req, res) => {
    try {
        const { manufacturer_product_id, selling_price, stock } = req.body;

        if (!manufacturer_product_id || selling_price == null || stock == null) {
            return res.status(400).json({
                success: false,
                message: "manufacturer_product_id, selling_price and stock are required",
            });
        }

        // Get or resolve retailer profile
        let { data: retailer } = await supabaseAdmin
            .from("retailers")
            .select("id")
            .eq("user_id", req.user.id)
            .maybeSingle();

        if (!retailer) {
            const { data: newRet } = await supabaseAdmin
                .from("retailers")
                .insert({
                    user_id: req.user.id,
                    shop_name: req.user.full_name || "Artisan Retail Shop",
                })
                .select("id")
                .single();
            retailer = newRet;
        }

        const { data: listing, error } = await supabaseAdmin
            .from("retailer_products")
            .insert({
                retailer_id: retailer.id,
                manufacturer_product_id: manufacturer_product_id,
                selling_price: Number(selling_price),
                stock: Number(stock),
                status: Number(stock) > 0 ? "ACTIVE" : "OUT_OF_STOCK",
            })
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(201).json({
            success: true,
            message: "Product listed in store successfully",
            data: listing,
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// RETAILER: GET MY STORE LISTINGS
// =========================
export const getMyStoreListings = async (req, res) => {
    try {
        const { data: retailer } = await supabaseAdmin
            .from("retailers")
            .select("id")
            .eq("user_id", req.user.id)
            .maybeSingle();

        if (!retailer) {
            return res.status(404).json({
                success: false,
                message: "Retailer profile not found",
            });
        }

        const { data: listings, error } = await supabaseAdmin
            .from("retailer_products")
            .select(`
                *,
                manufacturer_product:manufacturer_products (*)
            `)
            .eq("retailer_id", retailer.id)
            .order("created_at", { ascending: false });

        if (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }

        return res.status(200).json({
            success: true,
            data: listings || [],
            listings: listings || [],
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// UPDATE PRODUCT (Customer/Retailer Stock & Selling Price Update)
// =========================
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("[updateProduct] PATCH id:", id, "body:", JSON.stringify(req.body));

        const {
            category_id,
            name,
            description,
            material,
            purity,
            weight,
            price,
            manufacturer_price,
            selling_price,
            making_charge_type,
            making_charge_value,
            stone_price,
            stone_cost,
            stone_details,
            stock,
            status,
            image_url,
        } = req.body;

        const mPrice = Number(manufacturer_price ?? price ?? selling_price ?? 0);
        const newStock = stock != null ? Number(stock) : undefined;

        // Validate or resolve category_id to prevent FK errors
        let finalCategoryId = category_id;
        if (category_id) {
            const { data: catCheck } = await supabaseAdmin
                .from("categories")
                .select("id")
                .eq("id", category_id)
                .maybeSingle();

            if (!catCheck) {
                // category_id didn't match directly — try resolving
                const { data: firstCat } = await supabaseAdmin.from("categories").select("id").limit(1).maybeSingle();
                finalCategoryId = firstCat ? firstCat.id : undefined;
                console.warn("[updateProduct] category_id not found, fallback to:", finalCategoryId);
            }
        }

        // Build the shared update payload
        const buildUpdate = (tableTarget = "products") => {
            const u = {};
            if (name !== undefined) u.name = name;
            if (description !== undefined) u.description = description;
            if (finalCategoryId !== undefined) u.category_id = finalCategoryId;
            if (material !== undefined) u.material = material;
            if (purity !== undefined) u.purity = purity;
            if (weight !== undefined) u.weight = weight != null ? Number(weight) : null;
            if (mPrice > 0) {
                u.manufacturer_price = mPrice;
                if (tableTarget === "products") {
                    u.price = mPrice;
                }
            }
            if (tableTarget === "products" && (selling_price != null || price != null)) {
                u.retailer_price = Number(selling_price ?? price);
            }
            if (making_charge_type !== undefined) u.making_charge_type = making_charge_type;
            if (making_charge_value !== undefined) u.making_charge_value = making_charge_value != null ? Number(making_charge_value) : null;
            if (stone_price != null || stone_cost != null) u.stone_price = Number(stone_price ?? stone_cost);
            if (stone_details !== undefined) u.stone_details = stone_details;
            if (tableTarget === "products" && newStock !== undefined) {
                u.stock = newStock;
            }
            if (status !== undefined) u.status = status;
            if (image_url) u.image_url = image_url;
            u.updated_at = new Date().toISOString();
            return u;
        };

        let updatedData = null;

        // Step 1: Try to update 'products' table directly by id
        {
            const pUpdate = buildUpdate("products");
            const { data: pData, error: pErr } = await supabaseAdmin
                .from("products")
                .update(pUpdate)
                .eq("id", id)
                .select();

            if (pErr) {
                console.error("[updateProduct] products table error:", pErr.message);
                // Retry without optional columns
                const safeUpdate = { ...pUpdate };
                delete safeUpdate.image_url;
                delete safeUpdate.making_charge_type;
                delete safeUpdate.making_charge_value;
                delete safeUpdate.stone_price;
                delete safeUpdate.stone_details;
                delete safeUpdate.retailer_price;
                const { data: retryP, error: retryPErr } = await supabaseAdmin
                    .from("products")
                    .update(safeUpdate)
                    .eq("id", id)
                    .select();
                if (retryPErr) {
                    console.error("[updateProduct] products retry error:", retryPErr.message);
                } else if (retryP && retryP.length > 0) {
                    console.log("[updateProduct] products table updated (safe retry), rows:", retryP.length);
                    updatedData = retryP[0];
                }
            } else if (pData && pData.length > 0) {
                console.log("[updateProduct] products table updated, rows:", pData.length);
                updatedData = pData[0];
            } else {
                console.log("[updateProduct] products table: no row matched id", id);
            }
        }

        // Step 2: Try to update 'manufacturer_products' table directly by id
        {
            const mUpdate = buildUpdate("manufacturer_products");
            delete mUpdate.price;
            delete mUpdate.retailer_price;
            delete mUpdate.stock;
            delete mUpdate.stock_quantity;

            const { data: mData, error: mErr } = await supabaseAdmin
                .from("manufacturer_products")
                .update(mUpdate)
                .eq("id", id)
                .select();

            if (mErr) {
                console.error("[updateProduct] manufacturer_products error:", mErr.message);
                const safeM = { ...mUpdate };
                delete safeM.price;
                delete safeM.retailer_price;
                delete safeM.stock;
                delete safeM.stock_quantity;
                delete safeM.image_url;
                delete safeM.making_charge_type;
                delete safeM.making_charge_value;
                delete safeM.stone_price;
                delete safeM.stone_details;

                const { data: retryM, error: retryMErr } = await supabaseAdmin
                    .from("manufacturer_products")
                    .update(safeM)
                    .eq("id", id)
                    .select();
                if (retryMErr) {
                    console.error("[updateProduct] manufacturer_products retry error:", retryMErr.message);
                } else if (retryM && retryM.length > 0) {
                    console.log("[updateProduct] manufacturer_products updated (safe retry), rows:", retryM.length);
                    if (!updatedData) updatedData = retryM[0];
                }
            } else if (mData && mData.length > 0) {
                console.log("[updateProduct] manufacturer_products updated, rows:", mData.length);
                if (!updatedData) updatedData = mData[0];
            } else {
                console.log("[updateProduct] manufacturer_products: no row matched id", id);
            }
        }



        // Step 3: Also check if this id is actually a retailer_product id, and resolve the manufacturer_product_id
        if (!updatedData) {
            const { data: retMatch } = await supabaseAdmin
                .from("retailer_products")
                .select("manufacturer_product_id")
                .eq("id", id)
                .maybeSingle();

            if (retMatch?.manufacturer_product_id) {
                const targetId = retMatch.manufacturer_product_id;
                console.log("[updateProduct] resolved via retailer_products to manufacturer_product_id:", targetId);

                const mUpdate2 = buildUpdate("manufacturer_products");
                delete mUpdate2.price;
                delete mUpdate2.retailer_price;
                const { data: mData2, error: mErr2 } = await supabaseAdmin
                    .from("manufacturer_products")
                    .update(mUpdate2)
                    .eq("id", targetId)
                    .select();

                if (!mErr2 && mData2 && mData2.length > 0) {
                    console.log("[updateProduct] manufacturer_products updated via resolved id, rows:", mData2.length);
                    updatedData = mData2[0];
                }

                // Also update products table with the resolved id
                const pUpdate2 = buildUpdate("products");
                await supabaseAdmin.from("products").update(pUpdate2).eq("id", targetId);

            }
        }

        // Step 4: Update 'retailer_products' if linked (selling_price sync)
        {
            const rUpdate = {
                updated_at: new Date().toISOString(),
            };
            if (selling_price != null || price != null || mPrice > 0) {
                rUpdate.selling_price = Number(selling_price ?? price ?? Math.round(mPrice * 1.15));
            }
            if (newStock !== undefined) rUpdate.stock = newStock;
            if (status !== undefined) rUpdate.status = status;

            await supabaseAdmin
                .from("retailer_products")
                .update(rUpdate)
                .eq("manufacturer_product_id", id);
        }

        // Step 5: Update product_images if image_url provided
        if (image_url) {
            try {
                const { data: existingImg } = await supabaseAdmin
                    .from("product_images")
                    .select("id")
                    .or(`product_id.eq.${id},manufacturer_product_id.eq.${id}`)
                    .maybeSingle();

                if (existingImg) {
                    await supabaseAdmin
                        .from("product_images")
                        .update({ image_url })
                        .eq("id", existingImg.id);
                } else {
                    await supabaseAdmin
                        .from("product_images")
                        .insert({
                            manufacturer_product_id: id,
                            image_url,
                            is_primary: true,
                            display_order: 1,
                        });
                }
            } catch (imgEx) {
                console.error("[updateProduct] product_images update error:", imgEx);
            }
        }

        const responseData = updatedData || { id, name, status, stock, updated_at: new Date().toISOString() };
        console.log("[updateProduct] Final result - updatedData:", updatedData ? "found" : "not found", "name:", responseData.name);

        return res.status(200).json({
            success: true,
            message: "Product updated successfully",
            data: responseData,
        });

    } catch (err) {
        console.error("[updateProduct] Uncaught error:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};


// =========================
// DELETE PRODUCT / REMOVE FROM CATALOG
// =========================
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Product ID is required" });
        }

        // 1. Resolve Target Product ID if passed ID belongs to retailer_products table
        let targetId = id;
        const { data: retMatch } = await supabaseAdmin
            .from("retailer_products")
            .select("manufacturer_product_id")
            .eq("id", id)
            .maybeSingle();

        if (retMatch && retMatch.manufacturer_product_id) {
            targetId = retMatch.manufacturer_product_id;
        }

        // 2. Delete associated image records
        try {
            await supabaseAdmin
                .from("product_images")
                .delete()
                .or(`product_id.eq.${id},product_id.eq.${targetId},manufacturer_product_id.eq.${id},manufacturer_product_id.eq.${targetId}`);
        } catch (_) {}

        // 3. Delete from retailer_products table
        const { error: rErr } = await supabaseAdmin
            .from("retailer_products")
            .delete()
            .or(`id.eq.${id},id.eq.${targetId},manufacturer_product_id.eq.${id},manufacturer_product_id.eq.${targetId}`);

        if (rErr) {
            await supabaseAdmin
                .from("retailer_products")
                .update({ status: "INACTIVE" })
                .or(`id.eq.${id},id.eq.${targetId},manufacturer_product_id.eq.${id},manufacturer_product_id.eq.${targetId}`);
        }

        // 4. Delete from manufacturer_products table
        const { error: mErr } = await supabaseAdmin
            .from("manufacturer_products")
            .delete()
            .or(`id.eq.${id},id.eq.${targetId}`);

        if (mErr) {
            await supabaseAdmin
                .from("manufacturer_products")
                .update({ status: "INACTIVE" })
                .or(`id.eq.${id},id.eq.${targetId}`);
        }

        // 5. Delete from products table
        const { error: pErr } = await supabaseAdmin
            .from("products")
            .delete()
            .or(`id.eq.${id},id.eq.${targetId}`);

        if (pErr) {
            await supabaseAdmin
                .from("products")
                .update({ status: "INACTIVE" })
                .or(`id.eq.${id},id.eq.${targetId}`);
        }

        return res.status(200).json({
            success: true,
            message: "Product removed from catalogue successfully",
        });
    } catch (err) {
        console.error("Error in deleteProduct:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

// =========================
// UPLOAD PRODUCT IMAGE TO SUPABASE STORAGE
// =========================
export const uploadProductImage = async (req, res) => {
    try {
        const { image_data, file_name, file_type } = req.body;

        if (!image_data) {
            return res.status(400).json({
                success: false,
                message: "No image data provided",
            });
        }

        // Ensure products bucket exists in Supabase Storage
        try {
            const { data: buckets } = await supabaseAdmin.storage.listBuckets();
            const exists = (buckets || []).some((b) => b.name === "products");
            if (!exists) {
                await supabaseAdmin.storage.createBucket("products", { public: true });
            }
        } catch (_) {}

        let buffer;
        let mimeType = file_type || "image/jpeg";

        if (typeof image_data === "string" && image_data.startsWith("data:")) {
            const matches = image_data.match(/^data:(.+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                buffer = Buffer.from(matches[2], "base64");
            } else {
                buffer = Buffer.from(image_data, "base64");
            }
        } else if (typeof image_data === "string") {
            buffer = Buffer.from(image_data, "base64");
        } else {
            buffer = Buffer.from(image_data);
        }

        const rawExt = (file_name || "").split(".").pop().toLowerCase();
        const ext = ["png", "jpg", "jpeg", "webp"].includes(rawExt)
            ? (rawExt === "jpeg" ? "jpg" : rawExt)
            : (mimeType.split("/")[1] || "jpg");

        const uniqueName = `product_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const filePath = `items/${uniqueName}`;

        // Upload buffer to Supabase Storage using admin client
        const { error: uploadErr } = await supabaseAdmin.storage
            .from("products")
            .upload(filePath, buffer, {
                contentType: mimeType,
                upsert: true,
                cacheControl: "3600",
            });

        if (uploadErr) {
            console.error("Supabase Storage upload error:", uploadErr);
            return res.status(500).json({
                success: false,
                message: uploadErr.message || "Failed to upload image to Supabase Storage",
            });
        }

        // Retrieve public CDN URL from Supabase Storage
        const { data: publicUrlData } = supabaseAdmin.storage
            .from("products")
            .getPublicUrl(filePath);

        const publicUrl = publicUrlData?.publicUrl;

        return res.status(200).json({
            success: true,
            message: "Image uploaded to Supabase Storage successfully",
            url: publicUrl,
            image_url: publicUrl,
            public_url: publicUrl,
        });

    } catch (err) {
        console.error("Error in uploadProductImage:", err);
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};