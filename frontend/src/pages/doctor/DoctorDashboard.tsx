import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/ui/AppShell";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { getDashboardMetrics, getPatients, getImagingStudies } from "../../services/api";
import type { DashboardMetrics, Patient, ImagingStudy } from "../../types";

export function DoctorDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [studies, setStudies] = useState<ImagingStudy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, pRes, iRes] = await Promise.all([
                    getDashboardMetrics(),
                    getPatients(),
                    getImagingStudies()
                ]);
                setMetrics(mRes);
                setPatients(pRes);
                setStudies(iRes);
            } catch (err) {
                console.error("Failed to load doctor clinical dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <AppShell title="Physician Clinical Workspace">
            {loading ? (
                <div style={{ padding: "2rem", color: "#64748b" }}>Loading clinical workspace...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Clinical Metrics */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                        <StatCard
                            title="Assigned Patients"
                            value={metrics?.assigned_patients ?? 0}
                            subtitle="Hospital patient roster"
                            icon="📋"
                            badgeText="Roster"
                            badgeColor="info"
                        />
                        <StatCard
                            title="Pending AI Reviews"
                            value={metrics?.pending_reviews ?? 0}
                            subtitle="Queued for diagnostic review"
                            icon="⏳"
                            badgeText="Pending"
                            badgeColor="warning"
                        />
                        <StatCard
                            title="Completed AI Analyses"
                            value={metrics?.completed_ai_analyses ?? 0}
                            subtitle="High-confidence predictions"
                            icon="🩻"
                            badgeText="Processed"
                            badgeColor="success"
                        />
                        <StatCard
                            title="Clinical Alerts"
                            value={metrics?.clinical_alerts ?? 0}
                            subtitle="High risk findings queued"
                            icon="🚨"
                            badgeText="Review"
                            badgeColor="danger"
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                        {/* Imaging Studies Queue */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>X-Ray Imaging & AI Prediction Queue</h3>
                                <Link to="/doctor/imaging" style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                    Open Workspace →
                                </Link>
                            </div>

                            {studies.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>No imaging studies requested yet.</div>
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

                        {/* Recent Patient Roster */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>Patient Roster</h3>
                                <Link to="/doctor/patients" style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                    View All →
                                </Link>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {patients.slice(0, 5).map(p => (
                                    <div key={p.id} style={{ padding: "0.625rem 0.75rem", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                                        <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>{p.first_name} {p.last_name}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.125rem" }}>
                                            ID: {p.patient_id} | DOB: {p.date_of_birth}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppShell>
    );
}

export default DoctorDashboard;
