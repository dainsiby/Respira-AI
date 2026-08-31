import os
import shutil
import uuid
from pathlib import Path
from django.db import transaction
from django.conf import settings
from api.models import Patient, XRayRequest, ImagingStudy, HospitalAuditLog
from .validator import check_file_stability, validate_image_file
from .metadata import extract_metadata
from .matcher import match_patient_and_request


def log_ingestion_audit(action: str, target_repr: str, details: str):
    try:
        HospitalAuditLog.objects.create(
            user=None,
            action=action,
            target_repr=target_repr,
            details=details
        )
    except Exception:
        pass


def get_storage_dirs() -> tuple[Path, Path, Path, Path]:
    base_storage = Path(settings.BASE_DIR).parent / 'storage'
    incoming = Path(os.getenv('XRAY_INCOMING_DIR', str(base_storage / 'incoming_xrays'))).resolve()
    processed = Path(os.getenv('XRAY_PROCESSED_DIR', str(base_storage / 'processed_xrays'))).resolve()
    failed = Path(os.getenv('XRAY_FAILED_DIR', str(base_storage / 'failed_xrays'))).resolve()
    quarantine = Path(os.getenv('XRAY_QUARANTINE_DIR', str(base_storage / 'quarantine'))).resolve()

    for d in [incoming, processed, failed, quarantine]:
        d.mkdir(parents=True, exist_ok=True)

    return incoming, processed, failed, quarantine


def process_xray_file(file_path: str) -> bool:
    """
    Main ingestion processor pipeline for an incoming X-ray image file.
    Returns: True if study was successfully ingested and marked READY_FOR_AI; False otherwise.
    """
    path = Path(file_path)
    if not path.exists() or path.name.startswith('.'):
        return False

    incoming, processed_dir, failed_dir, quarantine_dir = get_storage_dirs()
    log_ingestion_audit('XRAY_FILE_DETECTED', path.name, f"Detected file in incoming directory")

    # 1. Stability Check
    if not check_file_stability(str(path)):
        # File could not be stabilized or still being written
        return False

    # 2. File Validation
    is_valid, file_format, val_error = validate_image_file(str(path))
    if not is_valid:
        target_path = failed_dir / path.name
        shutil.move(str(path), str(target_path))
        log_ingestion_audit('XRAY_INGESTION_FAILED', path.name, f"Validation failed: {val_error}")
        return False

    # 3. Metadata Extraction
    metadata = extract_metadata(str(path), file_format)

    # 4. Match Patient & XRayRequest
    patient, xray_request, match_error = match_patient_and_request(metadata)
    if not patient or not xray_request:
        target_path = quarantine_dir / path.name
        shutil.move(str(path), str(target_path))
        log_ingestion_audit('XRAY_QUARANTINED', path.name, f"Matching failed: {match_error}")
        return False

    # 5. Duplicate Check
    sop_uid = metadata.get('sop_instance_uid', '')
    if sop_uid and ImagingStudy.objects.filter(sop_instance_uid=sop_uid).exists():
        target_path = quarantine_dir / f"DUP_{path.name}"
        shutil.move(str(path), str(target_path))
        log_ingestion_audit('XRAY_QUARANTINED', path.name, f"Duplicate study detected with SOPInstanceUID '{sop_uid}'")
        return False

    # Check duplicate for demo file
    if not sop_uid and ImagingStudy.objects.filter(patient=patient, original_filename=path.name, xray_request=xray_request).exists():
        target_path = quarantine_dir / f"DUP_{path.name}"
        shutil.move(str(path), str(target_path))
        log_ingestion_audit('XRAY_QUARANTINED', path.name, f"Duplicate study detected for patient '{patient.patient_id}'")
        return False

    # 6. Atomic Relocation & Database Record Creation
    dest_path = processed_dir / f"{patient.patient_id}_{xray_request.request_id}_{path.name}"
    study_id = f"STD-{patient.patient_id}-{uuid.uuid4().hex[:6].upper()}"

    try:
        with transaction.atomic():
            # Move image binary safely to processed_xrays
            shutil.move(str(path), str(dest_path))

            study = ImagingStudy.objects.create(
                study_id=study_id,
                patient=patient,
                xray_request=xray_request,
                file_path=str(dest_path),
                original_filename=path.name,
                file_format=file_format,
                study_instance_uid=metadata.get('study_instance_uid', ''),
                series_instance_uid=metadata.get('series_instance_uid', ''),
                sop_instance_uid=sop_uid,
                modality=metadata.get('modality', 'Chest X-Ray'),
                body_part=metadata.get('body_part', 'Chest'),
                status=ImagingStudy.Status.READY_FOR_AI
            )

            # Update XRayRequest workflow state
            xray_request.status = XRayRequest.Status.ACQUIRED
            xray_request.save()

            log_ingestion_audit('XRAY_INGESTED', study.study_id, f"Successfully ingested study for patient {patient.patient_id}. Status: READY_FOR_AI")
            return True

    except Exception as e:
        # Move back or to failed if transaction/file operation fails
        if dest_path.exists():
            shutil.move(str(dest_path), str(failed_dir / path.name))
        log_ingestion_audit('XRAY_INGESTION_FAILED', path.name, f"Ingestion transaction error: {str(e)}")
        return False
