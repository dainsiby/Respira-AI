# RESPIRA AI — Task 5B Architecture Specification

> **Task Status Notice**: Task 5B creates the architectural workspace only. No existing Task 1–4 functionality is migrated or modified.

---

## 1. Executive Summary & Rationale

The RESPIRA AI platform is transitioning from a monolithic prototype to a **privacy-preserving distributed architecture**. 

Hospital clinical data, patient health records, and diagnostic X-ray images are subject to stringent medical privacy regulations (HIPAA, GDPR). Centralizing patient data in a single cloud repository introduces severe security risks, compliance barriers, and data breach vulnerabilities. 

To solve this, Task 5B introduces a formal workspace separation between:
1. **Central Cloud (`cloud/`)**: Global orchestration, node registry, model distribution, and federated learning aggregation.
2. **Hospital Local Node (`hospital-node/`)**: Local clinical application, local database, patient management, local AI inference, and local federated learning client.

---

## 2. Baseline Integrity (Tasks 1–4)

The baseline application built during Tasks 1–4 remains fully intact and operational:
- `backend/`: Original Django REST Framework API, models, and authentication logic.
- `frontend/`: Original React + TypeScript Vite client, routing, and role-based UI dashboards.
- `ai/`: Top-level placeholder directory.

**No code in `backend/`, `frontend/`, or `ai/` has been modified, moved, renamed, or deleted in Task 5B.**

---

## 3. Architectural Separation: Cloud vs. Hospital Node

```text
                    RESPIRA AI CLOUD
                   (Central Control)
                           │
             ┌─────────────┴─────────────┐
             │                           │
        HOSPITAL A                 HOSPITAL B
       LOCAL NODE                  LOCAL NODE
             │                           │
      Local PostgreSQL            Local PostgreSQL
             │                           │
      Local Clinical App          Local Clinical App
             │                           │
         Local AI                    Local AI
             │                           │
       Local Training             Local Training
             │                           │
          FL Client                 FL Client
             └─────────────┬─────────────┘
                           ↓
                    FL Coordinator
                           ↓
                     Global Model
```

### Core Distinction:
* **RESPIRA AI Cloud**: Functions as a central registry and coordinator. It does **not** process patient data.
* **Hospital Node**: Functions as a complete, self-contained clinical ecosystem deployed inside the hospital's local network.

---

## 4. Data Boundaries

### A. Data Kept Exclusively Local (`hospital-node/`)
- Patient personal identification & demographic records.
- Patient medical histories and diagnostic notes.
- Raw DICOM / PNG chest X-ray image files.
- Local AI predictions, clinical risk scores, and Grad-CAM visual heatmaps.
- Physician diagnostic reports.
- Local training dataset indices and preprocessed tensors.
- Local user credentials (`HOSPITAL_ADMIN`, `DOCTOR`, `CLINICAL_TECHNICIAN`).
- Local PostgreSQL database (`respira_hospital`).

### B. Metadata Permitted for Cloud Communication (`cloud/`)
- Hospital registration profile & assigned node ID.
- Node connection state, IP address, software version, and heartbeat pings.
- Global model weights downloads and version telemetry.
- Federated Learning scalar metrics (training loss, epoch accuracy, total sample count).
- Numerical model weight parameter updates (`FedAvg` weight matrices).
- Operational cloud audit events (node registration, FL round completion).

---

## 5. Subsystem Locations

### A. AI Location (`hospital-node/ai/`)
Local AI inference and explainability run **inside the Hospital Node**. The PyTorch ResNet-50 model and Grad-CAM visualizer execute locally on hospital compute hardware, ensuring zero image transmission across external networks.

### B. Federated Learning Location
- **Coordinator (`cloud/federation/`)**: Flower FL Server orchestrating training rounds and aggregating weights via `FedAvg`.
- **Client (`hospital-node/federation/`)**: Flower FL Client executing local epochs on local data and sending numerical weight updates to the coordinator.

### C. Database Separation
- **`respira_cloud`**: Central PostgreSQL database for hospital node registries, model versions, and FL round metadata.
- **`respira_hospital`**: Local PostgreSQL database deployed at each hospital node containing local patient records, imaging studies, and staff profiles.

---

## 6. Task 5 Master Migration Sequence

```text
5A — Repository inspection & Architecture Planning (COMPLETE)
5B — Safe Cloud + Hospital Node Directory Structure Setup (CURRENT — COMPLETE)
5C — Local PostgreSQL & Cloud PostgreSQL Schema Separation
5D — Local Auth & RBAC Isolation on Hospital Node
5E — Local Clinical Workflow Adaptation
5F — Local X-Ray Image Upload & DICOM/PNG Storage
5G — Real PyTorch ResNet-50 AI Inference + Grad-CAM Heatmap Generation
5H — Local Dataset Manager Implementation
5I — Local Model Training Module
5J — Local Model Versioning & Weights Hot-Swapping
5K — Cloud Hospital & Node Registration API
5L — Flower Federated Learning (FL Coordinator + FL Clients)
5M — Model Updater & Node Heartbeat Daemon
5N — Offline Operation & Resilience Verification
5O — End-to-End Multi-Node FL Simulation Testing
5P — Windows Installer Package Generation (FINAL STEP)
```
