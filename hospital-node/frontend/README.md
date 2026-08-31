# RESPIRA AI — Hospital Node Frontend

## Future Responsibility

The `hospital-node/frontend` directory will contain the React + TypeScript clinical web application deployed on local hospital infrastructure.

### Core Dashboards & Interfaces:
- **Hospital Admin Dashboard**: Staff management, local node settings, role assignments, and hospital operational metrics.
- **Doctor Dashboard**: Patient worklists, diagnostic queue, chest X-ray viewer, AI prediction panel, Grad-CAM heatmap overlay, and report generator.
- **Clinical Technician Dashboard**: Patient intake, X-ray scanning upload queue, image quality verification, and study dispatch.
- **Patient Management Views**: Patient records, demographic search, medical history management, and study history.
- **Imaging & Diagnostic Queue**: Live status view of pending, processing, completed, and reviewed imaging studies.
- **AI Analysis & Grad-CAM Visualizer**: Interactive explainable AI viewer presenting pneumonia probabilities and localized lung heatmaps.
- **Clinical Reports**: View, edit, finalize, and export diagnostic reports.
- **Local Model & Training Controls**: Local node status, active model version display, local training triggers, and FL client status.

> [!NOTE]
> This application communicates exclusively with the local Hospital Node backend (`http://localhost:8000` or local hospital intranet). No direct clinical data calls are made to external cloud servers.
