# RESPIRA AI — Hospital Node Backend

## Future Responsibility

The `hospital-node/backend` directory will contain the Django REST API backend powering local hospital operations.

### Core Functions & Responsibilities:
- **Local Authentication**: Token-based and session authentication for local hospital personnel.
- **Hospital Staff Management**: Account management and Role-Based Access Control (`HOSPITAL_ADMIN`, `DOCTOR`, `CLINICAL_TECHNICIAN`).
- **Patient Management**: Secure local database storage and REST APIs for patient records, medical histories, and appointments.
- **Clinical Workflow**: Intake, diagnostic routing, physician assignment, and review status tracking.
- **Imaging Study Management**: Upload, storage, and retrieval of chest X-ray image binaries (DICOM/PNG) and metadata.
- **AI Analysis Results**: Local persistence of AI predictions, confidence scores, risk categories, and Grad-CAM visual overlays.
- **Clinical Reports**: Generation and archival of diagnostic reports for attending physicians.
- **Local Audit Logging**: Complete security trail of all local user actions, patient access events, and data modifications.
- **Local Model Management APIs**: Internal endpoints connecting clinical UI to local AI inference and model version management.

> [!IMPORTANT]
> All patient demographics, medical records, DICOM/X-ray files, and clinical reports remain strictly isolated inside the local Hospital Node database (`respira_hospital`) and local file storage.
