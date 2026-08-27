# RESPIRA AI — Task 5C Database Separation Specification

> **Infrastructure Principle**: Task 5C separates database infrastructure first. Clinical application migration will occur in later Task 5 phases.

---

## 1. Overview of Database Architecture

To support the privacy-preserving distributed architecture of RESPIRA AI, the PostgreSQL infrastructure is split into two independent database domains:

1. **`respira_cloud`**: Central Cloud Registry & Federation Database
2. **`respira_hospital`**: Local Hospital Node Clinical Database

The baseline application database from Tasks 1–4 (`respira_ai`) is **preserved untouched** to ensure zero breakage of current application features during preparation.

---

## 2. Database Inventory & Status

| Database Name | Status | Purpose | Assigned Scope |
| ------------- | ------ | ------- | -------------- |
| **`respira_ai`** | **PRESERVED** | Baseline Task 1–4 working application database | Current unified prototype baseline |
| **`respira_cloud`** | **CREATED** | Central Cloud management, hospital node registry & FL coordinator | Central Cloud Server |
| **`respira_hospital`** | **CREATED** | Local hospital staff accounts, patient records, X-ray metadata & AI outputs | Local Hospital Node |

---

## 3. Data Ownership & Governance

### A. Cloud Database (`respira_cloud`)
**Purpose**: Serves as the central repository for global system administration and federated learning orchestration.

**Permitted Data**:
- Hospital Registration Profiles (`HospitalRegistry`)
- Registered Node Metadata & API Keys (`HospitalNode`)
- Live Node Status & Heartbeat Logs (`NodeHeartbeat`)
- Global Model Versions & Released Weights Metadata (`GlobalModelVersion`)
- Federated Learning Session & Round Tracking (`FLRound`, `FLParticipant`)
- Operational Cloud Security Audit Logs (`CloudAuditLog`)

> [!CAUTION]
> **Strict Privacy Rule**: The Cloud Database (`respira_cloud`) MUST NOT store patient health records, patient demographics, medical history, raw X-ray image files, or physician notes.

---

### B. Hospital Database (`respira_hospital`)
**Purpose**: Serves as the isolated local database for hospital clinical operations.

**Permitted Data**:
- Local Hospital User Accounts & Profiles (`User`, `UserProfile`)
- Patient Demographics & Health Records (`Patient`)
- Imaging Studies & DICOM/PNG Metadata (`ImagingStudy`)
- Local AI Predictions & Confidence Scores (`AIAnalysis`)
- Grad-CAM Heatmap Image References & Diagnostic Summaries
- Physician Reports
- Local Dataset Curation Indices (`LocalDataset`)
- Local Training Job Logs (`LocalTrainingJob`)
- Local Model Versioning & Weights Registry (`LocalModel`)
- Hospital Security Audit Trail (`HospitalAuditLog`)

---

## 4. Why `respira_ai` Is Preserved

During Task 5C, the baseline database `respira_ai` remains active and configured in `backend/config/settings.py` and `backend/.env`. This guarantees that:
- Existing Task 1–4 Django REST APIs, authentication endpoints, patient management views, and dashboards continue operating without interruption.
- No database tables or data are modified or dropped.
- Database migration to `respira_hospital` and `respira_cloud` will happen sequentially in subsequent Task 5 phases.

---

## 5. Future Migration Sequence

1. **Task 5C (CURRENT)**: Infrastructure creation & connection verification (`respira_cloud`, `respira_hospital`).
2. **Task 5D**: Local Authentication & RBAC isolation setup on Hospital Node.
3. **Task 5E & 5F**: Clinical workflow and X-ray binary storage migration to Hospital Node backend.
4. **Task 5G – 5J**: Local AI Engine, Dataset Manager, and Model Lifecycle integration.
5. **Task 5K – 5M**: Cloud Registry API, Flower FL Server integration, and Node Heartbeat sync.
