import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function RetailerDashboard() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    return (
        <div>
            <h1>Retailer Dashboard</h1>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default RetailerDashboard;