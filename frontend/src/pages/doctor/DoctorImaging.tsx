import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import { getImagingStudies, processImagingStudy } from "../../services/api";
import type { ImagingStudy } from "../../types";

export function DoctorImaging() {
    const [studies, setStudies] = useState<ImagingStudy[]>([]);
    const [selectedStudy, setSelectedStudy] = useState<ImagingStudy | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [processing, setProcessing] = useState<boolean>(false);

    const fetchStudies = async () => {
        setLoading(true);
        try {
            const data = await getImagingStudies();
            setStudies(data);
            if (data.length > 0 && !selectedStudy) {
                setSelectedStudy(data[0]);
            }
        } catch (err) {
            console.error("Failed to load studies", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudies();
    }, []);

    const handleRunAI = async (studyId: number) => {
        setProcessing(true);
        try {
            const updated = await processImagingStudy(studyId, 'process');
            setSelectedStudy(updated);
            fetchStudies();
        } catch (err) {
            alert("Failed to trigger AI processing");
        } finally {
            setProcessing(false);
        }
    };

    return (
        <AppShell title="Imaging & AI Diagnostic Decision Support">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "1.5rem" }}>
                {/* Studies List */}
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem" }}>
                    <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", color: "#0f172a" }}>Hospital X-Ray Studies</h3>
                    {loading ? (
                        <div style={{ color: "#64748b" }}>Loading studies...</div>
                    ) : studies.length === 0 ? (
                        <div style={{ color: "#64748b" }}>No imaging studies registered.</div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                            {studies.map(s => {
                                const isSelected = selectedStudy?.id === s.id;
                                return (
                                    <div
                                        key={s.id}
                                        onClick={() => setSelectedStudy(s)}
                                        style={{
                                            padding: "1rem",
                                            borderRadius: "8px",
                                            border: "1px solid",
                                            borderColor: isSelected ? "#2563eb" : "#e2e8f0",
                                            backgroundColor: isSelected ? "#eff6ff" : "#f8fafc",
                                            cursor: "pointer",
                                            transition: "all 0.15s"
                                        }}
                                    >
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                            <strong style={{ color: "#0f172a" }}>{s.study_id}</strong>
                                            <StatusBadge status={s.status} />
                                        </div>
                                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>{s.patient_name}</div>
                                        <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.25rem" }}>
                                            Modality: {s.modality} | {new Date(s.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Selected Study AI Viewer */}
                <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1.5rem" }}>
                    {selectedStudy ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "1rem" }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>{selectedStudy.study_id}</h3>
                                    <div style={{ fontSize: "0.875rem", color: "#64748b", marginTop: "0.25rem" }}>
                                        Patient: <strong>{selectedStudy.patient_name}</strong> | Modality: {selectedStudy.modality}
                                    </div>
                                </div>
                                <StatusBadge status={selectedStudy.status} />
                            </div>

                            {/* Demo DICOM / X-Ray Heatmap Placeholder */}
                            <div style={{
                                backgroundColor: "#0f172a",
                                height: "240px",
                                borderRadius: "8px",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "#94a3b8",
                                border: "1px solid #1e293b",
                                padding: "1rem",
                                textAlign: "center"
                            }}>
                                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🩻</div>
                                <div style={{ fontWeight: 600, color: "#f8fafc", fontSize: "0.9375rem" }}>Demo AI Chest X-Ray & Grad-CAM Heatmap Viewer</div>
                                <div style={{ fontSize: "0.75rem", marginTop: "0.25rem", color: "#94a3b8", maxWidth: "340px" }}>
                                    (Demonstration Placeholder: Deep Learning Model Grad-CAM Explainability Visualization)
                                </div>
                            </div>

                            {/* AI Findings Summary */}
                            <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1rem" }}>
                                <div style={{ fontSize: "0.8125rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                                    RESPIRA AI Predictive Findings
                                </div>
                                <p style={{ margin: 0, fontSize: "0.9375rem", color: "#1e293b", lineHeight: 1.5 }}>
                                    {selectedStudy.findings_summary || "Study queued for deep learning feature extraction."}
                                </p>
                                {selectedStudy.confidence_score && (
                                    <div style={{ marginTop: "0.75rem", fontSize: "0.8125rem", color: "#166534", fontWeight: 600 }}>
                                        Model Confidence Score: {(selectedStudy.confidence_score * 100).toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                                <button
                                    onClick={() => handleRunAI(selectedStudy.id)}
                                    disabled={processing || selectedStudy.status === 'COMPLETED'}
                                    style={{
                                        backgroundColor: selectedStudy.status === 'COMPLETED' ? "#94a3b8" : "#2563eb",
                                        color: "#ffffff",
                                        border: "none",
                                        padding: "0.75rem 1.25rem",
                                        borderRadius: "6px",
                                        fontWeight: 600,
                                        cursor: selectedStudy.status === 'COMPLETED' ? "not-allowed" : "pointer"
                                    }}
                                >
                                    {processing ? "Processing AI Model..." : selectedStudy.status === 'COMPLETED' ? "AI Analysis Completed" : "Re-Run AI Analysis"}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ color: "#64748b" }}>Select an imaging study to view AI predictions.</div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}

export default DoctorImaging;
