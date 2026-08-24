import { supabaseAdmin } from "../config/supabase.js";

async function runMigration() {
  console.log("==========================================");
  console.log("      MIGRATING PRODUCTS TABLE SCHEMA     ");
  console.log("==========================================");

  try {
    // 1. Check if `products` table exists and accessible
    const { data: testP, error: testPErr } = await supabaseAdmin.from("products").select("id").limit(1);

    if (testPErr && testPErr.code === "PGRST205") {
      console.log("Table 'products' does not exist yet in public schema.");
      console.log("Notice: Please ensure the SQL migration in backend/scripts/migrations/update_products_schema.sql is executed in your Supabase SQL Editor if direct DDL execution via REST is restricted.");
    } else {
      console.log("Table 'products' verified in Supabase database.");
    }

    // 2. Fetch existing manufacturer_products to sync/migrate if needed
    const { data: mProds, error: mErr } = await supabaseAdmin
      .from("manufacturer_products")
      .select("*");

    if (!mErr && Array.isArray(mProds) && mProds.length > 0) {
      console.log(`Found ${mProds.length} items in 'manufacturer_products'. Checking sync with 'products'...`);

      for (const item of mProds) {
        // Prepare row conforming to new products table model:
        // manufacturer_id = manufacturer, retailer_id = NULL, product_source = 'MANUFACTURER'
        const productRow = {
          id: item.id,
          manufacturer_id: item.manufacturer_id,
          retailer_id: null,
          category_id: item.category_id,
          name: item.name,
          description: item.description,
          material: item.material,
          purity: item.purity,
          weight: item.weight,
          manufacturer_price: item.manufacturer_price,
          retailer_price: null,
          product_source: "MANUFACTURER",
          status: item.status || "ACTIVE",
          created_at: item.created_at,
          updated_at: item.updated_at,
        };

        const { error: upsertErr } = await supabaseAdmin
          .from("products")
          .upsert(productRow, { onConflict: "id" });

        if (upsertErr) {
          console.warn(`Could not sync item ${item.id} to products table:`, upsertErr.message);
        } else {
          console.log(`Synced master manufacturer product ${item.name} (${item.id}) to 'products' table.`);
        }
      }
    }

    console.log("Migration script step completed successfully.");
  } catch (err) {
    console.error("Migration script exception:", err);
  }
}

runMigration();
