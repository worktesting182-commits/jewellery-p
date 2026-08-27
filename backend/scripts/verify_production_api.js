import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment variables explicitly BEFORE importing server config
dotenv.config({ path: path.join(__dirname, "../.env.production") });

console.log("==================================================");
console.log("   EXPRESS API VERIFICATION (.env.production)    ");
console.log("==================================================");
console.log("Backend Port:", process.env.PORT || 5000);
console.log("Production Supabase URL:", process.env.SUPABASE_URL);
console.log("--------------------------------------------------\n");

// Dynamically import server after setting process.env
const { default: express } = await import("express");
const { default: cors } = await import("cors");

const { default: authRoutes } = await import("../routes/authRoutes.js");
const { default: userRoutes } = await import("../routes/userRoutes.js");
const { default: categoryRoutes } = await import("../routes/categoryRoutes.js");
const { default: productRoutes } = await import("../routes/productRoutes.js");
const { default: cartRoutes } = await import("../routes/cartRoutes.js");
const { default: orderRoutes } = await import("../routes/orderRoutes.js");
const { default: notificationRoutes } = await import("../routes/notificationRoutes.js");
const { default: retailerRoutes } = await import("../routes/retailerRoutes.js");
const { default: adminRoutes } = await import("../routes/adminRoutes.js");
const { default: goldSipRoutes } = await import("../routes/goldSipRoutes.js");
const { notFoundHandler, globalErrorHandler } = await import("../middleware/errorHandler.js");

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: true }));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Production API is healthy", env: "production" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customer/products", productRoutes);
app.use("/api/marketplace/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/manufacturer/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/retailers", retailerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/gold-sip", goldSipRoutes);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const TEST_PORT = 5005;

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data || "{}");
          resolve({ statusCode: res.statusCode, data: parsed, raw: data });
        } catch (err) {
          resolve({ statusCode: res.statusCode, data: null, raw: data });
        }
      });
    });

    req.on("error", (err) => reject(err));
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runApiTests() {
  const server = app.listen(TEST_PORT, async () => {
    console.log(`Test Express server running on port ${TEST_PORT}\n`);
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

    try {
      // Test 1: GET /api/health
      console.log("1. --- Testing Health Endpoint ---");
      const healthRes = await makeRequest({
        hostname: "localhost",
        port: TEST_PORT,
        path: "/api/health",
        method: "GET",
      });
      assert(healthRes.statusCode === 200 && healthRes.data?.success === true, "GET /api/health returns 200 OK");

      // Test 2: GET /api/categories
      console.log("\n2. --- Testing Categories API ---");
      const catRes = await makeRequest({
        hostname: "localhost",
        port: TEST_PORT,
        path: "/api/categories",
        method: "GET",
      });
      const catList = catRes.data?.data;
      assert(catRes.statusCode === 200 && Array.isArray(catList), `GET /api/categories returns categories list (Count: ${catList?.length})`);

      // Test 3: GET /api/products
      console.log("\n3. --- Testing Products API ---");
      const prodRes = await makeRequest({
        hostname: "localhost",
        port: TEST_PORT,
        path: "/api/products",
        method: "GET",
      });
      assert(prodRes.statusCode === 200, "GET /api/products returns 200 OK");

      // Test 4: GET /api/gold-sip/prices
      console.log("\n4. --- Testing Gold Benchmark Rate API ---");
      const sipPriceRes = await makeRequest({
        hostname: "localhost",
        port: TEST_PORT,
        path: "/api/gold-sip/prices",
        method: "GET",
      });
      assert(sipPriceRes.statusCode === 200, "GET /api/gold-sip/prices returns 200 OK");

    } catch (err) {
      console.error("API Test Execution Error:", err);
    } finally {

      server.close(() => {
        console.log("\n==================================================");
        console.log(`   EXPRESS PRODUCTION API SUMMARY: ${passed} PASSED, ${failed} FAILED`);
        console.log("==================================================");
        if (failed > 0) {
          process.exit(1);
        } else {
          process.exit(0);
        }
      });
    }
  });
}

runApiTests();
