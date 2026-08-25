import React from "react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "1rem"
        }}>
            <div style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                width: "100%",
                maxWidth: "540px",
                boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                border: "1px solid #e2e8f0",
                overflow: "hidden"
            }}>
                <div style={{
                    padding: "1.25rem 1.5rem",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: "#0f172a" }}>{title}</h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.25rem",
                            fontWeight: 600,
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "0.25rem"
                        }}
                    >
                        ✕
                    </button>
                </div>
                <div style={{ padding: "1.5rem", maxHeight: "80vh", overflowY: "auto" }}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
