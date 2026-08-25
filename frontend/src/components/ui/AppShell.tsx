import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface NavItem {
    label: string;
    path: string;
    icon?: string;
}

interface AppShellProps {
    children: React.ReactNode;
    title?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
    const { user, role, hospital, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/login", { replace: true });
    };

    // Role-specific dynamic navigation
    const getNavItems = (): NavItem[] => {
        switch (role) {
            case 'SYSTEM_ADMIN':
                return [
                    { label: 'System Dashboard', path: '/admin/dashboard', icon: '📊' },
                    { label: 'Hospitals', path: '/admin/hospitals', icon: '🏥' },
                    { label: 'Platform Users', path: '/admin/users', icon: '👥' },
                    { label: 'Audit Logs', path: '/admin/audit-logs', icon: '📜' },
                ];
            case 'HOSPITAL_ADMIN':
                return [
                    { label: 'Hospital Dashboard', path: '/hospital/dashboard', icon: '🏥' },
                    { label: 'Patient Directory', path: '/hospital/patients', icon: '📋' },
                    { label: 'Clinical Staff', path: '/hospital/staff', icon: '🧑‍⚕️' },
                    { label: 'Hospital Settings', path: '/hospital/settings', icon: '⚙️' },
                ];
            case 'DOCTOR':
                return [
                    { label: 'Doctor Workspace', path: '/doctor/dashboard', icon: '🩺' },
                    { label: 'Patient Directory', path: '/doctor/patients', icon: '📋' },
                    { label: 'Imaging & AI Analysis', path: '/doctor/imaging', icon: '🩻' },
                    { label: 'Clinical Reports', path: '/doctor/reports', icon: '📄' },
                ];
            case 'CLINICAL_TECHNICIAN':
                return [
                    { label: 'Technician Dashboard', path: '/clinical/dashboard', icon: '🩻' },
                    { label: 'Imaging Queue', path: '/clinical/queue', icon: '⏳' },
                    { label: 'Upload X-Ray Study', path: '/clinical/upload', icon: '📤' },
                    { label: 'Patient Directory', path: '/clinical/patients', icon: '📋' },
                ];
            default:
                return [];
        }
    };

    const navItems = getNavItems();

    const getRoleBadgeColor = () => {
        switch (role) {
            case 'SYSTEM_ADMIN': return { bg: '#fee2e2', color: '#991b1b' };
            case 'HOSPITAL_ADMIN': return { bg: '#e0e7ff', color: '#3730a3' };
            case 'DOCTOR': return { bg: '#dcfce7', color: '#166534' };
            case 'CLINICAL_TECHNICIAN': return { bg: '#fef3c7', color: '#92400e' };
            default: return { bg: '#f1f5f9', color: '#475569' };
        }
    };

    const roleBadge = getRoleBadgeColor();

    return (
        <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            {/* Sidebar */}
            <aside style={{
                width: "240px",
                backgroundColor: "#0f172a",
                color: "#f8fafc",
                display: "flex",
                flexDirection: "column",
                borderRight: "1px solid #1e293b"
            }}>
                {/* Brand */}
                <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "8px",
                        backgroundColor: "#2563eb",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "1rem",
                        color: "#ffffff"
                    }}>
                        R
                    </div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: "1.125rem", letterSpacing: "-0.02em" }}>RESPIRA AI</div>
                        <div style={{ fontSize: "0.6875rem", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Clinical CDS Platform</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav style={{ flex: 1, padding: "1rem 0.75rem" }}>
                    <div style={{ fontSize: "0.6875rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", padding: "0 0.75rem 0.5rem 0.75rem", letterSpacing: "0.05em" }}>
                        Navigation
                    </div>
                    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        {navItems.map((item) => {
                            const isActive = location.pathname === item.path;
                            return (
                                <li key={item.path}>
                                    <Link
                                        to={item.path}
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "0.75rem",
                                            padding: "0.625rem 0.875rem",
                                            borderRadius: "6px",
                                            color: isActive ? "#ffffff" : "#94a3b8",
                                            backgroundColor: isActive ? "#1e293b" : "transparent",
                                            textDecoration: "none",
                                            fontSize: "0.875rem",
                                            fontWeight: isActive ? 600 : 500,
                                            transition: "background-color 0.15s, color 0.15s"
                                        }}
                                    >
                                        <span>{item.icon}</span>
                                        <span>{item.label}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Sidebar Footer - Hospital Identity */}
                <div style={{ padding: "1rem", borderTop: "1px solid #1e293b", backgroundColor: "#0b0f19" }}>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Organization</div>
                    <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#e2e8f0", marginTop: "0.125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {hospital ? hospital.name : "Platform Administration"}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* Header Bar */}
                <header style={{
                    height: "64px",
                    backgroundColor: "#ffffff",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "0 2rem"
                }}>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>
                            {title || "Clinical Dashboard"}
                        </h2>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                        {/* Hospital Tag */}
                        <div style={{ fontSize: "0.8125rem", backgroundColor: "#f1f5f9", padding: "0.375rem 0.75rem", borderRadius: "6px", color: "#334155", fontWeight: 500 }}>
                            🏥 {hospital ? hospital.name : "System-wide"}
                        </div>

                        {/* Role Tag */}
                        <div style={{
                            fontSize: "0.75rem",
                            fontWeight: 700,
                            backgroundColor: roleBadge.bg,
                            color: roleBadge.color,
                            padding: "0.25rem 0.625rem",
                            borderRadius: "9999px",
                            textTransform: "uppercase",
                            letterSpacing: "0.025em"
                        }}>
                            {user?.role_display || role}
                        </div>

                        {/* User Profile */}
                        <div style={{ display: "flex", alignItems: "center", gap: "0.625rem", borderLeft: "1px solid #e2e8f0", paddingLeft: "1.25rem" }}>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#0f172a" }}>
                                    {user?.first_name || user?.last_name ? `${user.first_name} ${user.last_name}`.trim() : user?.username}
                                </div>
                                <div style={{ fontSize: "0.75rem", color: "#64748b" }}>@{user?.username}</div>
                            </div>

                            <button
                                onClick={handleLogout}
                                style={{
                                    backgroundColor: "#ef4444",
                                    color: "#ffffff",
                                    border: "none",
                                    padding: "0.4rem 0.875rem",
                                    borderRadius: "6px",
                                    fontSize: "0.8125rem",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                    marginLeft: "0.5rem"
                                }}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Body Content */}
                <main style={{ flex: 1, padding: "2rem", overflowY: "auto" }}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppShell;
