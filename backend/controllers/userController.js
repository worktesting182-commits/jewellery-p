import { supabaseAdmin } from "../config/supabase.js";

// Get Logged-in User Profile (Combines users table + role profile table address)
export const getProfile = async (req, res) => {
    try {
        const { data: user, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", req.user.id)
            .single();

        if (error || !user) {
            return res.status(404).json({
                success: false,
                message: error?.message || "User profile not found"
            });
        }

        // Fetch address & extra details from role-specific profile table
        const profileTable =
            user.role === "MANUFACTURER"
                ? "manufacturers"
                : user.role === "RETAILER"
                ? "retailers"
                : "customers";

        const { data: profile } = await supabaseAdmin
            .from(profileTable)
            .select("address")
            .eq("user_id", req.user.id)
            .maybeSingle();

        if (profile?.address) {
            user.address = profile.address;
        }

        return res.status(200).json({
            success: true,
            data: user
        });
    } catch (err) {
        console.error("getProfile error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to load profile"
        });
    }
};

// Update Logged-in User Profile (Updates users table + role profile table address)
export const updateProfile = async (req, res) => {
    try {
        const {
            full_name,
            phone,
            address,
            profile_image
        } = req.body;

        // 1. Update basic user fields on `users` table
        const userUpdatePayload = {};
        if (full_name !== undefined) userUpdatePayload.full_name = full_name;
        if (phone !== undefined) userUpdatePayload.phone = phone;
        if (profile_image !== undefined) userUpdatePayload.profile_image = profile_image;

        let updatedUserData = null;

        if (Object.keys(userUpdatePayload).length > 0) {
            const { data, error } = await supabaseAdmin
                .from("users")
                .update(userUpdatePayload)
                .eq("id", req.user.id)
                .select()
                .single();

            if (error) {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }
            updatedUserData = data;
        } else {
            // Fetch current user if no user table fields updated
            const { data } = await supabaseAdmin
                .from("users")
                .select("*")
                .eq("id", req.user.id)
                .single();
            updatedUserData = data;
        }

        // 2. Handle address (update in role profile table: customers / manufacturers / retailers)
        if (address !== undefined && updatedUserData) {
            const userRole = updatedUserData.role || req.user.role;
            const profileTable =
                userRole === "MANUFACTURER"
                    ? "manufacturers"
                    : userRole === "RETAILER"
                    ? "retailers"
                    : "customers";

            const { error: profileError } = await supabaseAdmin
                .from(profileTable)
                .update({ address })
                .eq("user_id", req.user.id);

            if (profileError) {
                // Upsert if row doesn't exist yet
                await supabaseAdmin
                    .from(profileTable)
                    .upsert({ user_id: req.user.id, address }, { onConflict: "user_id" });
            }

            updatedUserData.address = address;
        }

        return res.status(200).json({
            success: true,
            data: updatedUserData
        });
    } catch (err) {
        console.error("updateProfile error:", err);
        return res.status(500).json({
            success: false,
            message: "Unable to update profile"
        });
    }
};

// Get All Users (Admin)
export const getUsers = async (req, res) => {
    try {
        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*");

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to load users"
        });
    }
};

// Get User by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabaseAdmin
            .from("users")
            .select("*")
            .eq("id", id)
            .single();

        if (error) {
            return res.status(404).json({
                success: false,
                message: error.message
            });
        }

        return res.status(200).json({
            success: true,
            data
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Unable to load user"
        });
    }
};
