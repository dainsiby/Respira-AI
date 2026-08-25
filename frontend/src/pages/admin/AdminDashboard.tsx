import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/ui/AppShell";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { getDashboardMetrics, getAuditLogs } from "../../services/api";
import type { DashboardMetrics, AuditLog } from "../../types";

export function AdminDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, aRes] = await Promise.all([
                    getDashboardMetrics(),
                    getAuditLogs()
                ]);
                setMetrics(mRes);
                setAuditLogs(aRes);
            } catch (err) {
                console.error("Failed to load admin metrics", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <AppShell title="System Administrator Dashboard">
            {loading ? (
                <div style={{ padding: "2rem", color: "#64748b" }}>Loading platform statistics...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Top Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                        <StatCard
                            title="Total Hospitals"
                            value={metrics?.total_hospitals ?? 0}
                            subtitle={`${metrics?.active_hospitals ?? 0} Active Organizations`}
                            icon="🏥"
                            badgeText="Platform"
                            badgeColor="info"
                        />
                        <StatCard
                            title="Platform Users"
                            value={metrics?.total_users ?? 0}
                            subtitle={`${metrics?.active_users ?? 0} Active Staff`}
                            icon="👥"
                            badgeText="All Roles"
                            badgeColor="success"
                        />
                        <StatCard
                            title="Registered Patients"
                            value={metrics?.total_patients ?? 0}
                            subtitle="Across all hospitals"
                            icon="📋"
                            badgeText="PostgreSQL"
                            badgeColor="info"
                        />
                        <StatCard
                            title="System Health"
                            value="100%"
                            subtitle={metrics?.system_status || "All Systems Operational"}
                            icon="⚡"
                            badgeText="HEALTHY"
                            badgeColor="success"
                        />
                    </div>

                    {/* Quick Management Shortcuts */}
                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                        {/* Audit Log Preview */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>Recent System Audit Logs</h3>
                                <Link to="/admin/audit-logs" style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                    View All Logs →
                                </Link>
                            </div>

                            {auditLogs.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>No audit log entries recorded yet.</div>
                            ) : (
                                <div style={{ overflowX: "auto" }}>
                                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                                        <thead>
                                            <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                                                <th style={{ padding: "0.625rem 0.5rem" }}>Timestamp</th>
                                                <th style={{ padding: "0.625rem 0.5rem" }}>User</th>
                                                <th style={{ padding: "0.625rem 0.5rem" }}>Hospital</th>
                                                <th style={{ padding: "0.625rem 0.5rem" }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {auditLogs.slice(0, 5).map((log) => (
                                                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                    <td style={{ padding: "0.75rem 0.5rem", color: "#64748b", fontSize: "0.8125rem" }}>
                                                        {new Date(log.timestamp).toLocaleString()}
                                                    </td>
                                                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#0f172a" }}>
                                                        {log.username}
                                                    </td>
                                                    <td style={{ padding: "0.75rem 0.5rem", color: "#475569" }}>
                                                        {log.hospital_name}
                                                    </td>
                                                    <td style={{ padding: "0.75rem 0.5rem" }}>
                                                        <StatusBadge status={log.action} />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Admin Action Panel */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>System Management</h3>
                            
                            <Link
                                to="/admin/hospitals"
                                style={{
                                    display: "block",
                                    padding: "0.875rem 1rem",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: "#0f172a",
                                    fontWeight: 600
                                }}
                            >
                                🏥 Manage Hospitals →
                            </Link>

                            <Link
                                to="/admin/users"
                                style={{
                                    display: "block",
                                    padding: "0.875rem 1rem",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: "#0f172a",
                                    fontWeight: 600
                                }}
                            >
                                👥 Manage Platform Users →
                            </Link>

                            <Link
                                to="/admin/audit-logs"
                                style={{
                                    display: "block",
                                    padding: "0.875rem 1rem",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: "#0f172a",
                                    fontWeight: 600
                                }}
                            >
                                📜 View Full Audit Trails →
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}

export default AdminDashboard;
