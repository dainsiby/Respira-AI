import AppShell from "../../components/ui/AppShell";
import { useAuth } from "../../context/AuthContext";

export function HospitalSettings() {
    const { hospital } = useAuth();

    return (
        <AppShell title={`Hospital Configuration — ${hospital?.name || 'Hospital'}`}>
            <div style={{ maxWidth: "680px", backgroundColor: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "2rem" }}>
                <h3 style={{ margin: "0 0 1rem 0", fontSize: "1.125rem", color: "#0f172a" }}>Hospital Profile Information</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", fontSize: "0.9375rem" }}>
                    <div>
                        <span style={{ fontWeight: 600, color: "#64748b", display: "block", fontSize: "0.8125rem" }}>HOSPITAL IDENTIFIER</span>
                        <div style={{ color: "#0f172a", fontWeight: 700, marginTop: "0.25rem" }}>{hospital?.hospital_id || 'N/A'}</div>
                    </div>
                    <div>
                        <span style={{ fontWeight: 600, color: "#64748b", display: "block", fontSize: "0.8125rem" }}>HOSPITAL NAME</span>
                        <div style={{ color: "#0f172a", fontWeight: 600, marginTop: "0.25rem" }}>{hospital?.name || 'N/A'}</div>
                    </div>
                    <div>
                        <span style={{ fontWeight: 600, color: "#64748b", display: "block", fontSize: "0.8125rem" }}>ADDRESS & LOCATION</span>
                        <div style={{ color: "#334155", marginTop: "0.25rem" }}>
                            {hospital?.address ? `${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.country}` : 'Default Campus'}
                        </div>
                    </div>
                    <div>
                        <span style={{ fontWeight: 600, color: "#64748b", display: "block", fontSize: "0.8125rem" }}>CONTACT EMAIL</span>
                        <div style={{ color: "#334155", marginTop: "0.25rem" }}>{hospital?.email || 'admin@hospital.org'}</div>
                    </div>
                    <div>
                        <span style={{ fontWeight: 600, color: "#64748b", display: "block", fontSize: "0.8125rem" }}>OPERATIONAL STATUS</span>
                        <div style={{ color: "#166534", fontWeight: 700, marginTop: "0.25rem" }}>Active Authorized Healthcare Facility</div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
}

export default HospitalSettings;
