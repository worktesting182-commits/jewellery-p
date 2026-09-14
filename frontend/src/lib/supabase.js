import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey
);

/**
 * Gets a fresh, valid JWT token from the Supabase session.
 * Automatically refreshes expired tokens via Supabase Auth JS SDK and keeps localStorage in sync.
 */
export const getAuthToken = async () => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
            localStorage.setItem("token", session.access_token);
            return session.access_token;
        }
    } catch (err) {
        console.error("Failed to fetch fresh Supabase session token:", err);
    }
    return localStorage.getItem("token") || "";
};