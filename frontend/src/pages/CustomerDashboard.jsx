import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function CustomerDashboard() {
    const { signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate("/login");
    };

    return (
        <div>
            <h1>Customer Dashboard</h1>

            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}

export default CustomerDashboard;