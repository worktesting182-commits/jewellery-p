import { supabaseAdmin } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, "../data/retailer_gold_schemes.json");

async function syncSchemesToSupabase() {
  console.log("🔄 Syncing Gold Schemes to Supabase table 'retailer_gold_schemes'...");

  // Fetch valid retailer ID from database
  const { data: retailers } = await supabaseAdmin.from("retailers").select("id").limit(1);
  const validRetailerId = retailers && retailers.length > 0 ? retailers[0].id : null;

  if (!validRetailerId) {
    console.error("❌ No retailer found in database. Create a retailer profile first.");
    process.exit(1);
  }

  let schemes = [];
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    schemes = JSON.parse(raw || "[]");
  }

  if (schemes.length === 0) {
    schemes = [
      {
        title: "Swarna Sanchaya 11-Month Gold Scheme",
        description: "Save monthly for 11 months with locked gold rate. Pay 11 monthly installments and get 100% of 12th installment as bonus from store at maturity!",
        fixed_gold_rate: 7245.0,
        monthly_amount: 5000.0,
        target_gold_grams: 7.5845,
        time_period_months: 11,
        frequency: "MONTHLY",
        bonus_description: "100% 12th Month Installment Bonus by Store",
        status: "ACTIVE",
      },
      {
        title: "Kanakavrushti 6-Month Express Gold Scheme",
        description: "Fast-track 6-month gold accumulation plan with fixed gold rate protection against market volatility.",
        fixed_gold_rate: 7200.0,
        monthly_amount: 10000.0,
        target_gold_grams: 8.3333,
        time_period_months: 6,
        frequency: "MONTHLY",
        bonus_description: "50% Making Charge Discount at Maturity",
        status: "ACTIVE",
      },
    ];
  }

  for (const s of schemes) {
    const record = {
      retailer_id: validRetailerId,
      title: s.title,
      description: s.description || "Store Gold Scheme",
      fixed_gold_rate: Number(s.fixed_gold_rate || 7245),
      monthly_amount: Number(s.monthly_amount || 5000),
      target_gold_grams: Number(s.target_gold_grams || 7.5),
      time_period_months: Number(s.time_period_months || 11),
      frequency: s.frequency || "MONTHLY",
      bonus_description: s.bonus_description || "Store Bonus Benefit",
      status: (s.status || "ACTIVE").toUpperCase(),
      created_at: s.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .insert(record)
      .select();

    if (error) {
      console.error(`❌ Error inserting "${s.title}":`, error.message);
    } else {
      console.log(`✅ Synced into Supabase table retailer_gold_schemes: "${s.title}" (ID: ${data[0]?.id})`);
    }
  }

  console.log("\n✨ All Gold Schemes have been successfully inserted into Supabase!");
}

syncSchemesToSupabase().catch((err) => {
  console.error("❌ Sync error:", err);
  process.exit(1);
});
