import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getTestStatus } from "../services/api";

function Dashboard() {
    const [apiMessage, setApiMessage] = useState<string | null>(null);
    const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        getTestStatus()
            .then((data) => {
                setApiMessage(data.message);
                setStatus("connected");
            })
            .catch((err) => {
                setStatus("error");
                setErrorMessage(err.message || "Failed to connect to Django API");
            });
    }, []);

    return (
        <div style={{ padding: "2rem", fontFamily: "system-ui, sans-serif", maxWidth: "800px", margin: "0 auto" }}>
            <header style={{ borderBottom: "2px solid #e5e7eb", paddingBottom: "1rem", marginBottom: "2rem" }}>
                <h1 style={{ margin: 0, color: "#1e293b", fontSize: "1.875rem" }}>RESPIRA AI — Clinical Decision Platform</h1>
                <p style={{ color: "#64748b", marginTop: "0.25rem" }}>Phase 1 Foundation: Frontend ↔ Backend Integration</p>
            </header>

            <section style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "1.5rem", marginBottom: "2rem" }}>
                <h2 style={{ fontSize: "1.25rem", marginTop: 0, color: "#334155" }}>System Status</h2>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                    <span style={{ fontWeight: 600 }}>Backend API Connection:</span>
                    {status === "loading" && (
                        <span style={{ backgroundColor: "#fef08a", color: "#854d0e", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.875rem" }}>
                            Connecting...
                        </span>
                    )}
                    {status === "connected" && (
                        <span style={{ backgroundColor: "#dcfce7", color: "#166534", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.875rem" }}>
                            Connected (HTTP 200)
                        </span>
                    )}
                    {status === "error" && (
                        <span style={{ backgroundColor: "#fee2e2", color: "#991b1b", padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.875rem" }}>
                            Disconnected
                        </span>
                    )}
                </div>

                {status === "connected" && (
                    <div style={{ backgroundColor: "#ffffff", border: "1px solid #cbd5e1", borderRadius: "6px", padding: "1rem" }}>
                        <strong style={{ color: "#475569", display: "block", fontSize: "0.875rem" }}>Endpoint: GET /api/test/</strong>
                        <code style={{ fontSize: "1rem", color: "#0284c7" }}>Response: "{apiMessage}"</code>
                    </div>
                )}

                {status === "error" && (
                    <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "6px", padding: "1rem", color: "#991b1b" }}>
                        <strong>Connection Error:</strong> {errorMessage}
                    </div>
                )}
            </section>

            <nav style={{ display: "flex", gap: "1rem" }}>
                <Link
                    to="/patients"
                    style={{
                        display: "inline-block",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "6px",
                        textDecoration: "none",
                        fontWeight: 600,
                    }}
                >
                    Manage Patients →
                </Link>
            </nav>
        </div>
    );
}

export default Dashboard;