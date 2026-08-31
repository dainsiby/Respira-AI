# RESPIRA AI — Local X-Ray Ingestion Architecture

## Overview

The `imaging_ingestion` module implements an automated, background-driven X-ray ingestion pipeline for the local Hospital Node.

Rather than requiring manual file uploads through a web browser, the system monitors a local storage folder (`storage/incoming_xrays/`) where hospital X-ray machines or PACS systems save acquired DICOM/PNG images.

---

## Pipeline Workflow

```text
X-Ray Machine / PACS
        │
        ▼ (Saves image binary)
storage/incoming_xrays/
        │
        ▼ (Folder Watcher detects file)
1. File Stability Check (Verifies size is stable and transfer complete)
        │
        ▼
2. Validation (Pydicom / PIL check for pixel integrity and format)
        │
        ▼
3. Metadata Extraction (Parses DICOM PatientID / AccessionNumber)
        │
        ▼
4. Patient & XRayRequest Matcher (Matches local records in respira_hospital)
        │
        ├─────────────────────────────┐ (If invalid or unassigned)
        ▼ (Match Confirmed)           ▼
Move to storage/processed_xrays/  Move to storage/quarantine/ or failed_xrays/
        │
        ▼
Create ImagingStudy (Status: READY_FOR_AI)
        │
        ▼
Update XRayRequest Status (Status: ACQUIRED)
        │
        ▼
Record HospitalAuditLog (XRAY_INGESTED)
```

---

## Supported Formats

* **DICOM (`.dcm`)**: Primary clinical format. Metadata extracted directly from DICOM tags (`PatientID`, `AccessionNumber`, `StudyInstanceUID`, `SOPInstanceUID`).
* **PNG / JPEG (`.png`, `.jpg`, `.jpeg`)**: Development and demonstration formats. Metadata parsed via deterministic filename conventions (e.g. `PAT-1001__XRQ-9001.png`).

---

## Privacy & Safety

* **Zero Cloud Transmission**: All image binaries, DICOM headers, and patient records remain strictly inside the Hospital Node disk storage and local `respira_hospital` database.
* **Fault Tolerance**: The watcher processes files independently inside transaction blocks. Corrupted or invalid files are safely routed to quarantine or failed folders without interrupting background monitoring.
