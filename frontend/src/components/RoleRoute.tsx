import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

interface RoleRouteProps {
    allowedRoles: Role[];
    children: React.ReactNode;
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles, children }) => {
    const { user, token, loading, hasRole, getRoleDefaultRoute } = useAuth();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif", color: "#64748b" }}>
                <div>Verifying clinical credentials...</div>
            </div>
        );
    }

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (!hasRole(allowedRoles)) {
        return (
            <div style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "#f8fafc",
                fontFamily: "system-ui, sans-serif",
                padding: "2rem"
            }}>
                <div style={{
                    maxWidth: "500px",
                    width: "100%",
                    backgroundColor: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "2.5rem",
                    textAlign: "center",
                    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
                }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "64px",
                        height: "64px",
                        borderRadius: "50%",
                        backgroundColor: "#fef2f2",
                        color: "#dc2626",
                        fontSize: "1.75rem",
                        fontWeight: 700,
                        marginBottom: "1rem"
                    }}>
                        !
                    </div>
                    <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "1.5rem", color: "#0f172a" }}>Access Restricted</h1>
                    <p style={{ color: "#64748b", fontSize: "0.9375rem", lineHeight: 1.5, marginBottom: "1.75rem" }}>
                        You do not have permission to access this page. Access is restricted to authorized hospital staff roles ({allowedRoles.join(", ")}).
                    </p>
                    <Link
                        to={getRoleDefaultRoute()}
                        style={{
                            display: "inline-block",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            padding: "0.75rem 1.5rem",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontWeight: 600,
                            fontSize: "0.9375rem"
                        }}
                    >
                        Return to My Clinical Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default RoleRoute;
