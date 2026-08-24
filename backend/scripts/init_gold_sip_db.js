import { supabaseAdmin } from "../config/supabase.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initGoldSipDb() {
  console.log("🚀 Initializing Gold SIP Database Schema & Benchmark Rates...");

  // 1. Seed initial benchmark gold price if not present
  try {
    const { data: existingPrice } = await supabaseAdmin
      .from("gold_prices")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!existingPrice) {
      const { data: newPrice, error: pErr } = await supabaseAdmin
        .from("gold_prices")
        .insert({
          price_per_gram: 7245,
          purity: "24K",
          currency: "INR",
          effective_from: new Date().toISOString(),
        })
        .select()
        .single();

      if (pErr) {
        console.warn("Notice seeding gold_prices:", pErr.message);
      } else {
        console.log("✅ Seeded initial 24K Gold Price: ₹7,245 / gram");
      }
    } else {
      console.log(`✅ Current 24K Benchmark Gold Price: ₹${existingPrice.price_per_gram} / g`);
    }
  } catch (err) {
    console.warn("gold_prices table check notice:", err.message);
  }

  console.log("✨ Gold SIP DB Initialization Complete!");
}

initGoldSipDb().catch((err) => {
  console.error("❌ Migration error:", err);
  process.exit(1);
});
