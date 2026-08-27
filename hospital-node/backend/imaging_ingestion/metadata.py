import re
from pathlib import Path
import pydicom


def extract_metadata(file_path: str, file_format: str) -> dict:
    """
    Extracts clinical and workflow metadata from DICOM attributes or demo filename patterns.
    """
    path = Path(file_path)
    metadata = {
        'original_filename': path.name,
        'file_format': file_format,
        'patient_id': '',
        'request_id': '',
        'study_instance_uid': '',
        'series_instance_uid': '',
        'sop_instance_uid': '',
        'modality': 'Chest X-Ray',
        'body_part': 'Chest',
        'study_date': '',
    }

    if file_format == 'DICOM':
        try:
            dcm = pydicom.dcmread(str(path), stop_before_pixels=True)
            metadata['patient_id'] = str(getattr(dcm, 'PatientID', '')).strip()
            metadata['request_id'] = str(getattr(dcm, 'AccessionNumber', '')).strip()
            metadata['study_instance_uid'] = str(getattr(dcm, 'StudyInstanceUID', '')).strip()
            metadata['series_instance_uid'] = str(getattr(dcm, 'SeriesInstanceUID', '')).strip()
            metadata['sop_instance_uid'] = str(getattr(dcm, 'SOPInstanceUID', '')).strip()
            metadata['modality'] = str(getattr(dcm, 'Modality', 'Chest X-Ray')).strip()
            metadata['body_part'] = str(getattr(dcm, 'BodyPartExamined', 'Chest')).strip()
            metadata['study_date'] = str(getattr(dcm, 'StudyDate', '')).strip()
        except Exception:
            pass

    # Demo PNG/JPEG or DICOM filename fallback parsing
    # Pattern 1: PAT-1001__XRQ-9001.png or PAT-1001_XRQ-9001.png
    # Pattern 2: PAT-1001.png
    filename = path.stem
    if not metadata['patient_id']:
        match_pat = re.search(r'(PAT-[A-Za-z0-9-]+)', filename, re.IGNORECASE)
        if match_pat:
            metadata['patient_id'] = match_pat.group(1).upper()

    if not metadata['request_id']:
        match_req = re.search(r'(XRQ-[A-Za-z0-9-]+)', filename, re.IGNORECASE)
        if match_req:
            metadata['request_id'] = match_req.group(1).upper()

    return metadata
