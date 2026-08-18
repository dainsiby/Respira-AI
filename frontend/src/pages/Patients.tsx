import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPatients, createPatient } from "../services/api";
import type { Patient, CreatePatientPayload } from "../types";


function Patients() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreatePatientPayload>({
        patient_id: "",
        first_name: "",
        last_name: "",
        date_of_birth: "",
        gender: "M",
    });
    const [submitting, setSubmitting] = useState<boolean>(false);

    const fetchPatients = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getPatients();
            setPatients(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || err.message || "Failed to load patients from database");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        setSuccessMsg(null);

        // Simple ID generation if left empty
        const payload = {
            ...formData,
            patient_id: formData.patient_id.trim() || `PAT-${Date.now().toString().slice(-4)}`,
        };

        try {
            const newPatient = await createPatient(payload);
            setSuccessMsg(`Patient ${newPatient.patient_id} (${newPatient.first_name} ${newPatient.last_name}) registered successfully!`);
            setFormData({
                patient_id: "",
                first_name: "",
                last_name: "",
                date_of_birth: "",
                gender: "M",
            });
            fetchPatients();
        } catch (err: any) {
            const serverErrors = err?.response?.data;
            if (serverErrors && typeof serverErrors === "object") {
                const messages = Object.entries(serverErrors)
                    .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(", ") : msgs}`)
                    .join(" | ");
                setError(`Validation Error: ${messages}`);
            } else {
                setError(err.message || "Failed to register patient");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "900px", margin: "0 auto" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "2rem" }}>
                <div>
                    <h1 style={{ margin: 0, color: "#1e293b", fontSize: "1.875rem" }}>Patient Management</h1>
                    <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Database-backed Patient Entity (Django ORM ↔ PostgreSQL)</p>
                </div>
                <Link to="/dashboard" style={{ color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                    ← Back to Dashboard
                </Link>
            </header>

            {error && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "1rem", marginBottom: "1.5rem", color: "#991b1b" }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            {successMsg && (
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", padding: "1rem", marginBottom: "1.5rem", color: "#166534" }}>
                    {successMsg}
                </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
                {/* Patient Registration Form */}
                <section style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", marginTop: 0, color: "#334155" }}>Register New Patient</h2>
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
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

                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>First Name *</label>
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
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Last Name *</label>
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

                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Date of Birth *</label>
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
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>Gender *</label>
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

                        <button
                            type="submit"
                            disabled={submitting}
                            style={{
                                marginTop: "0.5rem",
                                backgroundColor: submitting ? "#94a3b8" : "#2563eb",
                                color: "#ffffff",
                                padding: "0.75rem",
                                border: "none",
                                borderRadius: "6px",
                                fontWeight: 600,
                                cursor: submitting ? "not-allowed" : "pointer",
                            }}
                        >
                            {submitting ? "Registering..." : "Create Patient Record"}
                        </button>
                    </form>
                </section>

                {/* Patient List */}
                <section style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.5rem" }}>
                    <h2 style={{ fontSize: "1.25rem", marginTop: 0, color: "#334155" }}>Stored Patients ({patients.length})</h2>

                    {loading ? (
                        <p style={{ color: "#64748b" }}>Loading patients from PostgreSQL...</p>
                    ) : patients.length === 0 ? (
                        <p style={{ color: "#64748b" }}>No patients registered yet.</p>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "400px", overflowY: "auto" }}>
                            {patients.map((p) => (
                                <div
                                    key={p.id}
                                    style={{
                                        border: "1px solid #cbd5e1",
                                        borderRadius: "6px",
                                        padding: "0.875rem",
                                        backgroundColor: "#f8fafc",
                                    }}
                                >
                                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                                        <strong style={{ color: "#1e293b" }}>{p.first_name} {p.last_name}</strong>
                                        <span style={{ fontSize: "0.75rem", backgroundColor: "#e2e8f0", padding: "0.125rem 0.5rem", borderRadius: "4px", fontWeight: 600, color: "#475569" }}>
                                            {p.patient_id}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: "0.875rem", color: "#64748b" }}>
                                        DOB: {p.date_of_birth} | Gender: {p.gender === "M" ? "Male" : p.gender === "F" ? "Female" : "Other"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}

export default Patients;