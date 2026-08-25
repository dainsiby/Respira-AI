import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface PublicOnlyRouteProps {
    children: React.ReactNode;
}

export const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({ children }) => {
    const { token, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif", color: "#64748b" }}>
                <div>Loading RESPIRA AI session...</div>
            </div>
        );
    }

    if (token) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

export default PublicOnlyRoute;
