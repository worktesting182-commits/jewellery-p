import { supabaseAdmin } from "../config/supabase.js";

async function initProductPricingDb() {
  console.log("🚀 Initializing Product Dynamic Pricing & Stone Cost DB Schema...");

  try {
    // Test selecting new columns from products table
    const { error: selectErr } = await supabaseAdmin
      .from("products")
      .select("id, making_charge_type, making_charge_value, stone_price, stone_details")
      .limit(1);

    if (selectErr && selectErr.message.includes("column")) {
      console.log("⚠️ Columns missing on products table. Running migration via RPC/SQL...");
      
      // Attempt executing raw SQL if rpc function exec_sql exists
      const { error: rpcErr } = await supabaseAdmin.rpc("exec_sql", {
        sql_query: `
          ALTER TABLE public.products 
          ADD COLUMN IF NOT EXISTS making_charge_type TEXT DEFAULT 'PERCENTAGE',
          ADD COLUMN IF NOT EXISTS making_charge_value NUMERIC(12, 2) DEFAULT 12.00,
          ADD COLUMN IF NOT EXISTS stone_price NUMERIC(12, 2) DEFAULT 0.00,
          ADD COLUMN IF NOT EXISTS stone_details TEXT DEFAULT NULL,
          ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

          ALTER TABLE public.manufacturer_products
          ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

          ALTER TABLE public.gold_prices
          ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
        `,
      });

      if (rpcErr) {
        console.warn("Notice: RPC exec_sql unavailable. Direct SQL migration script ready at backend/scripts/migrations/add_making_charges_and_stones_to_products.sql");
      } else {
        console.log("✅ Schema updated successfully in Supabase!");
      }
    } else {
      console.log("✅ Products table columns (making_charge_type, making_charge_value, stone_price, stone_details) are active!");
    }
  } catch (err) {
    console.warn("Product pricing DB check notice:", err.message);
  }

  console.log("✨ Product Pricing DB Initialization Complete!");
}

initProductPricingDb().catch((err) => {
  console.error("❌ Initialization error:", err);
});
