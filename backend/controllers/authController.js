import { supabase, supabaseAdmin } from "../config/supabase.js";
import { notifyAdmins } from "../services/notificationService.js";

const ALLOWED_SIGNUP_ROLES = ["CUSTOMER", "MANUFACTURER", "RETAILER"];
const ROLE_PROFILE_TABLES = {
    CUSTOMER: "customers",
    MANUFACTURER: "manufacturers",
    RETAILER: "retailers",
};

// =========================
// SIGNUP
// =========================
export const signup = async (req, res) => {
    try {
        const {
            full_name,
            email,
            password,
            phone,
            role
        } = req.body;

        const normalizedEmail = email?.trim().toLowerCase();
        const normalizedRole = role?.trim().toUpperCase();

        if (!full_name?.trim() || !normalizedEmail || !password || !normalizedRole) {
            return res.status(400).json({
                success: false,
                message: "Full name, email, password and role are required",
            });
        }

        if (!ALLOWED_SIGNUP_ROLES.includes(normalizedRole)) {
            return res.status(400).json({
                success: false,
                message: "Invalid role",
            });
        }

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: normalizedEmail,
            password,
            email_confirm: true,
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        const { data: createdUser, error: userError } = await supabaseAdmin
            .from("users")
            .insert({
                auth_user_id: data.user.id,
                full_name: full_name.trim(),
                email: normalizedEmail,
                phone,
                role: normalizedRole,
            })
            .select("id, auth_user_id, full_name, email, phone, role")
            .single();

        if (userError) {
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);

            return res.status(400).json({
                success: false,
                message: userError.message,
            });
        }

        let profileData = {
            user_id: createdUser.id,
        };

        if (normalizedRole === "MANUFACTURER") {
            profileData = {
                user_id: createdUser.id,
                company_name: req.body.company_name,
                license_number: req.body.license_number,
                gst_number: req.body.gst_number,
                address: req.body.address,
                postal_code: req.body.postal_code,
                website: req.body.website,
                description: req.body.description,
            };
        }

        if (normalizedRole === "RETAILER") {
            profileData = {
                user_id: createdUser.id,
                shop_name: req.body.shop_name,
                gst_number: req.body.gst_number,
                address: req.body.address,
                postal_code: req.body.postal_code,
                website: req.body.website,
                description: req.body.description,
            };
        }

        const profileTable = ROLE_PROFILE_TABLES[normalizedRole];

        const { error: profileError } = await supabaseAdmin
            .from(profileTable)
            .insert(profileData);

        if (profileError) {
            await supabaseAdmin.from("users").delete().eq("id", createdUser.id);
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);

            return res.status(400).json({
                success: false,
                message: profileError.message,
            });
        }

        if (normalizedRole === "MANUFACTURER" || normalizedRole === "RETAILER") {
            notifyAdmins({
                title: `New ${normalizedRole === "MANUFACTURER" ? "Manufacturer" : "Retailer"} Registered`,
                message: `Enterprise partner "${full_name}" (${normalizedRole}) registered on the platform.`,
                type: "ENTERPRISE_REGISTRATION",
                reference_id: createdUser.id,
            }).catch((err) => console.error("Error sending admin registration notification:", err));
        }

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user: createdUser,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to create user",
        });
    }
};

// =========================
// LOGIN
// =========================
export const login = async (req, res) => {
    try {

        const { email, password } = req.body;
        const normalizedEmail = email?.trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required",
            });
        }

        const { data, error } =
            await supabase.auth.signInWithPassword({
                email: normalizedEmail,
                password,
            });

        if (error) {
            return res.status(401).json({
                success: false,
                message: error.message,
            });
        }

        const { data: dbUser, error: userError } = await supabaseAdmin
            .from("users")
            .select("id, full_name, email, role")
            .eq("auth_user_id", data.user.id)
            .single();

        if (userError) {
            return res.status(401).json({
                success: false,
                message: "User profile not found",
            });
        }

        return res.json({
            success: true,
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            user: {
                id: dbUser.id,
                auth_user_id: data.user.id,
                email: dbUser.email,
                full_name: dbUser.full_name,
                role: dbUser.role,
            },
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: "Unable to login",
        });

    }
};

// =========================
// LOGOUT
// =========================
export const logout = async (req, res) => {

    try {

        const { error } = await supabaseAdmin.auth.admin.signOut(req.accessToken);

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message,
            });
        }

        return res.json({
            success: true,
            message: "Logged out successfully",
        });

    } catch (err) {

        return res.status(500).json({
            success: false,
            message: "Unable to logout",
        });

    }
};
