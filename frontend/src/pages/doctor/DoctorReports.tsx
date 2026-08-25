import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { getImagingStudies } from "../../services/api";
import type { ImagingStudy } from "../../types";

export function DoctorReports() {
    const [studies, setStudies] = useState<ImagingStudy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getImagingStudies()
            .then(data => setStudies(data.filter(s => s.status === 'COMPLETED')))
            .catch(err => console.error("Failed to load reports", err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppShell title="Clinical Decision Support Reports">
            <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Generated Clinical AI Reports</h2>
                <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                    Physician review & CDS diagnostic summary documents
                </p>
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "2rem", color: "#64748b" }}>Loading reports...</div>
                ) : studies.length === 0 ? (
                    <div style={{ padding: "2rem", color: "#64748b", textAlign: "center" }}>No completed clinical reports available.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "0.875rem 1rem" }}>Report ID</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Patient</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Modality</th>
                                <th style={{ padding: "0.875rem 1rem" }}>AI Confidence</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Status</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Summary</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studies.map(s => (
                                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#0f172a" }}>REP-{s.study_id}</td>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#1e293b" }}>{s.patient_name}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>{s.modality}</td>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#166534" }}>
                                        {s.confidence_score ? `${(s.confidence_score * 100).toFixed(1)}%` : 'N/A'}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <StatusBadge status="COMPLETED" label="FINAL REPORT" />
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#334155", maxWidth: "300px" }}>
                                        {s.findings_summary}
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

export default DoctorReports;
