import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { getImagingStudies, processImagingStudy } from "../../services/api";
import type { ImagingStudy } from "../../types";

export function TechnicianQueue() {
    const [studies, setStudies] = useState<ImagingStudy[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchStudies = async () => {
        setLoading(true);
        try {
            const data = await getImagingStudies();
            setStudies(data);
        } catch (err) {
            console.error("Failed to load queue", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudies();
    }, []);

    const handleSendToAI = async (studyId: number) => {
        try {
            await processImagingStudy(studyId, 'process');
            fetchStudies();
        } catch {
            alert("Failed to send study to AI processing pipeline");
        }
    };

    return (
        <AppShell title="Imaging Queue & Worklist">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>X-Ray Imaging Worklist Queue ({studies.length})</h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>Manage diagnostic imaging studies & AI processing transmission</p>
                </div>
            </div>

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "2rem", color: "#64748b" }}>Loading worklist queue...</div>
                ) : studies.length === 0 ? (
                    <div style={{ padding: "2rem", color: "#64748b", textAlign: "center" }}>No imaging studies in worklist queue.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "0.875rem 1rem" }}>Study ID</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Patient</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Modality</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Uploaded By</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Status</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {studies.map(s => (
                                <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#0f172a" }}>{s.study_id}</td>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#1e293b" }}>{s.patient_name}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>{s.modality}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>@{s.uploaded_by_username || 'technician'}</td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <StatusBadge status={s.status} />
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        {s.status !== 'COMPLETED' ? (
                                            <button
                                                onClick={() => handleSendToAI(s.id)}
                                                style={{
                                                    backgroundColor: "#2563eb",
                                                    color: "#ffffff",
                                                    border: "none",
                                                    padding: "0.375rem 0.75rem",
                                                    borderRadius: "4px",
                                                    fontSize: "0.75rem",
                                                    fontWeight: 600,
                                                    cursor: "pointer"
                                                }}
                                            >
                                                Transmit to AI Pipeline
                                            </button>
                                        ) : (
                                            <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 600 }}>Sent to Physician</span>
                                        )}
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

export default TechnicianQueue;
