import { supabaseAdmin } from "../config/supabase.js";

// Cache for live rates to prevent spamming DB on every single item in list
let rateCache = null;
let rateCacheTime = 0;
const CACHE_TTL_MS = 30000; // 30 seconds TTL

export function invalidateBenchmarkRateCache() {
  rateCache = null;
  rateCacheTime = 0;
}

/**
 * Fetch latest 24K Gold & Silver rates from database
 */
export async function getLatestBenchmarkRates() {
  const now = Date.now();
  if (rateCache && now - rateCacheTime < CACHE_TTL_MS) {
    return rateCache;
  }

  let gold24k = 7245;
  let silverFine = 85;

  try {
    const { data: history } = await supabaseAdmin
      .from("gold_prices")
      .select("price_per_gram, purity, effective_from")
      .order("effective_from", { ascending: false })
      .limit(20);

    if (history && history.length > 0) {
      const gRec = history.find((h) => h.purity === "24K" || !h.purity || h.purity !== "FINE_SILVER");
      const sRec = history.find((h) => h.purity === "FINE_SILVER" || h.purity === "SILVER");

      if (gRec && Number(gRec.price_per_gram) > 0) {
        gold24k = Number(gRec.price_per_gram);
      }
      if (sRec && Number(sRec.price_per_gram) > 0) {
        silverFine = Number(sRec.price_per_gram);
      }
    }
  } catch (err) {
    console.warn("Notice: Fetching benchmark rates fell back to default:", err.message);
  }

  rateCache = { gold_24k: gold24k, silver: silverFine };
  rateCacheTime = now;
  return rateCache;
}

/**
 * Purity Multipliers relative to 24K (1.00)
 */
export function getPurityMultiplier(purityStr) {
  if (!purityStr) return 0.9167; // Default 22K (91.67%)
  const clean = String(purityStr).toUpperCase().trim();

  if (clean === "24K" || clean === "999" || clean === "FINE_GOLD") return 1.0;
  if (clean === "22K" || clean === "916" || clean === "22 KARAT") return 22 / 24; // 0.916666...
  if (clean === "20K" || clean === "833") return 20 / 24; // 0.833333...
  if (clean === "18K" || clean === "750" || clean === "18 KARAT") return 18 / 24; // 0.75
  if (clean === "14K" || clean === "585" || clean === "14 KARAT") return 14 / 24; // 0.583333...
  if (clean === "10K" || clean === "417") return 10 / 24; // 0.416666...
  if (clean === "FINE_SILVER" || clean === "SILVER" || clean === "925" || clean === "STERLING") return 1.0;

  // Try parsing integer karat e.g. "21K" -> 21/24
  const match = clean.match(/^(\d+)\s*K?/);
  if (match && match[1]) {
    const k = parseInt(match[1], 10);
    if (k > 0 && k <= 24) return k / 24;
  }

  return 0.9167; // Default 22K
}

/**
 * Calculates dynamic market price & full price breakdown
 */
export function calculateDynamicPrice(product, liveRates) {
  const fallbackPrice = Number(
    product.selling_price ?? product.retailer_price ?? product.manufacturer_price ?? product.price ?? 0
  );

  const weight = product.weight != null ? Number(product.weight) : null;
  const material = (product.material || "Gold").trim();
  const purity = (product.purity || "22K").trim();

  // If product weight is not specified, fall back to static price
  if (!weight || weight <= 0 || !liveRates) {
    return {
      selling_price: fallbackPrice,
      price_breakdown: {
        is_dynamic: false,
        material,
        purity,
        weight_g: weight || 0,
        benchmark_rate_per_gram: liveRates ? (material.toLowerCase().includes("silver") ? liveRates.silver : liveRates.gold_24k) : 0,
        effective_rate_per_gram: 0,
        metal_cost: fallbackPrice,
        making_charge_type: product.making_charge_type || "PERCENTAGE",
        making_charge_value: Number(product.making_charge_value || 0),
        making_charge_amount: 0,
        stone_cost: Number(product.stone_price || product.stone_cost || 0),
        total_price: fallbackPrice,
      },
    };
  }

  const isSilver = material.toLowerCase().includes("silver");
  const baseBenchmarkRate = isSilver ? liveRates.silver : liveRates.gold_24k;
  const multiplier = getPurityMultiplier(purity);
  const effectiveRatePerGram = baseBenchmarkRate * multiplier;

  const metalCost = weight * effectiveRatePerGram;

  const mcType = (product.making_charge_type || "PERCENTAGE").toUpperCase();
  const mcVal = product.making_charge_value != null ? Number(product.making_charge_value) : 12.0;

  let makingChargeAmount = 0;
  if (mcType === "FLAT_PER_GRAM") {
    makingChargeAmount = weight * mcVal;
  } else {
    // Default PERCENTAGE of metal cost
    makingChargeAmount = metalCost * (mcVal / 100);
  }

  const stoneCostAmount = Number(product.stone_price || product.stone_cost || 0);

  const totalPriceRaw = metalCost + makingChargeAmount + stoneCostAmount;
  const totalPrice = Math.round(totalPriceRaw);

  return {
    selling_price: totalPrice,
    price_breakdown: {
      is_dynamic: true,
      material,
      purity,
      weight_g: weight,
      benchmark_rate_per_gram: baseBenchmarkRate,
      effective_rate_per_gram: Math.round(effectiveRatePerGram * 100) / 100,
      metal_cost: Math.round(metalCost * 100) / 100,
      making_charge_type: mcType,
      making_charge_value: mcVal,
      making_charge_amount: Math.round(makingChargeAmount * 100) / 100,
      stone_cost: Math.round(stoneCostAmount * 100) / 100,
      total_price: totalPrice,
    },
  };
}
