import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppShell from "../../components/ui/AppShell";
import StatCard from "../../components/ui/StatCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { getDashboardMetrics, getPatients, getUsers } from "../../services/api";
import type { DashboardMetrics, Patient, User } from "../../types";
import { useAuth } from "../../context/AuthContext";

export function HospitalDashboard() {
    const { hospital } = useAuth();
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [recentPatients, setRecentPatients] = useState<Patient[]>([]);
    const [staff, setStaff] = useState<User[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [mRes, pRes, uRes] = await Promise.all([
                    getDashboardMetrics(),
                    getPatients(),
                    getUsers()
                ]);
                setMetrics(mRes);
                setRecentPatients(pRes);
                setStaff(uRes);
            } catch (err) {
                console.error("Failed to load hospital dashboard", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <AppShell title={`${hospital?.name || 'Hospital'} Administrator Dashboard`}>
            {loading ? (
                <div style={{ padding: "2rem", color: "#64748b" }}>Loading hospital metrics...</div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    {/* Stat Cards */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
                        <StatCard
                            title="Total Hospital Patients"
                            value={metrics?.total_patients ?? 0}
                            subtitle="PostgreSQL Hospital Roster"
                            icon="📋"
                            badgeText="Hospital Scope"
                            badgeColor="info"
                        />
                        <StatCard
                            title="Active Doctors"
                            value={metrics?.doctors_count ?? 0}
                            subtitle="Physicians & Specialists"
                            icon="🩺"
                            badgeText="Medical Staff"
                            badgeColor="success"
                        />
                        <StatCard
                            title="Clinical Technicians"
                            value={metrics?.technicians_count ?? 0}
                            subtitle="Imaging & Diagnostics Staff"
                            icon="🩻"
                            badgeText="Imaging Staff"
                            badgeColor="warning"
                        />
                        <StatCard
                            title="Pending Imaging Studies"
                            value={metrics?.pending_imaging ?? 0}
                            subtitle="Queue awaiting processing"
                            icon="⏳"
                            badgeText="Queue"
                            badgeColor="danger"
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.5rem" }}>
                        {/* Recent Patients */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>Hospital Patients</h3>
                                <Link to="/hospital/patients" style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                    Manage Roster →
                                </Link>
                            </div>

                            {recentPatients.length === 0 ? (
                                <div style={{ color: "#64748b", fontSize: "0.875rem" }}>No patient records registered for this hospital.</div>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                                    <thead>
                                        <tr style={{ borderBottom: "2px solid #f1f5f9", color: "#64748b" }}>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Patient ID</th>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Name</th>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Date of Birth</th>
                                            <th style={{ padding: "0.625rem 0.5rem" }}>Gender</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPatients.slice(0, 5).map(p => (
                                            <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                                <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#0f172a" }}>{p.patient_id}</td>
                                                <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600, color: "#1e293b" }}>{p.first_name} {p.last_name}</td>
                                                <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>{p.date_of_birth}</td>
                                                <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>
                                                    {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Staff Roster */}
                        <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "#0f172a" }}>Clinical Staff</h3>
                                <Link to="/hospital/staff" style={{ fontSize: "0.875rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>
                                    Manage Staff →
                                </Link>
                            </div>

                            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                                {staff.slice(0, 5).map(s => (
                                    <div key={s.id} style={{ padding: "0.625rem 0.75rem", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: "0.875rem", color: "#0f172a" }}>
                                                {s.first_name || s.last_name ? `${s.first_name} ${s.last_name}` : s.username}
                                            </div>
                                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>@{s.username}</div>
                                        </div>
                                        <StatusBadge status={s.role} label={s.role_display} />
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

export default HospitalDashboard;
