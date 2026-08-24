import { calculateDynamicPrice, getPurityMultiplier } from "../utils/pricingEngine.js";

function runDynamicPricingTests() {
  console.log("=========================================");
  console.log("🧪 DYNAMIC PRODUCT PRICING ENGINE VERIFICATION");
  console.log("=========================================\n");

  const mockRates1 = { gold_24k: 7245, silver: 85 };

  // Test 1: 22K Gold 10g with 12% making charge + 500 stone cost
  const prod1 = {
    name: "22K Royal Gold Chain",
    material: "Gold",
    purity: "22K",
    weight: 10.0,
    making_charge_type: "PERCENTAGE",
    making_charge_value: 12.0,
    stone_price: 500.0,
  };

  const result1 = calculateDynamicPrice(prod1, mockRates1);
  console.log("📌 Test 1: 22K Gold 10g (24K Rate @ ₹7,245/g)");
  console.log("Purity Multiplier:", getPurityMultiplier("22K").toFixed(4));
  console.log("Price Breakdown:", JSON.stringify(result1.price_breakdown, null, 2));
  console.log("Selling Price:", `₹${result1.selling_price}`);

  // Expected Metal Cost: 10 * (7245 * 22/24) = 66412.50
  // Expected Making Charge (12%): 66412.50 * 0.12 = 7969.50
  // Expected Stone Cost: 500
  // Expected Total: 66412.50 + 7969.50 + 500 = 74882
  const expectedTotal1 = 74882;
  console.log(`Assertion: Calculated ${result1.selling_price} === Expected ${expectedTotal1}: ${result1.selling_price === expectedTotal1 ? "✅ PASSED" : "❌ FAILED"}\n`);

  // Test 2: Admin Updates Gold Rate to ₹7,500/g -> Product Auto-Updates
  const mockRates2 = { gold_24k: 7500, silver: 90 };
  const result2 = calculateDynamicPrice(prod1, mockRates2);
  console.log("📌 Test 2: Admin Updates Benchmark Gold Rate to ₹7,500/g");
  console.log("New Effective Rate/g:", result2.price_breakdown.effective_rate_per_gram);
  console.log("New Total Selling Price:", `₹${result2.selling_price}`);
  console.log(`Assertion: Rate increased from ₹74,882 to ₹${result2.selling_price}: ${result2.selling_price > result1.selling_price ? "✅ PASSED" : "❌ FAILED"}\n`);

  // Test 3: Silver Product with Flat Making Charge
  const prodSilver = {
    name: "Sterling Silver Anklet",
    material: "Silver",
    purity: "925",
    weight: 25.0,
    making_charge_type: "FLAT_PER_GRAM",
    making_charge_value: 15.0, // ₹15/g
    stone_price: 150.0,
  };

  const resultSilver = calculateDynamicPrice(prodSilver, mockRates1);
  console.log("📌 Test 3: Sterling Silver 25g Anklet");
  console.log("Silver Price Breakdown:", JSON.stringify(resultSilver.price_breakdown, null, 2));
  console.log("Selling Price:", `₹${resultSilver.selling_price}\n`);

  // Test 4: Static Fallback when weight is omitted
  const prodStatic = {
    name: "Handcrafted Antique Box",
    material: "Wood & Brass",
    weight: null,
    selling_price: 4500,
  };
  const resultStatic = calculateDynamicPrice(prodStatic, mockRates1);
  console.log("📌 Test 4: Static Product Fallback (No Weight)");
  console.log("Selling Price:", `₹${resultStatic.selling_price}`);
  console.log(`Assertion: Static Fallback === 4500: ${resultStatic.selling_price === 4500 ? "✅ PASSED" : "❌ FAILED"}\n`);

  console.log("✨ ALL DYNAMIC PRICING ENGINE TESTS COMPLETED!");
}

runDynamicPricingTests();
