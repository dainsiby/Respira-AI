import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import Modal from "../../components/ui/Modal";
import { getPatients, createPatient } from "../../services/api";
import type { Patient, CreatePatientPayload } from "../../types";
import { useAuth } from "../../context/AuthContext";

export function HospitalPatients() {
    const { hospital } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreatePatientPayload>({
        patient_id: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "M",
    });

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const data = await getPatients();
            setPatients(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load patient records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const payload = {
            ...formData,
            patient_id: formData.patient_id.trim() || `PAT-${Date.now().toString().slice(-4)}`
        };

        try {
            await createPatient(payload);
            setIsModalOpen(false);
            setFormData({ patient_id: "", first_name: "", last_name: "", date_of_birth: "", gender: "M" });
            fetchPatients();
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to register patient");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell title={`Patient Directory — ${hospital?.name || 'Hospital'}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Hospital Patients ({patients.length})</h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>PostgreSQL patient entities isolated for {hospital?.name}</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        border: "none",
                        padding: "0.625rem 1.25rem",
                        borderRadius: "6px",
                        fontWeight: 600,
                        cursor: "pointer"
                    }}
                >
                    + Register New Patient
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #fca5a5" }}>
                    {error}
                </div>
            )}

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "2rem", color: "#64748b" }}>Loading patients from database...</div>
                ) : patients.length === 0 ? (
                    <div style={{ padding: "2rem", color: "#64748b", textAlign: "center" }}>No patients registered yet.</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "0.875rem 1rem" }}>Patient ID</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Full Name</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Date of Birth</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Gender</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Hospital Scope</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map(p => (
                                <tr key={p.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#0f172a" }}>{p.patient_id}</td>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#1e293b" }}>{p.first_name} {p.last_name}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>{p.date_of_birth}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>
                                        {p.gender === 'M' ? 'Male' : p.gender === 'F' ? 'Female' : 'Other'}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#2563eb", fontWeight: 500 }}>
                                        {p.hospital_name || hospital?.name}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Patient Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Patient Record">
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                            Patient ID (Optional - auto-generated if blank)
                        </label>
                        <input
                            type="text"
                            name="patient_id"
                            value={formData.patient_id}
                            onChange={handleChange}
                            placeholder="e.g. PAT-2001"
                            style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>First Name *</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                required
                                placeholder="John"
                                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Last Name *</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                required
                                placeholder="Doe"
                                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Date of Birth *</label>
                            <input
                                type="date"
                                name="date_of_birth"
                                value={formData.date_of_birth}
                                onChange={handleChange}
                                required
                                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Gender *</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                style={{ width: "100%", padding: "0.5rem", borderRadius: "4px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            >
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        style={{
                            marginTop: "0.5rem",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            padding: "0.75rem",
                            border: "none",
                            borderRadius: "6px",
                            fontWeight: 600,
                            cursor: submitting ? "not-allowed" : "pointer"
                        }}
                    >
                        {submitting ? "Registering..." : "Create Patient Record"}
                    </button>
                </form>
            </Modal>
        </AppShell>
    );
}

export default HospitalPatients;
