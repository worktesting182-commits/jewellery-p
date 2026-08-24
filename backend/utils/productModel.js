import { calculateDynamicPrice } from "./pricingEngine.js";

/**
 * Domain Product Model Normalizer
 * Encapsulates core business rules for product source, ownership, cost, customer price, dynamic gold pricing, and visibility.
 */
export function normalizeProduct(rawRecord, liveRates = null) {
  if (!rawRecord) return null;

  // Determine Source (MANUFACTURER or RETAILER)
  const source =
    rawRecord.product_source ||
    (rawRecord.is_custom || rawRecord.retailer_id ? "RETAILER" : "MANUFACTURER");

  // Determine Owner (Identity & Type)
  const ownerId =
    source === "RETAILER"
      ? rawRecord.retailer_id
      : rawRecord.manufacturer_id || rawRecord.manufacturer?.id;

  const ownerType = source; // "MANUFACTURER" | "RETAILER"

  const ownerName =
    source === "RETAILER"
      ? rawRecord.retailer_name || rawRecord.retailer?.shop_name || rawRecord.manufacturer_name || "Artisan Retailer"
      : rawRecord.manufacturer_name || rawRecord.manufacturer?.company_name || "Master Artisan";

  // Determine Cost (Wholesale acquisition cost for Manufacturer products; NULL for Retailer products)
  const cost =
    source === "MANUFACTURER" && rawRecord.manufacturer_price != null
      ? Number(rawRecord.manufacturer_price)
      : null;

  // Static Fallback Selling Price
  const fallbackSellingPrice = Number(
    rawRecord.selling_price ?? rawRecord.retailer_price ?? rawRecord.price ?? 0
  );

  // Dynamic Price Calculation (Gold/Silver Market Rate + Making Charge + Stone Cost)
  const { selling_price: calculatedPrice, price_breakdown } = calculateDynamicPrice(
    {
      ...rawRecord,
      selling_price: fallbackSellingPrice,
    },
    liveRates
  );

  const finalSellingPrice = calculatedPrice || fallbackSellingPrice;

  // Customer Visibility Status
  const status = (rawRecord.status || "ACTIVE").toUpperCase();
  const isVisibleToCustomer = status === "ACTIVE";

  const imgUrl =
    rawRecord.image_url ||
    rawRecord.image ||
    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&q=80&w=600";

  // Preserve raw manufacturer wholesale price separately from dynamic selling price
  const rawManufacturerPrice = rawRecord.manufacturer_price != null
    ? Number(rawRecord.manufacturer_price)
    : (rawRecord.price != null ? Number(rawRecord.price) : null);

  return {
    id: rawRecord.id,
    source, // "MANUFACTURER" | "RETAILER"
    product_source: source,

    owner: {
      id: ownerId || null,
      type: ownerType,
      name: ownerName,
    },
    owner_id: ownerId || null,
    owner_type: ownerType,
    manufacturer_id: source === "MANUFACTURER" ? ownerId : null,
    retailer_id: source === "RETAILER" ? ownerId : (rawRecord.retailer_id || null),
    manufacturer_product_id: rawRecord.manufacturer_product_id || (source === "MANUFACTURER" ? rawRecord.id : null),
    retailer_product_id: rawRecord.retailer_product_id || rawRecord.id,

    cost, // Wholesale acquisition cost
    // Keep raw manufacturer_price always (used by manufacturer edit form)
    manufacturer_price: rawManufacturerPrice,

    selling_price: finalSellingPrice, // Dynamic or fallback retail price
    retailer_price: finalSellingPrice,
    price: finalSellingPrice,

    price_breakdown, // Full itemized price breakdown (metal cost + making charges + stone cost)

    is_visible_to_customer: isVisibleToCustomer,
    status,

    // Core product attributes
    name: rawRecord.name || "Jewellery Item",
    description: rawRecord.description || "",
    material: rawRecord.material || "Gold",
    purity: rawRecord.purity || "22K",
    weight: rawRecord.weight != null ? Number(rawRecord.weight) : null,
    making_charge_type: rawRecord.making_charge_type || "PERCENTAGE",
    making_charge_value: rawRecord.making_charge_value != null ? Number(rawRecord.making_charge_value) : 12.0,
    stone_price: rawRecord.stone_price != null ? Number(rawRecord.stone_price) : 0,
    stone_cost: rawRecord.stone_price != null ? Number(rawRecord.stone_price) : (rawRecord.stone_cost != null ? Number(rawRecord.stone_cost) : 0),
    stone_details: rawRecord.stone_details || null,
    // Preserve category_id and category join object for frontend form select matching
    category_id: rawRecord.category_id || null,
    category: rawRecord.category || null,
    categories: rawRecord.categories || rawRecord.category || null,
    category_name: rawRecord.category_name || rawRecord.category?.name || rawRecord.categories?.name || null,
    stock: rawRecord.stock != null ? Number(rawRecord.stock) : 0,

    image_url: imgUrl,
    image: imgUrl,

    is_custom: source === "RETAILER",
    sourcing_type: source === "RETAILER" ? "RETAILER_CUSTOM" : "CLOUD_WHOLESALE",

    created_at: rawRecord.created_at || new Date().toISOString(),
    updated_at: rawRecord.updated_at || new Date().toISOString(),
  };
}

