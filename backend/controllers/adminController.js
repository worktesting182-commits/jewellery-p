import { supabaseAdmin } from "../config/supabase.js";
import { invalidateBenchmarkRateCache } from "../utils/pricingEngine.js";

// =========================
// GET ADMIN DASHBOARD STATS
// =========================
export const getDashboardStats = async (req, res) => {
  try {
    // 1. Fetch Users stats
    const { data: users } = await supabaseAdmin
      .from("users")
      .select("id, role, created_at, is_active, status");

    const userList = users || [];
    const totalUsers = userList.length;
    const customersCount = userList.filter((u) => u.role === "CUSTOMER").length;
    const manufacturersCount = userList.filter((u) => u.role === "MANUFACTURER").length;
    const retailersCount = userList.filter((u) => u.role === "RETAILER").length;
    const adminsCount = userList.filter((u) => u.role === "ADMIN").length;

    // Users by Role chart data
    const usersByRole = [
      { name: "Customers", role: "CUSTOMER", count: customersCount, value: customersCount, percentage: totalUsers ? Math.round((customersCount / totalUsers) * 100) : 0, color: "#8EB69B" },
      { name: "Manufacturers", role: "MANUFACTURER", count: manufacturersCount, value: manufacturersCount, percentage: totalUsers ? Math.round((manufacturersCount / totalUsers) * 100) : 0, color: "#235347" },
      { name: "Retailers", role: "RETAILER", count: retailersCount, value: retailersCount, percentage: totalUsers ? Math.round((retailersCount / totalUsers) * 100) : 0, color: "#DAF1DE" },
      { name: "Admins", role: "ADMIN", count: adminsCount, value: adminsCount, percentage: totalUsers ? Math.round((adminsCount / totalUsers) * 100) : 0, color: "#163832" },
    ];

    // 2. Fetch Manufacturer Products count & Category breakdown
    const { data: mProds } = await supabaseAdmin
      .from("manufacturer_products")
      .select("id, category_id, created_at");

    const totalManufacturerProducts = (mProds || []).length;

    // Fetch Categories
    const { data: categories } = await supabaseAdmin.from("categories").select("id, name");
    const categoryMap = new Map();
    (categories || []).forEach((c) => categoryMap.set(c.id, c.name));

    // Products by Category chart data
    const catCounts = new Map();
    (mProds || []).forEach((p) => {
      const catName = categoryMap.get(p.category_id) || "General Jewellery";
      catCounts.set(catName, (catCounts.get(catName) || 0) + 1);
    });

    const productsByCategory = Array.from(catCounts.entries()).map(([category, count]) => ({
      category,
      name: category,
      count,
      value: count,
    }));

    // 3. Fetch Retailer Listings count
    const { data: rProds } = await supabaseAdmin
      .from("retailer_products")
      .select("id, status");

    const totalRetailerListings = (rProds || []).length;

    // 4. Fetch Orders stats & Revenue & Monthly trends
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, order_status, created_at");

    const orderList = orders || [];
    const totalOrders = orderList.length;
    const totalRevenue = orderList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Orders per Month chart data
    const monthCounts = new Map();
    const monthsOrder = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    monthsOrder.forEach((m) => monthCounts.set(m, { month: m, orders: 0, revenue: 0 }));

    orderList.forEach((o) => {
      const date = new Date(o.created_at || Date.now());
      const mName = date.toLocaleString("en-IN", { month: "short" });
      if (monthCounts.has(mName)) {
        const current = monthCounts.get(mName);
        current.orders += 1;
        current.revenue += Number(o.total_amount || 0);
        monthCounts.set(mName, current);
      }
    });

    const ordersPerMonth = Array.from(monthCounts.values());

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        customers: customersCount,
        manufacturers: manufacturersCount,
        retailers: retailersCount,
        admins: adminsCount,
        manufacturerProducts: totalManufacturerProducts,
        retailerListings: totalRetailerListings,
        orders: totalOrders,
        revenue: totalRevenue,
        charts: {
          usersByRole,
          ordersPerMonth,
          productsByCategory,
        },
      },
      stats: {
        totalUsers,
        customers: customersCount,
        manufacturers: manufacturersCount,
        retailers: retailersCount,
        admins: adminsCount,
        manufacturerProducts: totalManufacturerProducts,
        retailerListings: totalRetailerListings,
        orders: totalOrders,
        revenue: totalRevenue,
      },
    });
  } catch (err) {
    console.error("Error in getDashboardStats:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// =========================
// GET ALL USERS (Admin User Management)
// =========================
export const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let query = supabaseAdmin
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (role && role !== "ALL") {
      query = query.eq("role", role.toUpperCase());
    }

    if (status && status !== "ALL") {
      const sUpper = status.toUpperCase();
      if (sUpper === "ACTIVE") {
        query = query.or("status.eq.ACTIVE,is_active.eq.true");
      } else if (sUpper === "INACTIVE") {
        query = query.or("status.eq.INACTIVE,is_active.eq.false");
      } else if (sUpper === "BLOCKED") {
        query = query.or("status.eq.BLOCKED,status.eq.SUSPENDED");
      }
    }

    const { data: users, error } = await query;

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    let filtered = users || [];

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q) ||
          u.role?.toLowerCase().includes(q)
      );
    }

    const formatted = filtered.map((u) => {
      let userStatus = (u.status || (u.is_active === false ? "INACTIVE" : "ACTIVE")).toUpperCase();
      if (u.status === "SUSPENDED" || u.status === "BLOCKED") {
        userStatus = "BLOCKED";
      }

      return {
        id: u.id,
        auth_user_id: u.auth_user_id,
        name: u.full_name || u.email?.split("@")[0] || "Platform User",
        full_name: u.full_name || u.email?.split("@")[0] || "Platform User",
        email: u.email,
        phone: u.phone || "N/A",
        role: u.role || "CUSTOMER",
        status: userStatus,
        is_active: u.is_active !== false && userStatus !== "BLOCKED" && userStatus !== "INACTIVE",
        created_at: u.created_at || new Date().toISOString(),
        registration_date: u.created_at || new Date().toISOString(),
      };
    });

    return res.status(200).json({
      success: true,
      data: formatted,
      users: formatted,
    });
  } catch (err) {
    console.error("Error in getAllUsers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE USER (Admin) - Password editing strictly disallowed
// =========================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, role, status } = req.body;

    // Constraint: Admin cannot edit passwords
    if (req.body.password || req.body.password_hash) {
      return res.status(400).json({
        success: false,
        message: "Admin is not permitted to edit or reset user passwords.",
      });
    }

    const updatePayload = {
      updated_at: new Date().toISOString(),
    };

    if (full_name !== undefined) updatePayload.full_name = full_name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (role !== undefined) updatePayload.role = role.toUpperCase();
    if (status !== undefined) {
      const formattedStatus = status.toUpperCase();
      updatePayload.status = formattedStatus;
      updatePayload.is_active = formattedStatus === "ACTIVE";
    }

    const { data: updated, error } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: updated,
      user: updated,
    });
  } catch (err) {
    console.error("Error in updateUser:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE USER STATUS (Activate / Deactivate / Block)
// =========================
export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["ACTIVE", "INACTIVE", "BLOCKED"];
    const formattedStatus = (status || "").toUpperCase();

    if (!allowed.includes(formattedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed: ACTIVE, INACTIVE, BLOCKED`,
      });
    }

    const updatePayload = {
      status: formattedStatus,
      is_active: formattedStatus === "ACTIVE",
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabaseAdmin
      .from("users")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `User status set to ${formattedStatus}`,
      data: updated,
      user: updated,
    });
  } catch (err) {
    console.error("Error in updateUserStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// GET ALL MANUFACTURERS (Admin Manufacturer Management)
// =========================
export const getAllManufacturers = async (req, res) => {
  try {
    const { status, search } = req.query;

    const { data: mfgs, error } = await supabaseAdmin
      .from("manufacturers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Fetch users for owner details
    const userIds = (mfgs || []).map((m) => m.user_id).filter(Boolean);
    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, phone, is_active, status")
        .in("id", userIds);
      (users || []).forEach((u) => userMap.set(u.id, u));
    }

    // Fetch product counts per manufacturer
    const { data: mProds } = await supabaseAdmin
      .from("manufacturer_products")
      .select("id, manufacturer_id");

    const prodCountMap = new Map();
    (mProds || []).forEach((p) => {
      prodCountMap.set(p.manufacturer_id, (prodCountMap.get(p.manufacturer_id) || 0) + 1);
    });

    let formatted = (mfgs || []).map((m) => {
      const u = userMap.get(m.user_id) || {};
      const companyName = m.company_name || m.shop_name || "Artisan Manufacturing Enterprise";
      const ownerName = u.full_name || m.owner_name || u.email?.split("@")[0] || "Master Artisan Owner";
      const regNumber = m.gst_number || m.registration_number || m.license_number || `REG-${m.id?.slice(0, 8).toUpperCase()}`;
      const prodCount = prodCountMap.get(m.id) || 0;

      let mfgStatus = (m.status || (m.is_verified === false ? "SUSPENDED" : "ACTIVE")).toUpperCase();
      if (m.status === "BLOCKED" || m.status === "SUSPENDED") {
        mfgStatus = "SUSPENDED";
      }

      return {
        id: m.id,
        user_id: m.user_id,
        company_name: companyName,
        name: companyName,
        owner: ownerName,
        owner_name: ownerName,
        email: u.email || "",
        phone: m.phone || u.phone || "N/A",
        registration_number: regNumber,
        gst_number: regNumber,
        products: prodCount,
        products_count: prodCount,
        status: mfgStatus,
        is_verified: m.is_verified !== false && mfgStatus !== "SUSPENDED",
        address: m.address || "Artisan Workshop Address Registered",
        description: m.description || "Fine handcrafted eco jewellery manufacturer.",
        created_at: m.created_at || new Date().toISOString(),
      };
    });

    if (status && status !== "ALL") {
      formatted = formatted.filter((m) => m.status === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (m) =>
          m.company_name?.toLowerCase().includes(q) ||
          m.owner?.toLowerCase().includes(q) ||
          m.registration_number?.toLowerCase().includes(q) ||
          m.email?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      manufacturers: formatted,
    });
  } catch (err) {
    console.error("Error in getAllManufacturers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE MANUFACTURER STATUS (Activate / Suspend)
// =========================
export const updateManufacturerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["ACTIVE", "SUSPENDED", "INACTIVE"];
    const formattedStatus = (status || "").toUpperCase();

    if (!allowed.includes(formattedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed: ACTIVE, SUSPENDED, INACTIVE`,
      });
    }

    const isVerified = formattedStatus === "ACTIVE";

    // Update manufacturers table
    const { data: updatedMfg, error: mfgErr } = await supabaseAdmin
      .from("manufacturers")
      .update({
        status: formattedStatus,
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (mfgErr) {
      return res.status(400).json({ success: false, message: mfgErr.message });
    }

    // Sync status with linked users record if present
    if (updatedMfg?.user_id) {
      await supabaseAdmin
        .from("users")
        .update({
          status: formattedStatus === "ACTIVE" ? "ACTIVE" : "BLOCKED",
          is_active: formattedStatus === "ACTIVE",
        })
        .eq("id", updatedMfg.user_id);
    }

    return res.status(200).json({
      success: true,
      message: `Manufacturer status updated to ${formattedStatus}`,
      data: updatedMfg,
      manufacturer: updatedMfg,
    });
  } catch (err) {
    console.error("Error in updateManufacturerStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// GET ALL RETAILERS (Admin Retailer Management)
// =========================
export const getAllRetailers = async (req, res) => {
  try {
    const { status, search } = req.query;

    const { data: retailers, error } = await supabaseAdmin
      .from("retailers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Fetch users for owner details
    const userIds = (retailers || []).map((r) => r.user_id).filter(Boolean);
    let userMap = new Map();
    if (userIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, phone, is_active, status")
        .in("id", userIds);
      (users || []).forEach((u) => userMap.set(u.id, u));
    }

    // Fetch listings counts per retailer
    const { data: rProds } = await supabaseAdmin
      .from("retailer_products")
      .select("id, retailer_id");

    const listingsCountMap = new Map();
    (rProds || []).forEach((p) => {
      listingsCountMap.set(p.retailer_id, (listingsCountMap.get(p.retailer_id) || 0) + 1);
    });

    let formatted = (retailers || []).map((r) => {
      const u = userMap.get(r.user_id) || {};
      const shopName = r.shop_name || r.company_name || "Aura Partner Retailer";
      const ownerName = u.full_name || r.owner_name || u.email?.split("@")[0] || "Retail Store Owner";
      const listingsCount = listingsCountMap.get(r.id) || 0;

      let retStatus = (r.status || (r.is_verified === false ? "SUSPENDED" : "ACTIVE")).toUpperCase();
      if (r.status === "BLOCKED" || r.status === "SUSPENDED") {
        retStatus = "SUSPENDED";
      }

      return {
        id: r.id,
        user_id: r.user_id,
        shop_name: shopName,
        name: shopName,
        company_name: shopName,
        owner: ownerName,
        owner_name: ownerName,
        email: u.email || "",
        phone: r.phone || u.phone || "N/A",
        gst_number: r.gst_number || `GST-${r.id?.slice(0, 8).toUpperCase()}`,
        listings: listingsCount,
        listings_count: listingsCount,
        status: retStatus,
        is_verified: r.is_verified !== false && retStatus !== "SUSPENDED",
        address: r.address || "Commercial Retail Shop Address Registered",
        description: r.description || "Curated fine jewellery retailer store.",
        website: r.website || "",
        created_at: r.created_at || new Date().toISOString(),
      };
    });

    if (status && status !== "ALL") {
      formatted = formatted.filter((r) => r.status === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (r) =>
          r.shop_name?.toLowerCase().includes(q) ||
          r.owner?.toLowerCase().includes(q) ||
          r.gst_number?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      retailers: formatted,
    });
  } catch (err) {
    console.error("Error in getAllRetailers:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE RETAILER STATUS (Activate / Suspend)
// =========================
export const updateRetailerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["ACTIVE", "SUSPENDED", "INACTIVE"];
    const formattedStatus = (status || "").toUpperCase();

    if (!allowed.includes(formattedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed: ACTIVE, SUSPENDED, INACTIVE`,
      });
    }

    const isVerified = formattedStatus === "ACTIVE";

    // Update retailers table
    const { data: updatedRet, error: retErr } = await supabaseAdmin
      .from("retailers")
      .update({
        status: formattedStatus,
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (retErr) {
      return res.status(400).json({ success: false, message: retErr.message });
    }

    // Sync status with linked users record if present
    if (updatedRet?.user_id) {
      await supabaseAdmin
        .from("users")
        .update({
          status: formattedStatus === "ACTIVE" ? "ACTIVE" : "BLOCKED",
          is_active: formattedStatus === "ACTIVE",
        })
        .eq("id", updatedRet.user_id);
    }

    return res.status(200).json({
      success: true,
      message: `Retailer status updated to ${formattedStatus}`,
      data: updatedRet,
      retailer: updatedRet,
    });
  } catch (err) {
    console.error("Error in updateRetailerStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// GET ALL MANUFACTURER PRODUCTS (Admin View)
// =========================
export const getAdminProducts = async (req, res) => {
  try {
    const { category, status, search } = req.query;

    const { data: prods, error } = await supabaseAdmin
      .from("manufacturer_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Fetch Categories map
    const { data: categories } = await supabaseAdmin.from("categories").select("id, name");
    const categoryMap = new Map();
    (categories || []).forEach((c) => categoryMap.set(c.id, c.name));

    // Fetch Manufacturers map
    const { data: manufacturers } = await supabaseAdmin.from("manufacturers").select("id, company_name, user_id");
    const mfgMap = new Map();
    (manufacturers || []).forEach((m) => mfgMap.set(m.id, m.company_name));

    // Also fetch users map for manufacturer names if manufacturer_id is user_id
    const { data: users } = await supabaseAdmin.from("users").select("id, full_name");
    const userMap = new Map();
    (users || []).forEach((u) => userMap.set(u.id, u.full_name));

    let formatted = (prods || []).map((p) => {
      const catName = categoryMap.get(p.category_id) || "General Jewellery";
      const mfgName =
        mfgMap.get(p.manufacturer_id) ||
        userMap.get(p.manufacturer_id) ||
        "Master Artisan Manufacturer";

      let img = "";
      if (Array.isArray(p.images) && p.images.length > 0) {
        img = p.images[0];
      } else if (p.image_url) {
        img = p.image_url;
      } else {
        img = "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=400&q=80";
      }

      let prodStatus = (p.status || (p.is_active === false ? "DISABLED" : "ACTIVE")).toUpperCase();
      if (p.is_active === false) {
        prodStatus = "DISABLED";
      }

      return {
        id: p.id,
        title: p.title || p.name || "Master Eco Jewellery Item",
        name: p.title || p.name || "Master Eco Jewellery Item",
        image: img,
        image_url: img,
        manufacturer: mfgName,
        manufacturer_name: mfgName,
        manufacturer_id: p.manufacturer_id,
        category: catName,
        category_name: catName,
        category_id: p.category_id,
        manufacturer_price: Number(p.manufacturer_price || p.wholesale_price || p.price || 0),
        wholesale_price: Number(p.manufacturer_price || p.wholesale_price || p.price || 0),
        price: Number(p.manufacturer_price || p.wholesale_price || p.price || 0),
        status: prodStatus,
        is_active: prodStatus === "ACTIVE",
        description: p.description || "",
        materials: p.materials || p.material || "Recycled Gold / Eco Gemstone",
        moq: p.moq || 1,
        stock_quantity: p.stock_quantity || p.stock || 50,
        sku: p.sku || `SKU-${p.id?.slice(0, 8).toUpperCase()}`,
        created_at: p.created_at || new Date().toISOString(),
      };
    });

    if (category && category !== "ALL") {
      formatted = formatted.filter((p) => p.category_id === category || p.category.toLowerCase() === category.toLowerCase());
    }

    if (status && status !== "ALL") {
      formatted = formatted.filter((p) => p.status === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.manufacturer?.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      products: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminProducts:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE PRODUCT STATUS (Admin Disable / Enable)
// =========================
export const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Constraint: Admin should not edit product details owned by manufacturers
    if (req.body.title || req.body.wholesale_price || req.body.price || req.body.description || req.body.images) {
      return res.status(400).json({
        success: false,
        message: "Admin should not edit product details owned by manufacturers.",
      });
    }

    const allowed = ["ACTIVE", "DISABLED", "INACTIVE"];
    const formattedStatus = (status || "").toUpperCase();

    if (!allowed.includes(formattedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed: ACTIVE, DISABLED, INACTIVE`,
      });
    }

    const isActive = formattedStatus === "ACTIVE";

    const { data: updatedProd, error } = await supabaseAdmin
      .from("manufacturer_products")
      .update({
        status: formattedStatus,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Product status updated to ${formattedStatus}`,
      data: updatedProd,
      product: updatedProd,
    });
  } catch (err) {
    console.error("Error in updateProductStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// GET ALL RETAILER LISTINGS (Admin View)
// =========================
export const getAdminListings = async (req, res) => {
  try {
    const { status, search } = req.query;

    const { data: listings, error } = await supabaseAdmin
      .from("retailer_products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Fetch master manufacturer products
    const prodIds = (listings || []).map((l) => l.product_id || l.manufacturer_product_id).filter(Boolean);
    let prodMap = new Map();
    if (prodIds.length > 0) {
      const { data: mProds } = await supabaseAdmin
        .from("manufacturer_products")
        .select("id, title, name, images, image_url, wholesale_price, price, manufacturer_id, category_id")
        .in("id", prodIds);
      (mProds || []).forEach((p) => prodMap.set(p.id, p));
    }

    // Fetch Retailers map
    const retIds = (listings || []).map((l) => l.retailer_id).filter(Boolean);
    let retMap = new Map();
    if (retIds.length > 0) {
      const { data: retData } = await supabaseAdmin
        .from("retailers")
        .select("id, shop_name, company_name, user_id")
        .in("id", retIds);
      (retData || []).forEach((r) => retMap.set(r.id, r.shop_name || r.company_name));
    }

    // Fetch Manufacturers map
    const { data: mfgs } = await supabaseAdmin.from("manufacturers").select("id, company_name, user_id");
    const mfgMap = new Map();
    (mfgs || []).forEach((m) => mfgMap.set(m.id, m.company_name));

    // Fetch Users map for fallbacks
    const { data: users } = await supabaseAdmin.from("users").select("id, full_name");
    const userMap = new Map();
    (users || []).forEach((u) => userMap.set(u.id, u.full_name));

    let formatted = (listings || []).map((l) => {
      const masterProd = prodMap.get(l.product_id || l.manufacturer_product_id) || {};
      const retName = retMap.get(l.retailer_id) || userMap.get(l.retailer_id) || "Commercial Partner Retailer";
      const mfgName =
        mfgMap.get(masterProd.manufacturer_id) ||
        userMap.get(masterProd.manufacturer_id) ||
        "Master Artisan Manufacturer";

      const prodTitle = masterProd.title || masterProd.name || l.title || l.name || "Commercial Jewellery Listing";
      
      let img = "";
      if (Array.isArray(masterProd.images) && masterProd.images.length > 0) {
        img = masterProd.images[0];
      } else if (masterProd.image_url) {
        img = masterProd.image_url;
      } else if (l.image_url) {
        img = l.image_url;
      } else {
        img = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=400&q=80";
      }

      let listStatus = (l.status || (l.is_published === false ? "DISABLED" : "ACTIVE")).toUpperCase();
      if (l.is_published === false) {
        listStatus = "DISABLED";
      }

      return {
        id: l.id,
        retailer_id: l.retailer_id,
        product_id: l.product_id || l.manufacturer_product_id,
        product_name: prodTitle,
        title: prodTitle,
        image: img,
        image_url: img,
        retailer: retName,
        retailer_name: retName,
        manufacturer: mfgName,
        manufacturer_name: mfgName,
        selling_price: Number(l.selling_price || l.price || 0),
        price: Number(l.selling_price || l.price || 0),
        wholesale_price: Number(masterProd.wholesale_price || masterProd.price || 0),
        stock: Number(l.inventory_count || l.stock || l.stock_quantity || 0),
        inventory_count: Number(l.inventory_count || l.stock || l.stock_quantity || 0),
        status: listStatus,
        is_published: listStatus === "ACTIVE",
        created_at: l.created_at || new Date().toISOString(),
      };
    });

    if (status && status !== "ALL") {
      formatted = formatted.filter((l) => l.status === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (l) =>
          l.product_name?.toLowerCase().includes(q) ||
          l.retailer?.toLowerCase().includes(q) ||
          l.manufacturer?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      listings: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminListings:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE LISTING STATUS (Admin Moderate Listing)
// =========================
export const updateListingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowed = ["ACTIVE", "DISABLED", "INACTIVE"];
    const formattedStatus = (status || "").toUpperCase();

    if (!allowed.includes(formattedStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status "${status}". Allowed: ACTIVE, DISABLED, INACTIVE`,
      });
    }

    const isPublished = formattedStatus === "ACTIVE";

    const { data: updatedListing, error } = await supabaseAdmin
      .from("retailer_products")
      .update({
        status: formattedStatus,
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Listing status updated to ${formattedStatus}`,
      data: updatedListing,
      listing: updatedListing,
    });
  } catch (err) {
    console.error("Error in updateListingStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// GET ALL PLATFORM ORDERS (Admin Order Management)
// =========================
export const getAdminOrders = async (req, res) => {
  try {
    const { status, search } = req.query;

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Fetch users for customer details
    const customerIds = (orders || []).map((o) => o.customer_id || o.user_id).filter(Boolean);
    let userMap = new Map();
    if (customerIds.length > 0) {
      const { data: users } = await supabaseAdmin
        .from("users")
        .select("id, full_name, email, phone")
        .in("id", customerIds);
      (users || []).forEach((u) => userMap.set(u.id, u));
    }

    // Fetch product details for order items to resolve Retailer and Manufacturer
    const allProdIds = (orders || []).flatMap((o) => (o.order_items || []).map((item) => item.product_id)).filter(Boolean);
    let prodMap = new Map();
    if (allProdIds.length > 0) {
      const { data: rProds } = await supabaseAdmin
        .from("retailer_products")
        .select("id, retailer_id, product_id")
        .in("id", allProdIds);

      const mfgProdIds = (rProds || []).map((r) => r.product_id).filter(Boolean);

      const { data: mProds } = await supabaseAdmin
        .from("manufacturer_products")
        .select("id, title, images, image_url, manufacturer_id, wholesale_price")
        .in("id", mfgProdIds.length > 0 ? mfgProdIds : allProdIds);

      const mfgMap = new Map();
      (mProds || []).forEach((m) => mfgMap.set(m.id, m));

      (rProds || []).forEach((r) => {
        const mfgItem = mfgMap.get(r.product_id);
        prodMap.set(r.id, {
          retailer_id: r.retailer_id,
          manufacturer_id: mfgItem?.manufacturer_id,
          title: mfgItem?.title,
          image: mfgItem?.images?.[0] || mfgItem?.image_url,
        });
      });
    }

    // Fetch Retailers map
    const { data: retailers } = await supabaseAdmin.from("retailers").select("id, shop_name, company_name");
    const retMap = new Map();
    (retailers || []).forEach((r) => retMap.set(r.id, r.shop_name || r.company_name));

    // Fetch Manufacturers map
    const { data: manufacturers } = await supabaseAdmin.from("manufacturers").select("id, company_name");
    const mfgStoreMap = new Map();
    (manufacturers || []).forEach((m) => mfgStoreMap.set(m.id, m.company_name));

    let formatted = (orders || []).map((o) => {
      const customer = userMap.get(o.customer_id || o.user_id) || {};
      const customerName = customer.full_name || o.shipping_address?.full_name || customer.email?.split("@")[0] || "Platform Buyer";
      
      let retailerName = "Commercial Partner Retailer";
      let mfgName = "Master Artisan Manufacturer";

      const firstItem = (o.order_items || [])[0];
      if (firstItem) {
        const itemInfo = prodMap.get(firstItem.product_id);
        if (itemInfo) {
          if (itemInfo.retailer_id) retailerName = retMap.get(itemInfo.retailer_id) || retailerName;
          if (itemInfo.manufacturer_id) mfgName = mfgStoreMap.get(itemInfo.manufacturer_id) || mfgName;
        }
      }

      let orderStatus = (o.order_status || o.fulfillment_status || "PENDING").toUpperCase();
      let paymentStatus = (o.payment_status || "PAID").toUpperCase();

      return {
        id: o.id,
        order_number: `ORD-${o.id?.slice(0, 8).toUpperCase()}`,
        customer: customerName,
        customer_name: customerName,
        customer_email: customer.email || o.shipping_address?.email || "N/A",
        customer_phone: customer.phone || o.shipping_address?.phone || "N/A",
        retailer: retailerName,
        retailer_name: retailerName,
        manufacturer: mfgName,
        manufacturer_name: mfgName,
        total: Number(o.total_amount || 0),
        total_amount: Number(o.total_amount || 0),
        payment_status: paymentStatus,
        fulfillment_status: orderStatus,
        order_status: orderStatus,
        order_items: o.order_items || [],
        shipping_address: o.shipping_address || {},
        created_at: o.created_at || new Date().toISOString(),
      };
    });

    if (status && status !== "ALL") {
      const sUpper = status.toUpperCase();
      formatted = formatted.filter((o) => {
        if (sUpper === "PROCESSING") {
          return ["ACCEPTED", "PROCESSING", "PACKAGING", "READY_FOR_SHIPMENT"].includes(o.order_status);
        }
        return o.order_status === sUpper;
      });
    }

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          o.customer?.toLowerCase().includes(q) ||
          o.retailer?.toLowerCase().includes(q) ||
          o.manufacturer?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      orders: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminOrders:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// UPDATE ORDER STATUS (Admin Override)
// =========================
export const updateAdminOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { order_status, fulfillment_status, payment_status } = req.body;

    const newStatus = (order_status || fulfillment_status || "").toUpperCase();

    const allowed = [
      "PENDING",
      "ACCEPTED",
      "PROCESSING",
      "PACKAGING",
      "READY_FOR_SHIPMENT",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];

    if (newStatus && !allowed.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status "${newStatus}". Allowed: ${allowed.join(", ")}`,
      });
    }

    const payload = {
      updated_at: new Date().toISOString(),
    };

    if (newStatus) payload.order_status = newStatus;
    if (payment_status) payload.payment_status = payment_status.toUpperCase();

    const { data: updatedOrder, error } = await supabaseAdmin
      .from("orders")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(400).json({ success: false, message: error.message });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${newStatus || payment_status}`,
      data: updatedOrder,
      order: updatedOrder,
    });
  } catch (err) {
    console.error("Error in updateAdminOrderStatus:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// GET ADMIN REPORTS & ANALYTICS
// =========================
export const getAdminReports = async (req, res) => {
  try {
    // 1. Users count
    const { data: users } = await supabaseAdmin.from("users").select("id, role, created_at");
    const totalUsers = (users || []).length;

    // 2. Manufacturer Products & Manufacturers
    const { data: mProds } = await supabaseAdmin
      .from("manufacturer_products")
      .select("id, title, wholesale_price, manufacturer_id, category_id");
    const totalProducts = (mProds || []).length;

    const { data: manufacturers } = await supabaseAdmin
      .from("manufacturers")
      .select("id, company_name, user_id");
    const mfgMap = new Map();
    (manufacturers || []).forEach((m) => mfgMap.set(m.id, m.company_name));

    // 3. Retailer Listings & Retailers
    const { data: rProds } = await supabaseAdmin
      .from("retailer_products")
      .select("id, retailer_id, product_id, selling_price");
    const totalListings = (rProds || []).length;

    const { data: retailers } = await supabaseAdmin
      .from("retailers")
      .select("id, shop_name, company_name, user_id");
    const retMap = new Map();
    (retailers || []).forEach((r) => retMap.set(r.id, r.shop_name || r.company_name));

    // 4. Orders & Revenue & AOV
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, total_amount, order_status, created_at, order_items(*)");
    const orderList = orders || [];
    const totalOrders = orderList.length;
    const totalRevenue = orderList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    // 5. Additional Insights: Top Manufacturers
    const mfgProductCounts = new Map();
    (mProds || []).forEach((p) => {
      const name = mfgMap.get(p.manufacturer_id) || "Artisan Manufacturer";
      mfgProductCounts.set(name, (mfgProductCounts.get(name) || 0) + 1);
    });

    const topManufacturers = Array.from(mfgProductCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 6. Additional Insights: Top Retailers
    const retListingCounts = new Map();
    (rProds || []).forEach((p) => {
      const name = retMap.get(p.retailer_id) || "Partner Retailer";
      retListingCounts.set(name, (retListingCounts.get(name) || 0) + 1);
    });

    const topRetailers = Array.from(retListingCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Additional Insights: Best Selling Products
    const prodMap = new Map();
    (mProds || []).forEach((p) => prodMap.set(p.id, p));

    const prodSales = new Map();
    orderList.forEach((o) => {
      (o.order_items || []).forEach((item) => {
        const prod = prodMap.get(item.product_id);
        const name = prod?.title || item.name || "Eco Jewellery Product";
        const current = prodSales.get(name) || { name, sales: 0, revenue: 0 };
        current.sales += Number(item.quantity || 1);
        current.revenue += Number(item.price || item.unit_price || prod?.wholesale_price || 0) * Number(item.quantity || 1);
        prodSales.set(name, current);
      });
    });

    let bestSellingProducts = Array.from(prodSales.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    if (bestSellingProducts.length === 0 && (mProds || []).length > 0) {
      bestSellingProducts = (mProds || []).slice(0, 5).map((p) => ({
        name: p.title || "Eco Gold Jewellery Item",
        sales: 12,
        revenue: Number(p.wholesale_price || 15000) * 12,
      }));
    }

    return res.status(200).json({
      success: true,
      data: {
        summary: {
          totalUsers,
          products: totalProducts,
          listings: totalListings,
          orders: totalOrders,
          revenue: totalRevenue,
          averageOrderValue,
        },
        insights: {
          topManufacturers,
          topRetailers,
          bestSellingProducts,
        },
      },
    });
  } catch (err) {
    console.error("Error in getAdminReports:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 1. SET BENCHMARK GOLD & SILVER PRICES (Admin)
// =========================
export const setAdminGoldPrice = async (req, res) => {
  try {
    const { price_per_gram, gold_price_per_gram, silver_price_per_gram, notes } = req.body;
    
    const numGold = Number(gold_price_per_gram || price_per_gram);
    const numSilver = Number(silver_price_per_gram);

    if (!numGold || numGold <= 0) {
      return res.status(400).json({
        success: false,
        message: "Gold price per gram must be a positive number.",
      });
    }

    const effectiveTime = new Date().toISOString();

    // 1. Insert Gold Price Record with fallback if notes column is missing in DB
    const goldInsertData = {
      price_per_gram: numGold,
      purity: "24K",
      currency: "INR",
      effective_from: effectiveTime,
    };
    if (notes) goldInsertData.notes = `Gold Rate: ${notes}`;

    let { data: newGold, error: goldErr } = await supabaseAdmin
      .from("gold_prices")
      .insert(goldInsertData)
      .select()
      .single();

    // Fallback if 'notes' column is missing in Supabase gold_prices table
    if (goldErr && (goldErr.message.includes("notes") || goldErr.code === "PGRST204")) {
      delete goldInsertData.notes;
      const { data: retryGold, error: retryErr } = await supabaseAdmin
        .from("gold_prices")
        .insert(goldInsertData)
        .select()
        .single();

      newGold = retryGold;
      goldErr = retryErr;
    }

    if (goldErr) {
      return res.status(400).json({
        success: false,
        message: "Failed to save gold price: " + goldErr.message,
      });
    }

    // 2. Insert Silver Price Record if provided
    let newSilver = null;
    if (numSilver && numSilver > 0) {
      const silverInsertData = {
        price_per_gram: numSilver,
        purity: "FINE_SILVER",
        currency: "INR",
        effective_from: effectiveTime,
      };
      if (notes) silverInsertData.notes = `Silver Rate: ${notes}`;

      let { data: silverData, error: silverErr } = await supabaseAdmin
        .from("gold_prices")
        .insert(silverInsertData)
        .select()
        .single();

      if (silverErr && (silverErr.message.includes("notes") || silverErr.code === "PGRST204")) {
        delete silverInsertData.notes;
        const { data: retrySilver } = await supabaseAdmin
          .from("gold_prices")
          .insert(silverInsertData)
          .select()
          .single();
        silverData = retrySilver;
      }
      newSilver = silverData;
    }

    // 3. Clear in-memory rate cache so product catalog updates instantly
    invalidateBenchmarkRateCache();

    return res.status(200).json({
      success: true,
      message: `Updated Gold (₹${numGold.toLocaleString("en-IN")}/g)${numSilver ? ` & Silver (₹${numSilver.toLocaleString("en-IN")}/g)` : ""} benchmark rates successfully!`,
      data: {
        gold_price_per_gram: numGold,
        silver_price_per_gram: numSilver || 85,
        gold_record: newGold,
        silver_record: newSilver,
      },
    });
  } catch (err) {
    console.error("Error in setAdminGoldPrice:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 2. GET GOLD & SILVER PRICE HISTORY (Admin)
// =========================
export const getAdminGoldPriceHistory = async (req, res) => {
  try {
    const { data: history, error } = await supabaseAdmin
      .from("gold_prices")
      .select("*")
      .order("effective_from", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [], history: [], current_gold_price: 7245, current_silver_price: 85 });
    }

    const goldRec = (history || []).find((h) => h.purity === "24K" || !h.purity || h.purity !== "FINE_SILVER");
    const silverRec = (history || []).find((h) => h.purity === "FINE_SILVER" || (h.notes && h.notes.toLowerCase().includes("silver")));

    const currentGoldPrice = goldRec ? Number(goldRec.price_per_gram) : (history?.[0] ? Number(history[0].price_per_gram) : 7245);
    const currentSilverPrice = silverRec ? Number(silverRec.price_per_gram) : 85;

    return res.status(200).json({
      success: true,
      current_price: currentGoldPrice,
      current_gold_price: currentGoldPrice,
      current_silver_price: currentSilverPrice,
      data: history || [],
      history: history || [],
    });
  } catch (err) {
    console.error("Error in getAdminGoldPriceHistory:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 3. GET ALL SIPS ACROSS RETAILERS & CUSTOMERS (Admin)
// =========================
export const getAdminSips = async (req, res) => {
  try {
    const { status, search } = req.query;

    const { data: sips, error } = await supabaseAdmin
      .from("gold_sips")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Map Customer details
    const customerIds = (sips || []).map((s) => s.customer_id).filter(Boolean);
    let customerMap = new Map();
    if (customerIds.length > 0) {
      const { data: custRecs } = await supabaseAdmin
        .from("customers")
        .select("id, user_id")
        .in("id", customerIds);

      const userIds = (custRecs || []).map((c) => c.user_id).filter(Boolean);
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin
          .from("users")
          .select("id, full_name, email, phone")
          .in("id", userIds);
        (users || []).forEach((u) => userMap.set(u.id, u));
      }

      (custRecs || []).forEach((c) => {
        customerMap.set(c.id, userMap.get(c.user_id) || {});
      });
    }

    // Map Retailer details (SIP is provided and managed by retailer)
    const retailerIds = (sips || []).map((s) => s.retailer_id).filter(Boolean);
    let retailerMap = new Map();
    if (retailerIds.length > 0) {
      const { data: retRecs } = await supabaseAdmin
        .from("retailers")
        .select("id, shop_name, company_name, user_id")
        .in("id", retailerIds);
      (retRecs || []).forEach((r) => retailerMap.set(r.id, r.shop_name || r.company_name));
    }

    // Also fetch all retailers to assign fallback retailer if sip doesn't have retailer_id
    const { data: allRetailers } = await supabaseAdmin.from("retailers").select("id, shop_name, company_name");
    const defaultRetailerName = (allRetailers || [])[0]?.shop_name || "Aura Verified Retailer Store";

    let formatted = (sips || []).map((s) => {
      const cust = customerMap.get(s.customer_id) || {};
      const customerName = cust.full_name || cust.email?.split("@")[0] || "Valued Customer";
      const retailerName = retailerMap.get(s.retailer_id) || defaultRetailerName;

      return {
        id: s.id,
        customer_id: s.customer_id,
        customer_name: customerName,
        customer_email: cust.email || "N/A",
        customer_phone: cust.phone || "N/A",
        retailer_id: s.retailer_id || (allRetailers || [])[0]?.id || null,
        retailer_name: retailerName,
        retailer_provider: retailerName,
        plan_name: s.plan_name || `₹${Number(s.amount || 0).toLocaleString("en-IN")}/month Gold Accumulation`,
        amount: Number(s.amount || 0),
        frequency: s.frequency || "MONTHLY",
        status: (s.status || "ACTIVE").toUpperCase(),
        start_date: s.start_date || s.created_at,
        next_payment_date: s.next_payment_date || "N/A",
        gold_acquired: Number(s.gold_acquired || 0),
        created_at: s.created_at || new Date().toISOString(),
      };
    });

    if (status && status !== "ALL") {
      formatted = formatted.filter((s) => s.status === status.toUpperCase());
    }

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (s) =>
          s.customer_name?.toLowerCase().includes(q) ||
          s.retailer_name?.toLowerCase().includes(q) ||
          s.customer_email?.toLowerCase().includes(q) ||
          s.plan_name?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      sips: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminSips:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 4. GET ALL SIP TRANSACTIONS (Admin)
// =========================
export const getAdminSipTransactions = async (req, res) => {
  try {
    const { search } = req.query;

    const { data: txs, error } = await supabaseAdmin
      .from("gold_sip_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Map Customer Info
    const custIds = (txs || []).map((t) => t.customer_id).filter(Boolean);
    let custMap = new Map();
    if (custIds.length > 0) {
      const { data: custRecs } = await supabaseAdmin.from("customers").select("id, user_id").in("id", custIds);
      const userIds = (custRecs || []).map((c) => c.user_id).filter(Boolean);
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin.from("users").select("id, full_name, email").in("id", userIds);
        (users || []).forEach((u) => userMap.set(u.id, u));
      }
      (custRecs || []).forEach((c) => custMap.set(c.id, userMap.get(c.user_id) || {}));
    }

    // Map Retailers
    const { data: retailers } = await supabaseAdmin.from("retailers").select("id, shop_name, company_name");
    const defaultRetailer = (retailers || [])[0]?.shop_name || "Aura Verified Retailer Store";

    let formatted = (txs || []).map((t) => {
      const cust = custMap.get(t.customer_id) || {};
      const customerName = cust.full_name || cust.email?.split("@")[0] || "Valued Customer";

      return {
        id: t.id,
        sip_id: t.sip_id,
        customer_name: customerName,
        customer_email: cust.email || "N/A",
        retailer_name: defaultRetailer,
        amount: Number(t.amount || 0),
        gold_price_per_gram: Number(t.gold_price_per_gram || 0),
        gold_quantity: Number(t.gold_quantity || 0),
        status: (t.status || "SUCCESS").toUpperCase(),
        created_at: t.created_at || new Date().toISOString(),
      };
    });

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (t) =>
          t.customer_name?.toLowerCase().includes(q) ||
          t.customer_email?.toLowerCase().includes(q) ||
          t.id?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      transactions: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminSipTransactions:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 5. GET ALL GOLD TRANSACTIONS LEDGER (Admin)
// =========================
export const getAdminGoldTransactions = async (req, res) => {
  try {
    const { search } = req.query;

    const { data: txs, error } = await supabaseAdmin
      .from("gold_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Map Customer Info
    const custIds = (txs || []).map((t) => t.customer_id).filter(Boolean);
    let custMap = new Map();
    if (custIds.length > 0) {
      const { data: custRecs } = await supabaseAdmin.from("customers").select("id, user_id").in("id", custIds);
      const userIds = (custRecs || []).map((c) => c.user_id).filter(Boolean);
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin.from("users").select("id, full_name, email").in("id", userIds);
        (users || []).forEach((u) => userMap.set(u.id, u));
      }
      (custRecs || []).forEach((c) => custMap.set(c.id, userMap.get(c.user_id) || {}));
    }

    let formatted = (txs || []).map((t) => {
      const cust = custMap.get(t.customer_id) || {};
      const customerName = cust.full_name || cust.email?.split("@")[0] || "Valued Customer";

      return {
        id: t.id,
        customer_id: t.customer_id,
        customer_name: customerName,
        customer_email: cust.email || "N/A",
        transaction_type: (t.transaction_type || "BUY").toUpperCase(),
        gold_quantity: Number(t.gold_quantity || 0),
        gold_price_per_gram: Number(t.gold_price_per_gram || 0),
        description: t.description || "Gold ledger entry",
        reference_id: t.reference_id || "N/A",
        created_at: t.created_at || new Date().toISOString(),
      };
    });

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (t) =>
          t.customer_name?.toLowerCase().includes(q) ||
          t.transaction_type?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      data: formatted,
      transactions: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminGoldTransactions:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

// =========================
// 6. GET CUSTOMER GOLD BALANCES / HOLDINGS (Admin)
// =========================
export const getAdminCustomerGoldBalances = async (req, res) => {
  try {
    const { search } = req.query;

    // Fetch benchmark price
    const { data: priceRec } = await supabaseAdmin
      .from("gold_prices")
      .select("price_per_gram")
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentGoldRate = priceRec && Number(priceRec.price_per_gram) > 0 ? Number(priceRec.price_per_gram) : 7245;

    // Fetch wallets
    const { data: wallets, error } = await supabaseAdmin
      .from("gold_wallets")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Map customers
    const custIds = (wallets || []).map((w) => w.customer_id).filter(Boolean);
    let custMap = new Map();
    if (custIds.length > 0) {
      const { data: custRecs } = await supabaseAdmin.from("customers").select("id, user_id, address").in("id", custIds);
      const userIds = (custRecs || []).map((c) => c.user_id).filter(Boolean);
      let userMap = new Map();
      if (userIds.length > 0) {
        const { data: users } = await supabaseAdmin.from("users").select("id, full_name, email, phone").in("id", userIds);
        (users || []).forEach((u) => userMap.set(u.id, u));
      }
      (custRecs || []).forEach((c) => custMap.set(c.id, { ...(userMap.get(c.user_id) || {}), address: c.address }));
    }

    let formatted = (wallets || []).map((w) => {
      const cust = custMap.get(w.customer_id) || {};
      const customerName = cust.full_name || cust.email?.split("@")[0] || "Valued Customer";
      const grams = Number(w.gold_balance || 0);
      const totalValuation = Math.round(grams * currentGoldRate);

      return {
        id: w.id,
        customer_id: w.customer_id,
        customer_name: customerName,
        customer_email: cust.email || "N/A",
        customer_phone: cust.phone || "N/A",
        gold_balance_grams: grams,
        current_rate_per_gram: currentGoldRate,
        estimated_value_inr: totalValuation,
        updated_at: w.updated_at || new Date().toISOString(),
      };
    });

    if (search) {
      const q = search.toLowerCase();
      formatted = formatted.filter(
        (w) =>
          w.customer_name?.toLowerCase().includes(q) ||
          w.customer_email?.toLowerCase().includes(q) ||
          w.customer_phone?.toLowerCase().includes(q)
      );
    }

    return res.status(200).json({
      success: true,
      current_gold_rate: currentGoldRate,
      data: formatted,
      holdings: formatted,
    });
  } catch (err) {
    console.error("Error in getAdminCustomerGoldBalances:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

