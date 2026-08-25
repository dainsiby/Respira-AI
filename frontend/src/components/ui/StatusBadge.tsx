import React from "react";

interface StatusBadgeProps {
    status: string;
    label?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label }) => {
    const text = label || status;
    const normalized = status.toUpperCase();

    let bg = "#f1f5f9";
    let color = "#475569";

    if (["ACTIVE", "COMPLETED", "SYSTEM_ADMIN", "DOCTOR", "SUCCESS"].includes(normalized)) {
        bg = "#dcfce7";
        color = "#166534";
    } else if (["PENDING", "PROCESSING", "CLINICAL_TECHNICIAN", "IN_REVIEW"].includes(normalized)) {
        bg = "#fef3c7";
        color = "#92400e";
    } else if (["INACTIVE", "FAILED", "DEACTIVATED", "HIGH_RISK"].includes(normalized)) {
        bg = "#fee2e2";
        color = "#991b1b";
    } else if (["HOSPITAL_ADMIN"].includes(normalized)) {
        bg = "#e0e7ff";
        color = "#3730a3";
    }

    return (
        <span style={{
            display: "inline-block",
            fontSize: "0.75rem",
            fontWeight: 700,
            padding: "0.2rem 0.625rem",
            borderRadius: "9999px",
            backgroundColor: bg,
            color: color,
            textTransform: "uppercase",
            letterSpacing: "0.025em"
        }}>
            {text}
        </span>
    );
};

export default StatusBadge;
