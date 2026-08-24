import { supabase, supabaseAdmin } from "../config/supabase.js";

/**
 * Authentication Middleware
 * Validates JWT access tokens via Supabase Auth and attaches the database user profile to req.user
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                success: false,
                message: "Authorization header missing",
            });
        }

        const [scheme, token] = authHeader.split(" ");

        if (scheme !== "Bearer" || !token) {
            return res.status(401).json({
                success: false,
                message: "Invalid Authorization format. Use: Bearer <token>",
            });
        }

        // Verify cryptographically signed JWT session via Supabase Auth
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired token",
            });
        }

        const { data: dbUser, error: dbError } = await supabaseAdmin
            .from("users")
            .select("id, auth_user_id, full_name, email, phone, profile_image, role")
            .eq("auth_user_id", user.id)
            .maybeSingle();

        if (dbError || !dbUser) {
            const statusCode = dbError ? 500 : 401;

            return res.status(statusCode).json({
                success: false,
                message: dbError ? "Unable to load user profile" : "User profile not found",
            });
        }

        req.accessToken = token;
        req.authUser = user;
        req.user = dbUser;

        next();

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Authentication failed",
        });
    }
};

export { authMiddleware as authenticate };
export default authMiddleware;
