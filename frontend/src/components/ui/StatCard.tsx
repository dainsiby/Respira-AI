import React from "react";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: string;
    badgeText?: string;
    badgeColor?: "success" | "warning" | "danger" | "info";
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    subtitle,
    icon,
    badgeText,
    badgeColor = "info"
}) => {
    const getBadgeStyle = () => {
        switch (badgeColor) {
            case "success": return { bg: "#dcfce7", color: "#15803d" };
            case "warning": return { bg: "#fef3c7", color: "#b45309" };
            case "danger": return { bg: "#fee2e2", color: "#b91c1c" };
            default: return { bg: "#e0f2fe", color: "#0369a1" };
        }
    };

    const bStyle = getBadgeStyle();

    return (
        <div style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "1.25rem 1.5rem",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between"
        }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#64748b" }}>{title}</span>
                {icon && <span style={{ fontSize: "1.25rem" }}>{icon}</span>}
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
                <span style={{ fontSize: "1.875rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.02em" }}>{value}</span>
                {badgeText && (
                    <span style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        backgroundColor: bStyle.bg,
                        color: bStyle.color,
                        padding: "0.125rem 0.5rem",
                        borderRadius: "9999px"
                    }}>
                        {badgeText}
                    </span>
                )}
            </div>

            {subtitle && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.8125rem", color: "#94a3b8" }}>
                    {subtitle}
                </div>
            )}
        </div>
    );
};

export default StatCard;
