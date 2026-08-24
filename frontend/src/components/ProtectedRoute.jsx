import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth();

    const [authorized, setAuthorized] = useState(false);
    const [checkingRole, setCheckingRole] = useState(true);

    useEffect(() => {
        checkRole();
    }, [user]);

    const checkRole = async () => {
        if (!user) {
            setCheckingRole(false);
            return;
        }

        const { data, error } = await supabase
            .from("users")
            .select("role")
            .eq("auth_user_id", user.id)
            .single();

        if (!error && data?.role === allowedRole) {
            setAuthorized(true);
        }

        setCheckingRole(false);
    };

    if (loading || checkingRole) {
        return <h2>Loading...</h2>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!authorized) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;