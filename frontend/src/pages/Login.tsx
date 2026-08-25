import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Login() {
    const navigate = useNavigate();
    const { login, register } = useAuth();

    const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Form fields
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setErrorMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        // Validation
        if (!username.trim()) {
            setErrorMessage("Username is required.");
            return;
        }

        if (!password) {
            setErrorMessage("Password is required.");
            return;
        }

        if (isRegisterMode) {
            if (password.length < 6) {
                setErrorMessage("Password must be at least 6 characters long.");
                return;
            }
            if (password !== confirmPassword) {
                setErrorMessage("Passwords do not match.");
                return;
            }
        }

        setSubmitting(true);

        try {
            if (isRegisterMode) {
                await register({
                    username: username.trim(),
                    email: email.trim(),
                    password,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                });
            } else {
                await login({
                    username: username.trim(),
                    password,
                });
            }
            navigate("/dashboard", { replace: true });
        } catch (err: any) {
            const backendError =
                err?.response?.data?.error ||
                err?.response?.data?.detail ||
                err?.message ||
                "Authentication failed. Please check your credentials.";
            setErrorMessage(backendError);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#f1f5f9",
            fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            padding: "1.5rem"
        }}>
            <div style={{
                width: "100%",
                maxWidth: "420px",
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                border: "1px solid #e2e8f0",
                padding: "2.5rem 2rem"
            }}>
                <header style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        backgroundColor: "#2563eb",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "1.25rem",
                        marginBottom: "0.75rem"
                    }}>
                        R
                    </div>
                    <h1 style={{ margin: 0, fontSize: "2.125rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
                        RESPIRA AI
                    </h1>
                    <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.9375rem", color: "#64748b", fontWeight: 500 }}>
                        Hospital Clinical Decision Support Platform
                    </p>
                </header>

                {errorMessage && (
                    <div style={{
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fca5a5",
                        color: "#991b1b",
                        padding: "0.875rem 1rem",
                        borderRadius: "8px",
                        fontSize: "0.875rem",
                        marginBottom: "1.5rem",
                        lineHeight: 1.4
                    }}>
                        <strong>Error:</strong> {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.125rem" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>
                            Username {isRegisterMode ? "*" : "or Email"}
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder={isRegisterMode ? "e.g. dr_smith" : "Enter username or email"}
                            required
                            style={{
                                width: "100%",
                                padding: "0.625rem 0.875rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9375rem",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {isRegisterMode && (
                        <>
                            <div>
                                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="doctor@hospital.org"
                                    style={{
                                        width: "100%",
                                        padding: "0.625rem 0.875rem",
                                        borderRadius: "6px",
                                        border: "1px solid #cbd5e1",
                                        fontSize: "0.9375rem",
                                        outline: "none",
                                        boxSizing: "border-box"
                                    }}
                                />
                            </div>

                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={firstName}
                                        onChange={(e) => setFirstName(e.target.value)}
                                        placeholder="Jane"
                                        style={{
                                            width: "100%",
                                            padding: "0.625rem 0.875rem",
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.9375rem",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={lastName}
                                        onChange={(e) => setLastName(e.target.value)}
                                        placeholder="Smith"
                                        style={{
                                            width: "100%",
                                            padding: "0.625rem 0.875rem",
                                            borderRadius: "6px",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.9375rem",
                                            outline: "none",
                                            boxSizing: "border-box"
                                        }}
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>
                            Password *
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            required
                            style={{
                                width: "100%",
                                padding: "0.625rem 0.875rem",
                                borderRadius: "6px",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.9375rem",
                                outline: "none",
                                boxSizing: "border-box"
                            }}
                        />
                    </div>

                    {isRegisterMode && (
                        <div>
                            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.375rem" }}>
                                Confirm Password *
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: "100%",
                                    padding: "0.625rem 0.875rem",
                                    borderRadius: "6px",
                                    border: "1px solid #cbd5e1",
                                    fontSize: "0.9375rem",
                                    outline: "none",
                                    boxSizing: "border-box"
                                }}
                            />
                        </div>
                    )}

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
                            fontSize: "1rem",
                            fontWeight: 600,
                            cursor: submitting ? "not-allowed" : "pointer",
                            transition: "background-color 0.2s"
                        }}
                    >
                        {submitting
                            ? isRegisterMode ? "Creating Account..." : "Authenticating..."
                            : isRegisterMode ? "Register Account" : "Sign In to RESPIRA AI"}
                    </button>
                </form>

                <div style={{ marginTop: "1.75rem", textAlign: "center", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#64748b" }}>
                        {isRegisterMode ? "Already have an account?" : "Don't have a clinician account?"}{" "}
                        <button
                            type="button"
                            onClick={toggleMode}
                            style={{
                                background: "none",
                                border: "none",
                                color: "#2563eb",
                                fontWeight: 600,
                                cursor: "pointer",
                                padding: 0,
                                fontSize: "0.875rem",
                                textDecoration: "underline"
                            }}
                        >
                            {isRegisterMode ? "Sign In" : "Register here"}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;