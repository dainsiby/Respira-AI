import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { getAuditLogs } from "../../services/api";
import type { AuditLog } from "../../types";

export function AdminAuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getAuditLogs()
            .then(data => setLogs(data))
            .catch(err => console.error("Failed to load audit logs", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppShell title="Audit Trails & Platform Activity">
            <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Platform Security Audit Logs</h2>
                <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                    Immutable record of authentication, data access, and clinical operations
                </p>
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "2rem", color: "#64748b" }}>Loading audit records...</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "0.875rem 1rem" }}>Timestamp</th>
                                <th style={{ padding: "0.875rem 1rem" }}>User</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Hospital</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Action</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b", fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#0f172a" }}>
                                        {log.username}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#475569" }}>
                                        {log.hospital_name}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <StatusBadge status={log.action} />
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#334155", maxWidth: "320px" }}>
                                        {log.details || '—'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AppShell>
    );
}

export default AdminAuditLogs;
