import { supabaseAdmin } from "../config/supabase.js";

async function initGoldSchemesDb() {
  console.log("🚀 Initializing Retailer Gold Schemes Database & Sample Schemes...");

  try {
    // 1. Check if retailer_gold_schemes table exists by querying it
    const { data: existingSchemes, error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .select("id")
      .limit(1);

    if (error) {
      console.warn("Notice: retailer_gold_schemes query check:", error.message);
    } else {
      console.log(`✅ Table retailer_gold_schemes verified! Total schemes count check.`);
    }

    // 2. Fetch existing retailers
    const { data: retailers } = await supabaseAdmin.from("retailers").select("id, shop_name, company_name");
    const retailerList = retailers || [];

    if (retailerList.length > 0) {
      for (const ret of retailerList) {
        const { data: schemes } = await supabaseAdmin
          .from("retailer_gold_schemes")
          .select("id")
          .eq("retailer_id", ret.id);

        if (!schemes || schemes.length === 0) {
          const sampleSchemes = [
            {
              retailer_id: ret.id,
              title: "Swarna Sanchaya 11-Month Gold Scheme",
              description: "Save monthly for 11 months with locked gold rate. Pay 11 monthly installments and get 100% of 12th installment as bonus from retailer at maturity!",
              fixed_gold_rate: 7245.00,
              monthly_amount: 5000.00,
              target_gold_grams: 7.5845,
              time_period_months: 11,
              frequency: "MONTHLY",
              bonus_description: "100% 12th Month Installment Bonus by Retailer",
              status: "ACTIVE",
            },
            {
              retailer_id: ret.id,
              title: "Kanakavrushti 6-Month Express Gold Scheme",
              description: "Fast-track 6-month gold accumulation plan with fixed gold rate protection against market volatility.",
              fixed_gold_rate: 7200.00,
              monthly_amount: 10000.00,
              target_gold_grams: 8.3333,
              time_period_months: 6,
              frequency: "MONTHLY",
              bonus_description: "50% Making Charge Discount at Maturity",
              status: "ACTIVE",
            },
          ];

          for (const s of sampleSchemes) {
            try {
              await supabaseAdmin.from("retailer_gold_schemes").insert(s);
            } catch (_) {}
          }
          console.log(`✅ Seeded sample Gold Schemes for Retailer: ${ret.shop_name || ret.company_name}`);
        }
      }
    }
  } catch (err) {
    console.error("Notice during initGoldSchemesDb:", err.message);
  }

  console.log("✨ Retailer Gold Schemes DB Initialization Complete!");
}

initGoldSchemesDb().catch((err) => {
  console.error("❌ Initialization error:", err);
  process.exit(1);
});
