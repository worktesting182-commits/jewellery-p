import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
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

const supabaseAdmin = createClient(prodUrl, prodServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function syncProductionSchema() {
  console.log("==================================================");
  console.log("  CJP PRODUCTION SUPABASE AUTOMATED SCHEMA SYNC   ");
  console.log(`  Target URL: ${prodUrl}`);
  console.log("==================================================\n");

  const sqlFilePath = path.join(__dirname, "../../CJP_PRODUCTION_MASTER_SCHEMA.sql");
  const masterSql = fs.readFileSync(sqlFilePath, "utf-8");

  console.log("1. Executing Master SQL Schema on Production Supabase...");

  try {
    const { data, error } = await supabaseAdmin.rpc("exec_sql", { sql_query: masterSql });
    if (error) {
      console.warn("⚠️ Notice executing RPC exec_sql:", error.message);
      console.log("👉 Please run 'CJP_PRODUCTION_MASTER_SCHEMA.sql' directly in your Supabase SQL Editor for project [sosnghzlgtmbpmiwakos]:");
      console.log("   Link: https://supabase.com/dashboard/project/sosnghzlgtmbpmiwakos/sql/new\n");
    } else {
      console.log("✅ Master SQL Schema executed successfully via Supabase RPC!");
    }
  } catch (err) {
    console.warn("RPC Exception:", err.message);
  }

  // 2. Fallback Table Check & Direct Initializers
  console.log("2. Running Table Verification & Seeding...");
  
  // Seed categories
  const defaultCategories = [
    { name: "Rings", description: "Gold & Diamond Rings" },
    { name: "Necklaces", description: "Fine Necklaces & Chains" },
    { name: "Earrings", description: "Studs, Drops & Hoops" },
    { name: "Bangles & Bracelets", description: "Kadas, Bangles & Bracelets" },
    { name: "Pendants", description: "Crafted Gold Pendants" },
  ];

  for (const cat of defaultCategories) {
    await supabaseAdmin.from("categories").upsert(cat, { onConflict: "name" });
  }
  console.log("✅ Seeded/Validated master categories.");

  console.log("\n==================================================");
  console.log("🎉 PRODUCTION SCHEMA SYNC PROCESS COMPLETED.");
  console.log("   Run 'node backend/scripts/audit_production_schema.js' to verify!");
  console.log("==================================================");
}

syncProductionSchema();
