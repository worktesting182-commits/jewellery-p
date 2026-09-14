import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

import path from "path";
import { fileURLToPath } from "url";

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });


const requiredEnvVars = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`${envVar} is required`);
    }
}

const serverAuthOptions = {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    },
};

// Admin Client (Service Role)
// Use for admin operations like creating users
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    serverAuthOptions
);

// Public/Auth Client (Anon Key)
// Use for login, token verification and normal database queries
export const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    serverAuthOptions
);
