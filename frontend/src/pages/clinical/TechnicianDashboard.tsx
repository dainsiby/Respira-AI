import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/ui/AppShell";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { getDashboardMetrics, getImagingStudies } from "../../services/api";
import type { DashboardMetrics, ImagingStudy } from "../../types";

export function TechnicianDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [studies, setStudies] = useState<ImagingStudy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, iRes] = await Promise.all([
                    getDashboardMetrics(),
                    getImagingStudies()
                ]);
                setMetrics(mRes);
                setStudies(iRes);
            } catch (err) {
                console.error("Failed to load technician dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <AppShell title="Clinical Imaging Technician Workspace">
            {loading ? (
                <div style={{ padding: "2rem", color: "#64748b" }}>Loading technician workspace...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                        <StatCard
                            title="Pending X-Ray Requests"
                            value={metrics?.pending_xray_requests ?? 0}
                            subtitle="Awaiting imaging acquisition"
                            icon="⏳"
                            badgeText="Queue"
                            badgeColor="warning"
                        />
                        <StatCard
                            title="Processing Studies"
                            value={metrics?.processing_studies ?? 0}
                            subtitle="AI Feature extraction pipeline"
                            icon="⚡"
                            badgeText="Active"
                            badgeColor="info"
                        />
                        <StatCard
                            title="Completed Studies"
                            value={metrics?.completed_studies ?? 0}
                            subtitle="Transmitted to physician"
                            icon="✅"
                            badgeText="Ready"
                            badgeColor="success"
                        />
                        <StatCard
                            title="Hospital Patients"
                            value={metrics?.total_hospital_patients ?? 0}
                            subtitle="PostgreSQL Roster"
                            icon="📋"
                            badgeText="Roster"
                            badgeColor="info"
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                        {/* Imaging Queue */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>Imaging Queue & Status Worklist</h3>
                                <Link to="/clinical/queue" style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                    Full Queue →
                                </Link>
                            </div>

                            {studies.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>No active imaging studies in queue.</div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Study ID</th>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Patient</th>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Modality</th>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {studies.map(s => (
                                            <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#0f172a" }}>{s.study_id}</td>
                                                <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#1e293b" }}>{s.patient_name}</td>
                                                <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{s.modality}</td>
                                                <td style={{ padding: "0.75rem 0.5rem" }}>
                                                    <StatusBadge status={s.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Quick Action Panel */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>Technician Actions</h3>

                            <Link
                                to="/clinical/upload"
                                style={{
                                    display: "block",
                                    padding: "0.875rem 1rem",
                                    backgroundColor: "#2563eb",
                                    color: "#ffffff",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    fontWeight: 600,
                                    textAlign: "center"
                                }}
                            >
                                📤 Upload X-Ray Study
                            </Link>

                            <Link
                                to="/clinical/queue"
                                style={{
                                    display: "block",
                                    padding: "0.875rem 1rem",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: "#0f172a",
                                    fontWeight: 600,
                                    textAlign: "center"
                                }}
                            >
                                ⏳ Manage Worklist Queue
                            </Link>

                            <Link
                                to="/clinical/patients"
                                style={{
                                    display: "block",
                                    padding: "0.875rem 1rem",
                                    backgroundColor: "#f8fafc",
                                    border: "1px solid #cbd5e1",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    color: "#0f172a",
                                    fontWeight: 600,
                                    textAlign: "center"
                                }}
                            >
                                📋 View Patient Roster
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}

export default TechnicianDashboard;
