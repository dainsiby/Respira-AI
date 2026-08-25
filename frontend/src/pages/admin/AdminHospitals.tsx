import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { getHospitals, createHospital, updateHospital } from "../../services/api";
import type { Hospital } from "../../types";

export function AdminHospitals() {
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        hospital_id: "",
        name: "",
        address: "",
        city: "",
        state: "",
        phone: "",
        email: ""
    });

    const fetchHospitals = async () => {
        setLoading(true);
        try {
            const data = await getHospitals();
            setHospitals(data);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load hospital list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHospitals();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        const payload = {
            ...formData,
            hospital_id: formData.hospital_id.trim() || `HOSP-${Date.now().toString().slice(-4)}`
        };

        try {
            await createHospital(payload);
            setIsModalOpen(false);
            setFormData({ hospital_id: "", name: "", address: "", city: "", state: "", phone: "", email: "" });
            fetchHospitals();
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to create hospital record");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (hosp: Hospital) => {
        try {
            await updateHospital(hosp.id, { is_active: !hosp.is_active });
            fetchHospitals();
        } catch (err: any) {
            alert("Failed to update status");
        }
    };

    return (
        <AppShell title="Hospital Management">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Registered Hospitals ({hospitals.length})</h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>Platform multi-tenant hospital registry</p>
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
                    + Register New Hospital
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #fca5a5" }}>
                    {error}
                </div>
            )}

            {/* Hospitals Table */}
            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "2rem", color: "#64748b" }}>Loading hospital records...</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "0.875rem 1rem" }}>Hospital ID</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Hospital Name</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Location</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Contact</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Status</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {hospitals.map(h => (
                                <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#0f172a" }}>{h.hospital_id}</td>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#1e293b" }}>{h.name}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>
                                        {h.city ? `${h.city}, ${h.state}` : h.address || 'N/A'}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>{h.email || h.phone || 'N/A'}</td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <StatusBadge status={h.is_active ? "ACTIVE" : "INACTIVE"} />
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <button
                                            onClick={() => handleToggleStatus(h)}
                                            style={{
                                                backgroundColor: h.is_active ? "#fef2f2" : "#f0fdf4",
                                                color: h.is_active ? "#991b1b" : "#166534",
                                                border: "1px solid",
                                                borderColor: h.is_active ? "#fca5a5" : "#86efac",
                                                padding: "0.375rem 0.75rem",
                                                borderRadius: "4px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                fontSize: "0.75rem"
                                            }}
                                        >
                                            {h.is_active ? "Deactivate" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Add Hospital Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Hospital">
                <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                            Hospital Name *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="e.g. Mount Sinai Medical Center"
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>
                            Hospital Identifier ID
                        </label>
                        <input
                            type="text"
                            name="hospital_id"
                            value={formData.hospital_id}
                            onChange={handleChange}
                            placeholder="Auto-generated if empty (e.g. HOSP-1002)"
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>City</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder="New York"
                                style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>State</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                placeholder="NY"
                                style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Contact Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="admin@hospital.org"
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
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
                        {submitting ? "Registering..." : "Save Hospital Record"}
                    </button>
                </form>
            </Modal>
        </AppShell>
    );
}

export default AdminHospitals;
