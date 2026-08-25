import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import StatusBadge from "../../components/ui/StatusBadge";
import Modal from "../../components/ui/Modal";
import { getUsers, createUser, toggleUserActive, getHospitals } from "../../services/api";
import type { User, Hospital, Role } from "../../types";

export function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        role: "DOCTOR" as Role,
        hospital_id: ""
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [uData, hData] = await Promise.all([getUsers(), getHospitals()]);
            setUsers(uData);
            setHospitals(hData);
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to load user list");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            await createUser({
                ...formData,
                hospital_id: formData.hospital_id ? Number(formData.hospital_id) : null
            });
            setIsModalOpen(false);
            setFormData({ username: "", email: "", password: "", first_name: "", last_name: "", role: "DOCTOR", hospital_id: "" });
            fetchData();
        } catch (err: any) {
            setError(err?.response?.data?.error || "Failed to create user account");
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggle = async (userId: number) => {
        try {
            await toggleUserActive(userId);
            fetchData();
        } catch {
            alert("Failed to change user status");
        }
    };

    return (
        <AppShell title="Platform User Management">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Registered Staff Accounts ({users.length})</h2>
                    <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>Platform-wide role-based accounts</p>
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
                    + Add New Staff User
                </button>
            </div>

            {error && (
                <div style={{ backgroundColor: "#fef2f2", color: "#991b1b", padding: "1rem", borderRadius: "6px", marginBottom: "1rem", border: "1px solid #fca5a5" }}>
                    {error}
                </div>
            )}

            <div style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", overflow: "hidden" }}>
                {loading ? (
                    <div style={{ padding: "2rem", color: "#64748b" }}>Loading staff profiles...</div>
                ) : (
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem", textAlign: "left" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#475569" }}>
                                <th style={{ padding: "0.875rem 1rem" }}>Username</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Full Name</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Role</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Hospital</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Status</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                    <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#0f172a" }}>@{u.username}</td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#1e293b" }}>
                                        {u.first_name || u.last_name ? `${u.first_name} ${u.last_name}`.trim() : '—'}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <StatusBadge status={u.role} label={u.role_display} />
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem", color: "#64748b" }}>
                                        {u.hospital ? u.hospital.name : 'System-wide'}
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <StatusBadge status={u.is_active_status ? "ACTIVE" : "INACTIVE"} />
                                    </td>
                                    <td style={{ padding: "0.875rem 1rem" }}>
                                        <button
                                            onClick={() => handleToggle(u.id)}
                                            style={{
                                                backgroundColor: u.is_active_status ? "#fef2f2" : "#f0fdf4",
                                                color: u.is_active_status ? "#991b1b" : "#166534",
                                                border: "1px solid",
                                                borderColor: u.is_active_status ? "#fca5a5" : "#86efac",
                                                padding: "0.375rem 0.75rem",
                                                borderRadius: "4px",
                                                fontWeight: 600,
                                                cursor: "pointer",
                                                fontSize: "0.75rem"
                                            }}
                                        >
                                            {u.is_active_status ? "Deactivate" : "Activate"}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create Staff Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Staff Account">
                <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Username *</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            placeholder="e.g. dr_smith"
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>First Name</label>
                            <input
                                type="text"
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleChange}
                                placeholder="Jane"
                                style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Last Name</label>
                            <input
                                type="text"
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleChange}
                                placeholder="Smith"
                                style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Role *</label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        >
                            <option value="DOCTOR">Doctor</option>
                            <option value="CLINICAL_TECHNICIAN">Clinical Technician</option>
                            <option value="HOSPITAL_ADMIN">Hospital Administrator</option>
                            <option value="SYSTEM_ADMIN">System Administrator</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Assigned Hospital</label>
                        <select
                            name="hospital_id"
                            value={formData.hospital_id}
                            onChange={handleChange}
                            style={{ width: "100%", padding: "0.625rem", borderRadius: "6px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                        >
                            <option value="">None (System-wide)</option>
                            {hospitals.map(h => (
                                <option key={h.id} value={h.id}>{h.name} ({h.hospital_id})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.25rem" }}>Password *</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
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
                        {submitting ? "Creating..." : "Create User Account"}
                    </button>
                </form>
            </Modal>
        </AppShell>
    );
}

export default AdminUsers;
