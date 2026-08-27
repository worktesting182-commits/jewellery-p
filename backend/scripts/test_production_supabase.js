import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables explicitly
dotenv.config({ path: path.join(__dirname, "../.env.production") });

const prodUrl = process.env.SUPABASE_URL;
const prodServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const prodAnonKey = process.env.SUPABASE_ANON_KEY;

console.log("==================================================");
console.log("   TESTING PRODUCTION SUPABASE PROJECT CONNECTION   ");
console.log("==================================================");
console.log("Supabase Production URL:", prodUrl);
console.log("Service Role Key defined:", Boolean(prodServiceKey));
console.log("Anon Key defined:", Boolean(prodAnonKey));
console.log("--------------------------------------------------\n");

if (!prodUrl || !prodServiceKey || !prodAnonKey) {
  console.error("❌ Missing production environment variables in .env.production");
  process.exit(1);
}

const supabaseAdmin = createClient(prodUrl, prodServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const supabaseAnon = createClient(prodUrl, prodAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function runProductionTests() {
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, details = "") => {
    if (condition) {
      console.log(`[PASS] ✅ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName} ${details ? "(" + details + ")" : ""}`);
      failed++;
    }
  };

  // 1. Connection & Auth Verification
  console.log("1. --- Testing Production Supabase Auth & Service Connection ---");
  try {
    const { data: healthData, error: healthErr } = await supabaseAdmin.from("users").select("count", { count: "exact", head: true });
    assert(!healthErr, "Service Role Key connection to Supabase DB", healthErr?.message);
  } catch (err) {
    assert(false, "Service Role Key connection to Supabase DB", err.message);
  }

  // 2. Table Existence & Accessibility Check
  const tablesToVerify = [
    "users",
    "categories",
    "manufacturers",
    "retailers",
    "manufacturer_products",
    "retailer_products",
    "orders",
    "retailer_gold_schemes",
    "notifications",
    "gold_prices",
    "gold_sips",
  ];

  console.log("\n2. --- Testing Database Table Accessibility ---");
  for (const tableName of tablesToVerify) {
    try {
      const { data, error } = await supabaseAdmin.from(tableName).select("*").limit(1);
      if (error) {
        assert(false, `Table '${tableName}' query`, error.message);
      } else {
        assert(true, `Table '${tableName}' accessible (rows: ${data.length})`);
      }
    } catch (err) {
      assert(false, `Table '${tableName}' query`, err.message);
    }
  }

  // 3. Category Verification & Seeding
  console.log("\n3. --- Testing Categories & Seeding ---");
  let categoryId = null;
  try {
    let { data: categories, error: catErr } = await supabaseAdmin.from("categories").select("*");
    if (catErr) {
      assert(false, "Fetch categories", catErr.message);
    } else {
      if (categories.length === 0) {
        console.log("Seeding default categories into production Supabase...");
        const defaultCategories = [
          { name: "Rings", description: "Gold & Diamond Rings" },
          { name: "Necklaces", description: "Fine Necklaces & Chains" },
          { name: "Earrings", description: "Studs, Drops & Hoops" },
          { name: "Bangles & Bracelets", description: "Kadas, Bangles & Bracelets" },
          { name: "Pendants", description: "Crafted Gold Pendants" },
        ];
        const { data: insertedCats, error: insertCatErr } = await supabaseAdmin
          .from("categories")
          .insert(defaultCategories)
          .select();
        assert(!insertCatErr, "Seeded default categories", insertCatErr?.message);
        categories = insertedCats || [];
      }
      categoryId = categories[0]?.id;
      assert(categories.length > 0 && Boolean(categoryId), `Categories present in DB (Count: ${categories.length}, Sample ID: ${categoryId})`);
    }
  } catch (err) {
    assert(false, "Category check/seeding", err.message);
  }

  // 4. Full End-to-End Workflow Verification on Production Supabase
  console.log("\n4. --- Testing End-to-End Workflow on Production DB ---");
  let mfgUser = null;
  let retUser = null;
  let custUser = null;
  let customer = null;
  let mfg = null;
  let retailer = null;
  let mProduct = null;
  let storeListing = null;
  let order = null;
  let orderItem = null;

  try {
    // Step A: Create Manufacturer User
    const mfgEmail = `prod_mfg_${Date.now()}@test.com`;
    const { data: newUser, error: uErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: mfgEmail,
        full_name: "Prod Test Manufacturer",
        role: "MANUFACTURER",
        status: "ACTIVE",
      })
      .select()
      .single();
    mfgUser = newUser;
    assert(!uErr && Boolean(mfgUser?.id), `Created test Manufacturer User (${mfgEmail})`, uErr?.message);

    // Step B: Create Manufacturer Record linked to user_id
    if (mfgUser?.id) {
      const { data: newMfg, error: mfgErr } = await supabaseAdmin
        .from("manufacturers")
        .insert({
          user_id: mfgUser.id,
          company_name: "Prod Artisan Studio",
          license_number: `PROD-LIC-${Date.now()}`,
        })
        .select()
        .single();
      mfg = newMfg;
      assert(!mfgErr && Boolean(mfg?.id), `Created Manufacturer Record (ID: ${mfg?.id})`, mfgErr?.message);
    }

    // Step C: Create Master Product
    if (mfg?.id && categoryId) {
      const testProductName = `PROD 24K Gold Pendant ${Date.now()}`;
      const { data: newProd, error: mProdErr } = await supabaseAdmin
        .from("manufacturer_products")
        .insert({
          manufacturer_id: mfg.id,
          category_id: categoryId,
          name: testProductName,
          description: "24K Fine Gold Pendant for production testing.",
          material: "24K Gold",
          purity: "999",
          weight: 8.5,
          manufacturer_price: 62000,
          status: "ACTIVE",
        })
        .select()
        .single();
      mProduct = newProd;
      assert(!mProdErr && Boolean(mProduct?.id), `Created Manufacturer Master Product (₹62,000)`, mProdErr?.message);
    }

    // Step D: Create Retailer User & Retailer Record
    const retEmail = `prod_ret_${Date.now()}@test.com`;
    const { data: newRetUser, error: ruErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: retEmail,
        full_name: "Prod Test Retailer",
        role: "RETAILER",
        status: "ACTIVE",
      })
      .select()
      .single();
    retUser = newRetUser;
    assert(!ruErr && Boolean(retUser?.id), `Created test Retailer User (${retEmail})`, ruErr?.message);

    if (retUser?.id) {
      const { data: newRet, error: retErr } = await supabaseAdmin
        .from("retailers")
        .insert({
          user_id: retUser.id,
          shop_name: "Prod Heritage Jewellers",
          gst_number: `29PROD${Date.now().toString().slice(-6)}Z5`,
        })
        .select()
        .single();
      retailer = newRet;
      assert(!retErr && Boolean(retailer?.id), `Created Retailer Record (ID: ${retailer?.id})`, retErr?.message);
    }

    // Step E: Publish Retailer Product Listing
    if (retailer?.id && mProduct?.id) {
      const { data: listing, error: listingErr } = await supabaseAdmin
        .from("retailer_products")
        .insert({
          retailer_id: retailer.id,
          manufacturer_product_id: mProduct.id,
          selling_price: 68000,
          stock: 15,
          status: "ACTIVE",
        })
        .select()
        .single();
      storeListing = listing;
      assert(!listingErr && Boolean(storeListing?.id), `Published Retailer Marketplace Listing (₹68,000, Stock: 15)`, listingErr?.message);
    }

    // Step F: Create Customer User & Customer Profile
    const custEmail = `prod_cust_${Date.now()}@test.com`;
    const { data: newCustUser, error: cuErr } = await supabaseAdmin
      .from("users")
      .insert({
        email: custEmail,
        full_name: "Prod Test Customer",
        role: "CUSTOMER",
        status: "ACTIVE",
      })
      .select()
      .single();
    custUser = newCustUser;

    if (custUser?.id) {
      const { data: newCustProfile, error: custProfErr } = await supabaseAdmin
        .from("customers")
        .insert({
          user_id: custUser.id,
        })
        .select()
        .single();
      customer = newCustProfile;
      assert(!custProfErr && Boolean(customer?.id), `Created Customer Profile (ID: ${customer?.id})`, custProfErr?.message);
    }

    // Step G: Test Order Placement & Status Lifecycle in Production DB
    if (customer?.id && storeListing?.id) {
      const { data: newOrder, error: orderErr } = await supabaseAdmin
        .from("orders")
        .insert({
          customer_id: customer.id,
          total_amount: 68000,
          order_status: "PENDING",
          payment_status: "PAID",
        })
        .select()
        .single();
      order = newOrder;
      assert(!orderErr && Boolean(order?.id), `Created Customer Order (ID: ${order?.id}, Total: ₹68,000)`, orderErr?.message);

      if (order?.id && mProduct?.id) {
        const { data: newItem, error: itemErr } = await supabaseAdmin
          .from("order_items")
          .insert({
            order_id: order.id,
            product_id: mProduct.id,
            quantity: 1,
            price: 68000,
          })
          .select()
          .single();
        orderItem = newItem;
        assert(!itemErr && Boolean(orderItem?.id), `Created Order Item detail linked to Order`, itemErr?.message);

        // Update Order Lifecycle Status
        const { data: updatedOrder, error: updateErr } = await supabaseAdmin
          .from("orders")
          .update({ order_status: "PROCESSING" })
          .eq("id", order.id)
          .select()
          .single();
        assert(updatedOrder?.order_status === "PROCESSING", "Updated Order Lifecycle Status to PROCESSING", updateErr?.message);
      }
    }

  } catch (err) {
    assert(false, "E2E Production Workflow Exception", err.message);
  } finally {
    // Cleanup Test Records
    console.log("\n5. --- Cleaning Up Test Data ---");
    if (orderItem?.id) await supabaseAdmin.from("order_items").delete().eq("id", orderItem.id);
    if (order?.id) await supabaseAdmin.from("orders").delete().eq("id", order.id);
    if (storeListing?.id) await supabaseAdmin.from("retailer_products").delete().eq("id", storeListing.id);
    if (mProduct?.id) await supabaseAdmin.from("manufacturer_products").delete().eq("id", mProduct.id);
    if (retailer?.id) await supabaseAdmin.from("retailers").delete().eq("id", retailer.id);
    if (mfg?.id) await supabaseAdmin.from("manufacturers").delete().eq("id", mfg.id);
    if (customer?.id) await supabaseAdmin.from("customers").delete().eq("id", customer.id);
    if (custUser?.id) await supabaseAdmin.from("users").delete().eq("id", custUser.id);
    if (retUser?.id) await supabaseAdmin.from("users").delete().eq("id", retUser.id);
    if (mfgUser?.id) await supabaseAdmin.from("users").delete().eq("id", mfgUser.id);
    console.log("✅ Cleaned up temporary E2E test entries from production DB.");
  }


  console.log("\n==================================================");
  console.log(`   PRODUCTION SUPABASE SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runProductionTests();

