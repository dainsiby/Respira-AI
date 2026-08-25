import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
    const { getRoleDefaultRoute } = useAuth();
    return <Navigate to={getRoleDefaultRoute()} replace />;
}

export default Dashboard;