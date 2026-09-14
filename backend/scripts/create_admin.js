import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load production environment if available, fallback to default .env
const envPath = process.env.NODE_ENV === "production" 
  ? path.join(__dirname, "../.env.production") 
  : path.join(__dirname, "../.env");

dotenv.config({ path: envPath });

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be defined in .env file.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function createAdminUser() {
  const args = process.argv.slice(2);
  const emailArg = args.find(a => a.startsWith("--email="))?.split("=")[1];
  const passwordArg = args.find(a => a.startsWith("--password="))?.split("=")[1];
  const nameArg = args.find(a => a.startsWith("--name="))?.split("=")[1];

  const email = emailArg || process.env.ADMIN_INITIAL_EMAIL || "admin@cjp.com";
  const password = passwordArg || process.env.ADMIN_INITIAL_PASSWORD || "Admin@CJP2026!";
  const fullName = nameArg || "Platform Super Administrator";

  console.log("==================================================");
  console.log("      CJP PRODUCTION ADMIN CREATION SCRIPT        ");
  console.log("==================================================");
  console.log(`Target Email: ${email}`);
  console.log(`Role: ADMIN`);
  console.log("--------------------------------------------------\n");

  try {
    // 1. Create or fetch Auth user in Supabase Auth
    console.log("1. Creating user in Supabase Auth...");
    let authUserId = null;

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { role: "ADMIN", full_name: fullName },
    });

    if (authError) {
      if (authError.message?.includes("already registered") || authError.status === 422) {
        console.log("⚠️ User already exists in Supabase Auth. Searching existing auth record...");
        const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
        if (listErr) throw listErr;
        const existing = usersList.users.find(u => u.email === email);
        if (existing) {
          authUserId = existing.id;
          console.log(`Found existing auth user ID: ${authUserId}`);
        } else {
          throw new Error("User exists but could not be located in user list.");
        }
      } else {
        throw authError;
      }
    } else {
      authUserId = authData.user.id;
      console.log(`✅ Auth user created successfully. ID: ${authUserId}`);
    }

    // 2. Insert or Update entry in public.users table
    console.log("\n2. Provisioning record in public.users table...");
    const { data: dbUser, error: dbErr } = await supabaseAdmin
      .from("users")
      .upsert(
        {
          id: authUserId,
          email,
          full_name: fullName,
          role: "ADMIN",
          status: "ACTIVE",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      )
      .select()
      .single();

    if (dbErr) {
      // If error on ID conflict, retry matching on email or ID
      const { data: fallbackUser, error: fbErr } = await supabaseAdmin
        .from("users")
        .upsert(
          {
            email,
            full_name: fullName,
            role: "ADMIN",
            status: "ACTIVE",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        )
        .select()
        .single();
      if (fbErr) throw fbErr;
      console.log(`✅ Admin profile updated in public.users (ID: ${fallbackUser.id})`);
    } else {
      console.log(`✅ Admin profile provisioned in public.users (ID: ${dbUser.id})`);
    }

    console.log("\n==================================================");
    console.log("🎉 ADMIN USER CREATED / UPDATED SUCCESSFULLY!");
    console.log(`   Email:    ${email}`);
    console.log(`   Role:     ADMIN`);
    console.log(`   Status:   ACTIVE`);
    console.log("==================================================");
  } catch (err) {
    console.error("❌ Failed to create admin user:", err.message || err);
    process.exit(1);
  }
}

createAdminUser();
