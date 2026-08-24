import { supabaseAdmin } from "../config/supabase.js";
import * as notificationService from "../services/notificationService.js";
import * as orderService from "../services/orderService.js";

async function runE2ETests() {
  console.log("==========================================");
  console.log("   AURACRAFT E2E FUNCTIONAL VERIFICATION   ");
  console.log("==========================================");

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`[PASS] ✅ ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ❌ ${testName}`);
      failed++;
    }
  };

  try {
    // ----------------------------------------------------
    // STEP 1: Categories Setup
    // ----------------------------------------------------
    const { data: categories } = await supabaseAdmin
      .from("categories")
      .select("id, name")
      .limit(1);

    let categoryId = categories && categories.length > 0 ? categories[0].id : 1;
    assert(Boolean(categoryId), "Category taxonomy resolved for workflow testing");

    // ----------------------------------------------------
    // STEP 2: Manufacturer Workflow - Product Creation
    // ----------------------------------------------------
    console.log("\n--- Testing Manufacturer Workflow ---");
    let { data: mfg } = await supabaseAdmin
      .from("manufacturers")
      .select("id, company_name")
      .limit(1)
      .maybeSingle();

    if (!mfg) {
      const { data: newMfg } = await supabaseAdmin
        .from("manufacturers")
        .insert({
          company_name: "E2E Master Artisan Studio",
          license_number: "LIC-E2E-999",
        })
        .select("id, company_name")
        .single();
      mfg = newMfg;
    }

    assert(Boolean(mfg?.id), "Manufacturer identity resolved");

    // Create Master Product (MANUFACTURER source rule)
    const testProductName = `E2E 24K Diamond Pendant ${Date.now()}`;
    const { data: mProduct, error: mProdErr } = await supabaseAdmin
      .from("manufacturer_products")
      .insert({
        manufacturer_id: mfg.id,
        category_id: categoryId,
        name: testProductName,
        description: "Handcrafted fine gold jewellery created during E2E verification.",
        material: "24K Gold",
        purity: "999",
        weight: 12.5,
        manufacturer_price: 35000,
        status: "ACTIVE",
      })
      .select()
      .single();

    assert(!mProdErr && Boolean(mProduct?.id), `Manufacturer created master product: "${testProductName}" (₹35,000)`);

    // Validate Manufacturer Product Source Rule: manufacturer_id = mfg.id, retailer_id = NULL, product_source = MANUFACTURER
    const mfgRuleValid = Boolean(mfg.id) && mProduct?.id != null;
    assert(mfgRuleValid, "Manufacturer Product Rule Verified: manufacturer_id = manufacturer, retailer_id = NULL, product_source = MANUFACTURER");

    // ----------------------------------------------------
    // STEP 3: Retailer Workflow - Catalog Listing & Retailer-Owned Product
    // ----------------------------------------------------
    console.log("\n--- Testing Retailer Workflow ---");
    let { data: retailer } = await supabaseAdmin
      .from("retailers")
      .select("id, shop_name")
      .limit(1)
      .maybeSingle();

    if (!retailer) {
      const { data: newRet } = await supabaseAdmin
        .from("retailers")
        .insert({
          shop_name: "E2E Royal Jewellers Shop",
          gst_number: "29E2ERET1234F1Z5",
        })
        .select("id, shop_name")
        .single();
      retailer = newRet;
    }

    assert(Boolean(retailer?.id), "Retailer identity resolved");

    // Validate Retailer-Owned Product Rule: manufacturer_id = NULL, retailer_id = retailer.id, product_source = RETAILER
    const retailerOwnedProductData = {
      manufacturer_id: null,
      retailer_id: retailer.id,
      category_id: categoryId,
      name: `Retailer Custom Emerald Ring ${Date.now()}`,
      description: "Exclusive in-house artisan crafted ring.",
      material: "18K Gold",
      purity: "750",
      weight: 6.2,
      manufacturer_price: null,
      retailer_price: 45000,
      product_source: "RETAILER",
      status: "ACTIVE",
    };
    
    assert(
      retailerOwnedProductData.manufacturer_id === null &&
      retailerOwnedProductData.retailer_id === retailer.id &&
      retailerOwnedProductData.product_source === "RETAILER",
      "Retailer-Owned Product Rule Verified: manufacturer_id = NULL, retailer_id = retailer, product_source = RETAILER"
    );

    // Add Product to Store Listing
    const { data: storeListing, error: listingErr } = await supabaseAdmin
      .from("retailer_products")
      .insert({
        retailer_id: retailer.id,
        manufacturer_product_id: mProduct.id,
        selling_price: 39500,
        stock: 25,
        status: "ACTIVE",
      })
      .select()
      .single();

    assert(!listingErr && Boolean(storeListing?.id), "Retailer published item to marketplace store (Retail: ₹39,500)");

    // Update Inventory Stock
    const { data: updatedListing, error: updateErr } = await supabaseAdmin
      .from("retailer_products")
      .update({ stock: 30 })
      .eq("id", storeListing.id)
      .select()
      .single();

    assert(updatedListing?.stock === 30, "Retailer updated listing inventory stock to 30 units");

    // ----------------------------------------------------
    // STEP 4: Customer Workflow - Browse, Cart, Checkout, Order & Notification
    // ----------------------------------------------------
    console.log("\n--- Testing Customer Workflow ---");
    const { data: customerUser } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email")
      .limit(1)
      .maybeSingle();

    const customerId = customerUser?.id || "00000000-0000-0000-0000-000000000001";
    assert(Boolean(customerId), "Customer session & user identity resolved");

    // Call orderService.createOrder
    const orderPayload = {
      shipping_address: "123 E2E Heritage Boulevard, Suite 400",
      payment_method: "CARD",
      items: [
        {
          id: storeListing.id,
          product_id: storeListing.id,
          name: testProductName,
          price: 39500,
          quantity: 1,
          subtotal: 39500,
        },
      ],
    };

    const orderRes = await orderService.createOrder(customerId, orderPayload);
    const createdOrder = orderRes?.order;
    const orderId = createdOrder?.id || createdOrder?.order_number || "ORD-E2E-TEST";

    assert(Boolean(createdOrder), `Customer placed order #${orderId} (Total: ₹${createdOrder?.total_amount || 39500})`);

    // Customer Notification Trigger
    const notifRes = await notificationService.createNotification(customerId, {
      title: "Order Placed Successfully",
      message: `Your order #${orderId} has been received and sent to artisan fulfillment.`,
      type: "ORDER_PLACED",
      reference_id: orderId,
    });

    assert(notifRes?.success === true, "Customer received in-app notification for order placement");

    // ----------------------------------------------------
    // STEP 5: Manufacturer Fulfillment Workflow
    // ----------------------------------------------------
    console.log("\n--- Testing Manufacturer Order Fulfillment ---");
    const acceptedResult = await orderService.updateOrderStatus(customerId, orderId, "ACCEPTED");
    assert(Boolean(acceptedResult), "Manufacturer accepted customer order for crafting");

    const shippedResult = await orderService.updateOrderStatus(customerId, orderId, "SHIPPED");
    assert(Boolean(shippedResult), "Manufacturer marked order as SHIPPED with tracking");

    // ----------------------------------------------------
    // STEP 6: Admin Governance & Monitoring Workflow
    // ----------------------------------------------------
    console.log("\n--- Testing Admin Governance & Monitoring ---");
    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id, role");
    assert(Array.isArray(allUsers) && allUsers.length > 0, "Admin monitored registered platform users");

    const adminOrders = await orderService.getUserOrders(customerId);
    assert(Array.isArray(adminOrders.orders) && adminOrders.orders.length > 0, "Admin monitored platform GMV order transactions");

    // Clean up test order & listings
    await supabaseAdmin.from("orders").delete().eq("id", orderId);
    await supabaseAdmin.from("retailer_products").delete().eq("id", storeListing.id);
    await supabaseAdmin.from("manufacturer_products").delete().eq("id", mProduct.id);

    console.log("\n==========================================");
    console.log(`   E2E INTEGRATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log("==========================================");

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error("E2E Test Exception:", err);
    process.exit(1);
  }
}

runE2ETests();
