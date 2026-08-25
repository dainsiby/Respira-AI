import { useEffect, useState } from "react";
import AppShell from "../../components/ui/AppShell";
import { getPatients } from "../../services/api";
import type { Patient } from "../../types";
import { useAuth } from "../../context/AuthContext";

export function TechnicianPatients() {
    const { hospital } = useAuth();
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        getPatients()
            .then(data => setPatients(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppShell title={`Patient Roster — ${hospital?.name || 'Hospital'}`}>
            <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#0f172a" }}>Hospital Patients ({patients.length})</h2>
                <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>Authorized patient entities for imaging worklist</p>
            </div>

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
                                <th style={{ padding: "0.875rem 1rem" }}>Patient Name</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Date of Birth</th>
                                <th style={{ padding: "0.875rem 1rem" }}>Gender</th>
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AppShell>
    );
}

export default TechnicianPatients;
