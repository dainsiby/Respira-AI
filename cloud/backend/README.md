# RESPIRA AI — Cloud Backend

## Future Responsibility

The `cloud/backend` directory will house the central RESPIRA AI Cloud Backend service.

### Core Functions & Responsibilities:
- **Global Hospital Registry**: Master database of all registered partner hospitals and healthcare institutions.
- **Hospital Node Registration & Management**: Registration APIs, authentication, node identity verification, and credentials distribution for distributed Hospital Nodes.
- **Node Heartbeat & Health Monitoring**: Monitoring endpoint for periodic ping signals, telemetry, online/offline status, and node health statistics.
- **Global Model Registry**: Central storage, versioning, metadata management, and download delivery of global AI weights.
- **Federated Learning Round Management**: Orchestration endpoints for FL rounds, participating node selection, and training session status.
- **Cloud Administrative APIs**: Management APIs for System Administrators to onboard hospitals, monitor system status, and manage model releases.
- **Cloud Audit Logging**: Operational event logging for security, compliance, node connection logs, and federation events.

> [!IMPORTANT]
> **Privacy Rule**: This directory must **NOT** contain patient records, medical histories, or X-ray image files. All clinical and patient data must remain strictly isolated inside local Hospital Nodes.
