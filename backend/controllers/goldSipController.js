import { supabaseAdmin } from "../config/supabase.js";

// Helper to resolve or auto-create customer profile for logged-in user
async function resolveCustomerProfile(user) {
  let { data: customer } = await supabaseAdmin
    .from("customers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!customer) {
    const { data: newCust, error } = await supabaseAdmin
      .from("customers")
      .insert({
        user_id: user.id,
        address: "Registered Address",
      })
      .select()
      .single();

    if (error) throw new Error("Failed to create customer profile: " + error.message);
    customer = newCust;
  }

  return customer;
}

// Helper to fetch latest benchmark 24K gold rate
async function getLatestGoldPrice() {
  try {
    const { data: history } = await supabaseAdmin
      .from("gold_prices")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(15);

    if (history && history.length > 0) {
      const gRec = history.find((h) => h.purity === "24K" || !h.purity || h.purity !== "FINE_SILVER");
      if (gRec && Number(gRec.price_per_gram) > 0) {
        return Number(gRec.price_per_gram);
      }
    }
  } catch (_) {}

  // Fallback benchmark 24K gold rate per gram
  return 7245;
}

// =========================
// 1. CREATE NEW GOLD SIP
// =========================
export const createSip = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { amount, frequency = "MONTHLY", start_date } = req.body;

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "SIP investment amount must be greater than zero",
      });
    }

    const startDateObj = start_date ? new Date(start_date) : new Date();
    const nextPaymentObj = new Date(startDateObj);
    if (frequency.toUpperCase() === "MONTHLY") {
      nextPaymentObj.setMonth(nextPaymentObj.getMonth() + 1);
    } else {
      nextPaymentObj.setDate(nextPaymentObj.getDate() + 7);
    }

    const sipPayload = {
      customer_id: customer.id,
      amount: numAmount,
      frequency: frequency.toUpperCase(),
      start_date: startDateObj.toISOString().split("T")[0],
      next_payment_date: nextPaymentObj.toISOString().split("T")[0],
      status: "ACTIVE",
    };

    const { data: newSip, error } = await supabaseAdmin
      .from("gold_sips")
      .insert(sipPayload)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Auto-ensure customer gold wallet exists
    try {
      await supabaseAdmin.from("gold_wallets").insert({
        customer_id: customer.id,
        gold_balance: 0.0000,
      });
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: "Gold SIP plan created successfully",
      data: newSip,
    });
  } catch (err) {
    console.error("Error in createSip:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// 2. GET CUSTOMER SIPS
// =========================
export const getCustomerSips = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);

    const { data: sips, error } = await supabaseAdmin
      .from("gold_sips")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("Notice in getCustomerSips:", error.message);
      return res.status(200).json({
        success: true,
        data: [],
        sips: [],
        message: "Please run SQL schema script in Supabase SQL Editor to enable Gold SIP tables.",
      });
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Fetch all successful transactions for this customer's SIPs to check paid status for current month
    const { data: allTxs } = await supabaseAdmin
      .from("gold_sip_transactions")
      .select("sip_id, created_at, transaction_date")
      .eq("customer_id", customer.id)
      .eq("payment_status", "SUCCESS");

    const formattedSips = (sips || []).map((sip) => {
      const sipTxs = (allTxs || []).filter((tx) => tx.sip_id === sip.id);
      const paidThisMonth = sipTxs.some((tx) => {
        const txDate = new Date(tx.transaction_date || tx.created_at);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      });

      return {
        ...sip,
        is_paid_this_month: paidThisMonth,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedSips,
      sips: formattedSips,
    });
  } catch (err) {
    console.error("Error in getCustomerSips:", err);
    return res.status(200).json({
      success: true,
      data: [],
      sips: [],
    });
  }
};

// =========================
// 3. GET SINGLE SIP DETAILS WITH TRANSACTIONS
// =========================
export const getSipById = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;

    // Check if SIP exists in database first
    const { data: rawSip } = await supabaseAdmin
      .from("gold_sips")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (rawSip && rawSip.customer_id !== customer.id) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You are not authorized to access another customer's gold SIP record",
      });
    }

    const { data: sip } = await supabaseAdmin
      .from("gold_sips")
      .select("*")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (!sip) {
      return res.status(404).json({
        success: false,
        message: "Gold SIP plan not found",
      });
    }

    const { data: transactions } = await supabaseAdmin
      .from("gold_sip_transactions")
      .select("*")
      .eq("sip_id", id)
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    return res.status(200).json({
      success: true,
      data: {
        ...sip,
        transactions: transactions || [],
      },
    });
  } catch (err) {
    console.error("Error in getSipById:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// 4. UPDATE SIP STATUS (ACTIVE / PAUSED / CANCELLED)
// =========================
export const updateSipStatus = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required (ACTIVE, PAUSED, CANCELLED)",
      });
    }

    const upperStatus = status.toUpperCase();
    const validStatuses = ["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"];
    if (!validStatuses.includes(upperStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${validStatuses.join(", ")}`,
      });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("gold_sips")
      .update({
        status: upperStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `SIP plan status updated to ${upperStatus} successfully`,
      data: updated,
    });
  } catch (err) {
    console.error("Error in updateSipStatus:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// 5. PROCESS SIP PAYMENT (Convert Money -> Gold Grams)
// =========================
export const processSipPayment = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;

    // Fetch SIP plan
    const { data: sip, error: sipErr } = await supabaseAdmin
      .from("gold_sips")
      .select("*")
      .eq("id", id)
      .eq("customer_id", customer.id)
      .maybeSingle();

    if (!sip) {
      return res.status(404).json({
        success: false,
        message: "Gold SIP plan not found",
      });
    }

    if (sip.status !== "ACTIVE") {
      return res.status(400).json({
        success: false,
        message: `Cannot process payment for SIP with status ${sip.status}. Please activate the plan first.`,
      });
    }

    // Check Rule: Only 1 Pay Installment per month allowed
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const { data: recentTxs } = await supabaseAdmin
      .from("gold_sip_transactions")
      .select("created_at, transaction_date")
      .eq("sip_id", sip.id)
      .eq("payment_status", "SUCCESS")
      .order("created_at", { ascending: false })
      .limit(1);

    if (recentTxs && recentTxs.length > 0) {
      const lastTxDate = new Date(recentTxs[0].transaction_date || recentTxs[0].created_at);
      if (lastTxDate.getMonth() === currentMonth && lastTxDate.getFullYear() === currentYear) {
        const monthName = now.toLocaleString("default", { month: "long" });
        return res.status(400).json({
          success: false,
          message: `SIP installment for ${monthName} ${currentYear} has already been paid. Next payment is due on ${sip.next_payment_date}.`,
        });
      }
    }

    // 1. Fetch benchmark gold price per gram
    const currentGoldRate = await getLatestGoldPrice();

    // 2. Convert money to gold grams: gold_quantity = amount / price_per_gram
    const moneyInvested = Number(sip.amount);
    const goldGramsAcquired = Number((moneyInvested / currentGoldRate).toFixed(4));

    // 3. Record installment in gold_sip_transactions
    const { data: sipTx, error: txErr } = await supabaseAdmin
      .from("gold_sip_transactions")
      .insert({
        sip_id: sip.id,
        customer_id: customer.id,
        amount: moneyInvested,
        gold_price_per_gram: currentGoldRate,
        gold_quantity: goldGramsAcquired,
        payment_status: "SUCCESS",
        transaction_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (txErr) {
      return res.status(400).json({
        success: false,
        message: "Failed to record SIP transaction: " + txErr.message,
      });
    }

    // 4. Update customer gold wallet balance
    let { data: wallet } = await supabaseAdmin
      .from("gold_wallets")
      .select("*")
      .eq("customer_id", customer.id)
      .maybeSingle();

    const currentBalance = Number(wallet?.gold_balance || 0);
    const newBalance = Number((currentBalance + goldGramsAcquired).toFixed(4));

    if (wallet) {
      await supabaseAdmin
        .from("gold_wallets")
        .update({
          gold_balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", wallet.id);
    } else {
      const { data: newW } = await supabaseAdmin
        .from("gold_wallets")
        .insert({
          customer_id: customer.id,
          gold_balance: newBalance,
        })
        .select()
        .single();
      wallet = newW;
    }

    // 5. Insert double-entry audit log into gold_transactions (if table exists)
    try {
      await supabaseAdmin.from("gold_transactions").insert({
        customer_id: customer.id,
        transaction_type: "SIP_PURCHASE",
        reference_id: sipTx.id,
        gold_quantity: goldGramsAcquired,
        gold_price_per_gram: currentGoldRate,
        description: `Monthly SIP payment conversion (₹${moneyInvested.toLocaleString("en-IN")} @ ₹${currentGoldRate.toLocaleString("en-IN")}/g)`,
      });
    } catch (gErr) {
      console.warn("Notice inserting into gold_transactions:", gErr.message);
    }

    // 6. Advance next payment date (+1 month)
    const curNextDate = new Date(sip.next_payment_date || new Date());
    curNextDate.setMonth(curNextDate.getMonth() + 1);

    await supabaseAdmin
      .from("gold_sips")
      .update({
        next_payment_date: curNextDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", sip.id);

    return res.status(200).json({
      success: true,
      message: `SIP Payment of ₹${moneyInvested.toLocaleString("en-IN")} processed! Acquired ${goldGramsAcquired}g 24K gold.`,
      data: {
        transaction: sipTx,
        gold_acquired: goldGramsAcquired,
        gold_price_per_gram: currentGoldRate,
        new_gold_balance: newBalance,
      },
    });
  } catch (err) {
    console.error("Error in processSipPayment:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

function getCustomerIds(customer, user) {
  const ids = new Set();
  if (customer?.id) ids.add(customer.id);
  if (customer?.user_id) ids.add(customer.user_id);
  if (user?.id) ids.add(user.id);
  if (user?.auth_user_id) ids.add(user.auth_user_id);
  return Array.from(ids);
}

// =========================
// 6. GET CUSTOMER GOLD WALLET & AUDIT LEDGER
// =========================
export const getGoldWallet = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const custIds = getCustomerIds(customer, req.user);

    // Fetch wallet
    let { data: wallet } = await supabaseAdmin
      .from("gold_wallets")
      .select("*")
      .in("customer_id", custIds)
      .maybeSingle();

    if (!wallet) {
      const { data: newW } = await supabaseAdmin
        .from("gold_wallets")
        .insert({
          customer_id: customer.id,
          gold_balance: 0.0000,
        })
        .select()
        .single();
      wallet = newW;
    }

    // Fetch customer's SIP IDs
    const { data: sips } = await supabaseAdmin
      .from("gold_sips")
      .select("id")
      .in("customer_id", custIds);

    const sipIds = (sips || []).map((s) => s.id);

    // Fetch auditable transactions from gold_transactions
    let transactionsList = [];
    const { data: gTxs } = await supabaseAdmin
      .from("gold_transactions")
      .select("*")
      .in("customer_id", custIds)
      .order("created_at", { ascending: false });

    // Also fetch from gold_sip_transactions to ensure 100% ledger coverage
    let sipTxsQuery = supabaseAdmin
      .from("gold_sip_transactions")
      .select("*");

    if (sipIds.length > 0) {
      sipTxsQuery = sipTxsQuery.or(`customer_id.in.(${custIds.join(",")}),sip_id.in.(${sipIds.join(",")})`);
    } else {
      sipTxsQuery = sipTxsQuery.in("customer_id", custIds);
    }

    const { data: sipTxs } = await sipTxsQuery.order("created_at", { ascending: false });

    const txMap = new Map();
    (gTxs || []).forEach((t) => txMap.set(t.id, t));

    (sipTxs || []).forEach((stx) => {
      const existsInGTxs = (gTxs || []).some((t) => t.reference_id === stx.id || t.reference_id === stx.sip_id);
      if (!existsInGTxs) {
        txMap.set(stx.id, {
          id: stx.id,
          customer_id: stx.customer_id,
          transaction_type: "SIP_PURCHASE",
          reference_id: stx.sip_id,
          gold_quantity: Number(stx.gold_quantity),
          gold_price_per_gram: Number(stx.gold_price_per_gram),
          description: `Monthly SIP payment conversion (₹${Number(stx.amount).toLocaleString("en-IN")} @ ₹${Number(stx.gold_price_per_gram).toLocaleString("en-IN")}/g)`,
          created_at: stx.transaction_date || stx.created_at,
        });
      }
    });

    transactionsList = Array.from(txMap.values()).sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    // Fetch current benchmark gold price
    const currentGoldRate = await getLatestGoldPrice();

    // Recalculate gold balance if wallet is 0 but transactions exist
    let goldBalance = Number(wallet?.gold_balance || 0);
    if (goldBalance === 0 && transactionsList.length > 0) {
      goldBalance = transactionsList.reduce((sum, t) => sum + Number(t.gold_quantity || 0), 0);
      goldBalance = Number(goldBalance.toFixed(4));
    }

    const totalValuation = Math.round(goldBalance * currentGoldRate);
    const totalInvested = (sipTxs || []).reduce((sum, t) => sum + Number(t.amount || 0), 0);

    return res.status(200).json({
      success: true,
      data: {
        customer_id: customer.id,
        gold_balance: goldBalance,
        current_gold_price: currentGoldRate,
        total_valuation: totalValuation,
        total_money_invested: totalInvested,
        transactions: transactionsList,
      },
    });
  } catch (err) {
    console.error("Error in getGoldWallet:", err);
    return res.status(200).json({
      success: true,
      data: {
        customer_id: null,
        gold_balance: 0,
        current_gold_price: 7245,
        total_valuation: 0,
        total_money_invested: 0,
        transactions: [],
      },
    });
  }
};

// =========================
// 7. REDEEM GOLD BALANCE (Purchase Jewellery)
// =========================
export const redeemGoldBalance = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { gold_quantity, order_id, description } = req.body;

    const redeemGrams = Number(gold_quantity);
    if (!redeemGrams || redeemGrams <= 0) {
      return res.status(400).json({
        success: false,
        message: "Gold quantity to redeem must be greater than zero",
      });
    }

    const { data: wallet } = await supabaseAdmin
      .from("gold_wallets")
      .select("*")
      .eq("customer_id", customer.id)
      .maybeSingle();

    const currentBalance = Number(wallet?.gold_balance || 0);
    if (currentBalance < redeemGrams) {
      return res.status(400).json({
        success: false,
        message: `Insufficient gold balance. Available: ${currentBalance}g, Requested: ${redeemGrams}g`,
      });
    }

    const newBalance = Number((currentBalance - redeemGrams).toFixed(4));
    const currentGoldRate = await getLatestGoldPrice();

    // Update wallet
    await supabaseAdmin
      .from("gold_wallets")
      .update({
        gold_balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", wallet.id);

    // Record audit ledger entry
    const { data: tx } = await supabaseAdmin
      .from("gold_transactions")
      .insert({
        customer_id: customer.id,
        transaction_type: "GOLD_REDEMPTION",
        reference_id: order_id || null,
        gold_quantity: -redeemGrams,
        gold_price_per_gram: currentGoldRate,
        description: description || `Redeemed ${redeemGrams}g gold balance for jewellery purchase`,
      })
      .select()
      .single();

    return res.status(200).json({
      success: true,
      message: `Successfully redeemed ${redeemGrams}g gold balance!`,
      data: {
        redeemed_grams: redeemGrams,
        new_gold_balance: newBalance,
        transaction: tx,
      },
    });
  } catch (err) {
    console.error("Error in redeemGoldBalance:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// 8. GET BENCHMARK GOLD PRICES / SINGLE PRICE
// =========================
export const getGoldPrices = async (req, res) => {
  try {
    const { data: prices, error } = await supabaseAdmin
      .from("gold_prices")
      .select("*")
      .order("effective_from", { ascending: false })
      .limit(30);

    const currentRate = await getLatestGoldPrice();

    return res.status(200).json({
      success: true,
      price_per_gram: currentRate,
      purity: "24K",
      currency: "INR",
      data: {
        price_per_gram: currentRate,
        current_price_per_gram: currentRate,
        history: prices || [],
      },
    });
  } catch (err) {
    console.error("Error in getGoldPrices:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// 9. PAUSE SIP (PATCH /:id/pause)
// =========================
export const pauseSip = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;

    const { data: updated, error } = await supabaseAdmin
      .from("gold_sips")
      .update({ status: "PAUSED", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Gold SIP plan paused successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 10. RESUME SIP (PATCH /:id/resume)
// =========================
export const resumeSip = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;

    const { data: updated, error } = await supabaseAdmin
      .from("gold_sips")
      .update({ status: "ACTIVE", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Gold SIP plan resumed successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 11. CANCEL SIP (DELETE /:id)
// =========================
export const cancelSip = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;

    const { data: updated, error } = await supabaseAdmin
      .from("gold_sips")
      .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Gold SIP plan cancelled successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 12. UPDATE SIP (PUT /:id)
// =========================
export const updateSip = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;
    const { amount, frequency, status } = req.body;

    const updateFields = { updated_at: new Date().toISOString() };
    if (amount != null && Number(amount) > 0) updateFields.amount = Number(amount);
    if (frequency) updateFields.frequency = frequency.toUpperCase();
    if (status) updateFields.status = status.toUpperCase();

    const { data: updated, error } = await supabaseAdmin
      .from("gold_sips")
      .update(updateFields)
      .eq("id", id)
      .eq("customer_id", customer.id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Gold SIP plan updated successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 13. GET SIP TRANSACTIONS (/api/customer/gold-sip/transactions)
// =========================
export const getAllSipTransactions = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);

    const { data: txs, error } = await supabaseAdmin
      .from("gold_sip_transactions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({
      success: true,
      data: txs || [],
      transactions: txs || [],
    });
  } catch (err) {
    return res.status(200).json({ success: true, data: [] });
  }
};

// =========================
// 14. GET GOLD TRANSACTIONS LEDGER (/api/customer/gold-transactions)
// =========================
export const getGoldTransactionsLedger = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);

    const { data: ledger, error } = await supabaseAdmin
      .from("gold_transactions")
      .select("*")
      .eq("customer_id", customer.id)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }

    return res.status(200).json({
      success: true,
      data: ledger || [],
      transactions: ledger || [],
    });
  } catch (err) {
    return res.status(200).json({ success: true, data: [] });
  }
};

// =========================
// 15. DELETE SIP RECORD (DELETE /:id)
// =========================
export const deleteSip = async (req, res) => {
  try {
    const customer = await resolveCustomerProfile(req.user);
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("gold_sips")
      .delete()
      .eq("id", id)
      .eq("customer_id", customer.id);

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "Gold Scheme plan deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMES_DATA_FILE = path.join(__dirname, "../data/retailer_gold_schemes.json");

function loadFallbackSchemes() {
  try {
    if (fs.existsSync(SCHEMES_DATA_FILE)) {
      const content = fs.readFileSync(SCHEMES_DATA_FILE, "utf-8");
      return JSON.parse(content || "[]");
    }
  } catch (_) {}
  return [];
}

function saveFallbackSchemes(schemes) {
  try {
    const dir = path.dirname(SCHEMES_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SCHEMES_DATA_FILE, JSON.stringify(schemes, null, 2), "utf-8");
  } catch (_) {}
}

// =========================
// HELPER: RESOLVE RETAILER PROFILE FOR LOGGED IN USER
// =========================
async function resolveRetailerProfile(user) {
  let { data: retailer } = await supabaseAdmin
    .from("retailers")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!retailer) {
    const { data: newRet, error } = await supabaseAdmin
      .from("retailers")
      .insert({
        user_id: user.id,
        shop_name: user.full_name ? `${user.full_name}'s Jewellery` : "Store Retailer",
        status: "ACTIVE",
        is_verified: true,
      })
      .select()
      .single();

    if (error) throw new Error("Failed to resolve retailer profile: " + error.message);
    retailer = newRet;
  }

  return retailer;
}

// =========================
// 16. CREATE RETAILER GOLD SCHEME (Retailer fixes rate, weight & tenure)
// =========================
export const createRetailerScheme = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const {
      title,
      description,
      fixed_gold_rate,
      monthly_amount,
      target_gold_grams,
      time_period_months,
      frequency = "MONTHLY",
      bonus_description,
      status = "ACTIVE",
    } = req.body;

    if (!title || !monthly_amount) {
      return res.status(400).json({
        success: false,
        message: "Scheme title and monthly amount are required.",
      });
    }

    const numAmount = Number(monthly_amount);
    const numRate = fixed_gold_rate ? Number(fixed_gold_rate) : 7245;
    const numMonths = time_period_months ? Number(time_period_months) : 11;
    const numGrams = target_gold_grams ? Number(target_gold_grams) : Number((numAmount / numRate * numMonths).toFixed(4));

    const schemePayload = {
      retailer_id: retailer.id,
      title,
      description: description || `Save ₹${numAmount.toLocaleString("en-IN")}/month for ${numMonths} months. Fixed Rate: ₹${numRate.toLocaleString("en-IN")}/g`,
      fixed_gold_rate: numRate,
      monthly_amount: numAmount,
      target_gold_grams: numGrams,
      time_period_months: numMonths,
      frequency: frequency.toUpperCase(),
      bonus_description: bonus_description || "Retailer Scheme Benefit at Maturity",
      status: status.toUpperCase(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: newScheme, error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .insert(schemePayload)
      .select()
      .single();

    if (error) {
      console.warn("Notice inserting into retailer_gold_schemes DB:", error.message);
      const fallbackScheme = {
        id: `scheme-${Date.now()}`,
        ...schemePayload,
        retailer_name: retailer.shop_name || retailer.company_name || "Store Retailer",
      };
      const list = loadFallbackSchemes();
      list.unshift(fallbackScheme);
      saveFallbackSchemes(list);

      return res.status(201).json({
        success: true,
        message: `Gold Scheme "${title}" created successfully! Rate locked at ₹${numRate}/g for ${numMonths} months.`,
        data: fallbackScheme,
        scheme: fallbackScheme,
      });
    }

    // Also sync to local fallback JSON
    try {
      const list = loadFallbackSchemes();
      list.unshift(newScheme);
      saveFallbackSchemes(list);
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: `Gold Scheme "${title}" created successfully! Rate locked at ₹${numRate}/g for ${numMonths} months.`,
      data: newScheme,
      scheme: newScheme,
    });
  } catch (err) {
    console.error("Error in createRetailerScheme:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 17. GET RETAILER GOLD SCHEMES (Retailer Store Management)
// =========================
export const getRetailerSchemes = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);

    const { data: schemes, error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .select("*")
      .eq("retailer_id", retailer.id)
      .order("created_at", { ascending: false });

    let schemeList = schemes && schemes.length > 0 ? schemes : [];
    if (error || schemeList.length === 0) {
      const allFallback = loadFallbackSchemes();
      const retFallback = allFallback.filter((s) => s.retailer_id === retailer.id || s.retailer_id === "default-retailer");
      schemeList = retFallback.length > 0 ? retFallback : allFallback;
    }

    // Calculate enrolled customer counts for each scheme
    const { data: enrollments } = await supabaseAdmin
      .from("gold_sips")
      .select("id, scheme_id, status")
      .eq("retailer_id", retailer.id);

    const countMap = new Map();
    (enrollments || []).forEach((e) => {
      if (e.scheme_id) {
        countMap.set(e.scheme_id, (countMap.get(e.scheme_id) || 0) + 1);
      }
    });

    const formatted = schemeList.map((s) => ({
      ...s,
      enrolled_customers: countMap.get(s.id) || 0,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      schemes: formatted,
    });
  } catch (err) {
    console.error("Error in getRetailerSchemes:", err);
    const allFallback = loadFallbackSchemes();
    return res.status(200).json({ success: true, data: allFallback, schemes: allFallback });
  }
};

// =========================
// 18. UPDATE RETAILER GOLD SCHEME
// =========================
export const updateRetailerScheme = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const { id } = req.params;

    const {
      title,
      description,
      fixed_gold_rate,
      monthly_amount,
      target_gold_grams,
      time_period_months,
      status,
      bonus_description,
    } = req.body;

    const payload = { updated_at: new Date().toISOString() };
    if (title) payload.title = title;
    if (description) payload.description = description;
    if (fixed_gold_rate != null) payload.fixed_gold_rate = Number(fixed_gold_rate);
    if (monthly_amount != null) payload.monthly_amount = Number(monthly_amount);
    if (target_gold_grams != null) payload.target_gold_grams = Number(target_gold_grams);
    if (time_period_months != null) payload.time_period_months = Number(time_period_months);
    if (status) payload.status = status.toUpperCase();
    if (bonus_description) payload.bonus_description = bonus_description;

    const { data: updated, error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .update(payload)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error || !updated) {
      const list = loadFallbackSchemes();
      const idx = list.findIndex((s) => s.id === id);
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...payload };
        saveFallbackSchemes(list);
        return res.status(200).json({
          success: true,
          message: "Gold Scheme updated successfully",
          data: list[idx],
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Gold Scheme updated successfully",
      data: updated,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 19. DELETE / DEACTIVATE RETAILER GOLD SCHEME
// =========================
export const deleteRetailerScheme = async (req, res) => {
  try {
    const retailer = await resolveRetailerProfile(req.user);
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .delete()
      .eq("id", id);

    const list = loadFallbackSchemes();
    const updatedList = list.filter((s) => s.id !== id);
    saveFallbackSchemes(updatedList);

    return res.status(200).json({
      success: true,
      message: "Gold Scheme removed successfully",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 20. GET AVAILABLE GOLD SCHEMES FOR CUSTOMERS (Browse Store Schemes)
// =========================
export const getAvailableSchemesForCustomers = async (req, res) => {
  try {
    const { data: schemes, error } = await supabaseAdmin
      .from("retailer_gold_schemes")
      .select("*")
      .eq("status", "ACTIVE")
      .order("created_at", { ascending: false });

    let schemeList = schemes && schemes.length > 0 ? schemes : [];
    if (error || schemeList.length === 0) {
      schemeList = loadFallbackSchemes().filter((s) => s.status === "ACTIVE");
    }

    const retIds = schemeList.map((s) => s.retailer_id).filter(Boolean);
    let retMap = new Map();
    if (retIds.length > 0) {
      const { data: retailers } = await supabaseAdmin.from("retailers").select("id, shop_name, company_name, phone, address").in("id", retIds);
      (retailers || []).forEach((r) => retMap.set(r.id, r));
    }

    const formatted = schemeList.map((s) => {
      const ret = retMap.get(s.retailer_id) || {};
      return {
        ...s,
        retailer_name: s.retailer_name || ret.shop_name || ret.company_name || "Aura Partner Retailer",
        retailer_phone: ret.phone || "N/A",
        retailer_address: ret.address || "Verified Store Address",
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      schemes: formatted,
    });
  } catch (err) {
    const fallback = loadFallbackSchemes().filter((s) => s.status === "ACTIVE");
    return res.status(200).json({ success: true, data: fallback, schemes: fallback });
  }
};


