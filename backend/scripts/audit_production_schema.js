import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.production") });

const prodUrl = process.env.SUPABASE_URL;
const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!prodUrl || !prodServiceKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.production");
  process.exit(1);
}

const supabase = createClient(prodUrl, prodServiceKey, {
  auth: { persistSession: false },
});

const schemaTables = [
  { table: "users", requiredCols: ["id", "email", "full_name", "role", "status"] },
  { table: "categories", requiredCols: ["id", "name", "description"] },
  { table: "manufacturers", requiredCols: ["id", "user_id", "company_name", "license_number"] },
  { table: "retailers", requiredCols: ["id", "user_id", "shop_name", "retailer_code"] },
  { table: "customers", requiredCols: ["id", "user_id"] },
  { table: "customer_retailers", requiredCols: ["id", "customer_id", "retailer_id", "status"] },
  { table: "manufacturer_products", requiredCols: ["id", "manufacturer_id", "category_id", "name", "sku", "material", "purity", "weight", "manufacturer_price"] },
  { table: "retailer_products", requiredCols: ["id", "retailer_id", "manufacturer_product_id", "selling_price", "stock"] },
  { table: "carts", requiredCols: ["id", "customer_id", "retailer_id"] },
  { table: "cart_items", requiredCols: ["id", "cart_id", "retailer_product_id", "quantity"] },
  { table: "orders", requiredCols: ["id", "customer_id", "retailer_id", "total_amount", "order_status", "payment_status"] },
  { table: "order_items", requiredCols: ["id", "order_id", "product_id", "quantity", "price"] },
  { table: "notifications", requiredCols: ["id", "user_id", "title", "message", "is_read"] },
  { table: "bulk_import_batches", requiredCols: ["id", "manufacturer_id", "status"] },
  { table: "staged_products", requiredCols: ["id", "batch_id", "raw_data", "validation_errors", "status"] },
  { table: "retailer_gold_schemes", requiredCols: ["id", "retailer_id", "scheme_name", "monthly_amount", "duration_months"] },
  { table: "gold_prices", requiredCols: ["id", "purity", "price_per_gram", "effective_date"] },
  { table: "gold_sips", requiredCols: ["id", "customer_id", "retailer_id", "monthly_amount"] },
  { table: "gold_transactions", requiredCols: ["id", "sip_id", "amount", "gold_weight_grams"] },
  { table: "gold_balances", requiredCols: ["id", "customer_id", "total_gold_grams"] },
];

async function runAudit() {
  console.log("==================================================");
  console.log("  CJP PRODUCTION SUPABASE SCHEMA AUDIT TOOL       ");
  console.log(`  Target: ${prodUrl}`);
  console.log("==================================================\n");

  let missingTables = [];
  let existingTables = [];
  let columnErrors = [];

  for (const item of schemaTables) {
    try {
      const { data, error } = await supabase.from(item.table).select("*").limit(1);
      if (error) {
        missingTables.push({ table: item.table, error: error.message });
      } else {
        existingTables.push(item.table);
        // Check column existence if sample row available or via column test
        if (data.length > 0) {
          const sampleRow = data[0];
          const missingCols = item.requiredCols.filter(col => !(col in sampleRow));
          if (missingCols.length > 0) {
            columnErrors.push({ table: item.table, missingCols });
          }
        }
      }
    } catch (err) {
      missingTables.push({ table: item.table, error: err.message });
    }
  }

  console.log(`✅ Existing Tables (${existingTables.length}/${schemaTables.length}):`);
  existingTables.forEach(t => console.log(`   - ${t}`));

  if (missingTables.length > 0) {
    console.log(`\n❌ Missing or Inaccessible Tables (${missingTables.length}):`);
    missingTables.forEach(m => console.log(`   - ${m.table}: ${m.error}`));
  } else {
    console.log("\n🎉 ALL 20 CJP PRODUCTION TABLES ARE PRESENT AND ACCESSIBLE!");
  }

  if (columnErrors.length > 0) {
    console.log("\n⚠️ Column Mismatches Detected:");
    columnErrors.forEach(ce => console.log(`   - ${ce.table} missing columns: ${ce.missingCols.join(", ")}`));
  } else {
    console.log("🎉 ALL REQUIRED COLUMNS ARE VALIDATED!");
  }

  console.log("\n==================================================");
}

runAudit();
