from api.models import Patient, XRayRequest


def match_patient_and_request(metadata: dict) -> tuple[Patient | None, XRayRequest | None, str]:
    """
    Matches extracted image metadata against local hospital records in respira_hospital.
    Returns: (patient: Patient | None, request: XRayRequest | None, error_reason: str)
    """
    patient_id = metadata.get('patient_id', '').strip()
    request_id = metadata.get('request_id', '').strip()

    if not patient_id:
        return None, None, "Missing Patient ID in file metadata or filename."

    # 1. Look up Patient
    try:
        patient = Patient.objects.get(patient_id__iexact=patient_id, is_active=True)
    except Patient.DoesNotExist:
        return None, None, f"No active Patient found matching Patient ID '{patient_id}'."
    except Patient.MultipleObjectsReturned:
        return None, None, f"Ambiguous match: Multiple patients found with Patient ID '{patient_id}'."

    # 2. Look up XRayRequest
    xray_request = None
    if request_id:
        try:
            xray_request = XRayRequest.objects.get(request_id__iexact=request_id)
        except XRayRequest.DoesNotExist:
            return None, None, f"No XRayRequest found matching Request ID '{request_id}'."

    if not xray_request:
        # Fallback: search active requests for this patient
        active_requests = XRayRequest.objects.filter(
            patient=patient,
            status__in=[
                XRayRequest.Status.REQUESTED,
                XRayRequest.Status.ASSIGNED,
                XRayRequest.Status.IN_PROGRESS
            ]
        ).order_by('requested_at')

        if active_requests.count() == 1:
            xray_request = active_requests.first()
        elif active_requests.count() > 1:
            return None, None, f"Ambiguous match: Patient '{patient_id}' has multiple active XRayRequests."
        else:
            return None, None, f"No pending or active XRayRequest found for Patient '{patient_id}'."

    # 3. Verify Patient <-> Request Alignment
    if xray_request.patient_id != patient.id:
        return None, None, f"Mismatch: XRayRequest '{xray_request.request_id}' belongs to Patient ID '{xray_request.patient.patient_id}', not '{patient.patient_id}'."

    # 4. Check Request Status
    if xray_request.status == XRayRequest.Status.CANCELLED:
        return None, None, f"Workflow conflict: XRayRequest '{xray_request.request_id}' is CANCELLED."

    if xray_request.status == XRayRequest.Status.ACQUIRED:
        # Check if already has an imaging study
        if xray_request.imaging_studies.exists():
            return None, None, f"Workflow conflict: XRayRequest '{xray_request.request_id}' already has an acquired ImagingStudy."

    return patient, xray_request, ""
