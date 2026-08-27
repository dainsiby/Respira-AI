# RESPIRA AI — Hospital Node Configuration

## Future Responsibility

The `hospital-node/config` directory will contain environment configuration files, node settings templates, and connection parameters.

### Planned Configuration Settings:
- **Hospital Identity**: `HOSPITAL_ID`, `HOSPITAL_NAME`, and hospital registration code.
- **Node Identifier**: `NODE_ID`, unique hardware/instance identifier.
- **Cloud Service URL**: `CLOUD_API_URL` pointing to central RESPIRA AI Cloud services.
- **Node Credentials**: Authentication tokens / TLS certificates for node-to-cloud communications.
- **Local Database Settings**: Connection parameters for local PostgreSQL database (`respira_hospital`).
- **AI Settings**: Batch size, CUDA device assignment, confidence thresholds, and model execution options.
- **Storage Paths**: Paths for local model storage (`/models`), dataset cache (`/datasets`), and X-ray binary storage (`/media/xrays`).
- **Federation Parameters**: FL client port, heartbeat interval, local training epoch limits.

> [!WARNING]
> No production passwords, private keys, or API tokens should be committed to version control. Use `.env.example` templates for configuration management.
