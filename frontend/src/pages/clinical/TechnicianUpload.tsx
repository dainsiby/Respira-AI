import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../../components/ui/AppShell";
import { getPatients, createImagingStudy } from "../../services/api";
import type { Patient } from "../../types";

export function TechnicianUpload() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>("");
    const [modality, setModality] = useState<string>("Chest X-Ray");
    const [bodyPart, setBodyPart] = useState<string>("Chest");
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getPatients()
            .then(data => {
                setPatients(data);
                if (data.length > 0) {
                    setSelectedPatientId(data[0].id.toString());
                }
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatientId) {
            setError("Please select a patient.");
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            await createImagingStudy({
                patient: Number(selectedPatientId),
                modality,
                body_part: bodyPart
            });
            navigate("/clinical/queue");
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to register X-Ray study");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell title="Upload X-Ray Study">
            <div style={{ maxWidth: "560px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "2rem" }}>
                <h3 style={{ margin: "0 0 0.5rem 0", fontSize: "1.25rem", color: "#0f172a" }}>Register & Process X-Ray Imaging Study</h3>
                <p style={{ margin: "0 0 1.5rem 0", color: "#64748b", fontSize: "0.875rem" }}>
                    Select a hospital patient and enter study DICOM metadata for AI feature extraction
                </p>

                {error && (
                    <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "6px", marginBottom: "1.25rem", border: "1px solid #fca5a5" }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>Select Patient *</label>
                        <select
                            value={selectedPatientId}
                            onChange={(e) => setSelectedPatientId(e.target.value)}
                            required
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        >
                            {patients.map(p => (
                                <option key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>Modality *</label>
                        <select
                            value={modality}
                            onChange={(e) => setModality(e.target.value)}
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        >
                            <option value="Chest X-Ray">Chest X-Ray (AP/PA)</option>
                            <option value="Chest CT Scan">Chest CT Scan</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>Anatomical Region *</label>
                        <input
                            type="text"
                            value={bodyPart}
                            onChange={(e) => setBodyPart(e.target.value)}
                            required
                            placeholder="Chest / Pulmonary"
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ padding: "1.25rem", border: "2px dashed #cbd5e1", borderRadius: "8px", backgroundColor: "#f8fafc", textAlign: "center", color: "#64748b" }}>
                        <div style={{ fontSize: "1.5rem", marginBottom: "0.25rem" }}>📤</div>
                        <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "#334155" }}>Demo X-Ray Image / DICOM File Selection</div>
                        <div style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}>(Demo Mode: Synthetic DICOM Metadata Attached Automatically)</div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || patients.length === 0}
                        style={{
                            marginTop: "0.5rem",
                            backgroundColor: submitting ? "#94a3b8" : "#2563eb",
                            color: "#ffffff",
                            padding: "0.75rem",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: submitting ? "not-allowed" : "pointer"
                        }}
                    >
                        {submitting ? "Processing Transmission..." : "Transmit to RESPIRA AI Pipeline"}
                    </button>
                </form>
            </div>
        </AppShell>
    );
}

export default TechnicianUpload;
