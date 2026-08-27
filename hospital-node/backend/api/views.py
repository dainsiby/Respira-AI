from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User

from .models import (
    UserProfile,
    Role,
    Patient,
    MedicalHistory,
    Appointment,
    XRayRequest,
    HospitalAuditLog,
    ImagingStudy,
)
from .permissions import (
    IsHospitalAdmin,
    IsDoctor,
    IsClinicalTechnician,
    IsDoctorOrTechnician,
    IsHospitalMember,
    get_user_role,
)
from .serializers import (
    UserSerializer,
    LoginSerializer,
    UserCreateSerializer,
    PatientSerializer,
    MedicalHistorySerializer,
    AppointmentSerializer,
    XRayRequestSerializer,
    HospitalAuditLogSerializer,
    ImagingStudySerializer,
)


def log_audit(user, action, target_repr='', details=''):
    try:
        HospitalAuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            action=action,
            target_repr=target_repr,
            details=details
        )
    except Exception:
        pass


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "ok",
        "service": "respira-hospital-node"
    }, status=status.HTTP_200_OK)


# ==================================================
# AUTHENTICATION VIEWS
# ==================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        log_audit(user, 'USER_LOGIN', target_repr=user.username, details='Logged in successfully')
        user_serializer = UserSerializer(user)
        return Response({
            "token": token.key,
            "user": user_serializer.data,
            "message": "Login successful"
        }, status=status.HTTP_200_OK)

    errors = serializer.errors
    error_msg = list(errors.values())[0][0] if errors and isinstance(list(errors.values())[0], list) else "Invalid credentials"
    return Response({"error": error_msg, "details": errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    log_audit(request.user, 'USER_LOGOUT', target_repr=request.user.username, details='Logged out')
    try:
        request.user.auth_token.delete()
    except Exception:
        pass
    return Response({"message": "Successfully logged out"}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    user_serializer = UserSerializer(request.user)
    return Response({"user": user_serializer.data}, status=status.HTTP_200_OK)


# ==================================================
# USER MANAGEMENT VIEWS (HOSPITAL ADMIN ONLY)
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsHospitalAdmin])
def user_list_create(request):
    if request.method == 'GET':
        users = User.objects.all().select_related('profile')
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            req_role = serializer.validated_data['role']
            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data.get('email', ''),
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', '')
            )

            UserProfile.objects.create(
                user=user,
                role=req_role
            )

            log_audit(request.user, 'STAFF_CREATED', target_repr=user.username, details=f"Created staff with role {req_role}")
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsHospitalAdmin])
def user_toggle_active(request, pk):
    try:
        target_user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    new_state = not target_user.is_active
    target_user.is_active = new_state
    target_user.save()

    if hasattr(target_user, 'profile'):
        target_user.profile.is_active = new_state
        target_user.profile.save()

    status_str = "activated" if new_state else "deactivated"
    log_audit(request.user, 'STAFF_STATUS_CHANGE', target_repr=target_user.username, details=f"Staff account {status_str}")
    return Response({
        "message": f"User {target_user.username} {status_str}.",
        "user": UserSerializer(target_user).data
    }, status=status.HTTP_200_OK)


# ==================================================
# PATIENT MANAGEMENT VIEWS
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def patient_list_create(request):
    role = get_user_role(request.user)

    if request.method == 'GET':
        patients = Patient.objects.filter(is_active=True)
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if role == Role.CLINICAL_TECHNICIAN:
            return Response({"error": "Technicians cannot create patient master records."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            patient = serializer.save(created_by=request.user)
            log_audit(request.user, 'PATIENT_CREATED', target_repr=patient.patient_id, details=f"Created patient {patient.first_name} {patient.last_name}")
            return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def patient_detail(request, pk):
    role = get_user_role(request.user)
    try:
        if str(pk).isdigit():
            patient = Patient.objects.get(pk=pk)
        else:
            patient = Patient.objects.get(patient_id=pk)
    except Patient.DoesNotExist:
        return Response({"error": "Patient record not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = PatientSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        if role == Role.CLINICAL_TECHNICIAN:
            return Response({"error": "Technicians cannot update patient master records."}, status=status.HTTP_403_FORBIDDEN)

        serializer = PatientSerializer(patient, data=request.data, partial=(request.method == 'PATCH'))
        if serializer.is_valid():
            patient = serializer.save()
            log_audit(request.user, 'PATIENT_UPDATED', target_repr=patient.patient_id, details=f"Updated patient details")
            return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if role == Role.CLINICAL_TECHNICIAN:
            return Response({"error": "Technicians cannot deactivate patient records."}, status=status.HTTP_403_FORBIDDEN)

        patient.is_active = False
        patient.save()
        log_audit(request.user, 'PATIENT_DEACTIVATED', target_repr=patient.patient_id, details="Soft deactivated patient record")
        return Response({"message": f"Patient {patient.patient_id} deactivated."}, status=status.HTTP_200_OK)


# ==================================================
# MEDICAL HISTORY VIEWS
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def medical_history_list_create(request, patient_pk):
    role = get_user_role(request.user)
    try:
        if str(patient_pk).isdigit():
            patient = Patient.objects.get(pk=patient_pk)
        else:
            patient = Patient.objects.get(patient_id=patient_pk)
    except Patient.DoesNotExist:
        return Response({"error": "Patient record not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        histories = MedicalHistory.objects.filter(patient=patient)
        serializer = MedicalHistorySerializer(histories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if role != Role.DOCTOR and not request.user.is_superuser:
            return Response({"error": "Only attending Doctors can record medical history diagnoses."}, status=status.HTTP_403_FORBIDDEN)

        serializer = MedicalHistorySerializer(data=request.data)
        if serializer.is_valid():
            history = serializer.save(patient=patient, recorded_by=request.user)
            log_audit(request.user, 'MEDICAL_HISTORY_ADDED', target_repr=patient.patient_id, details=f"Recorded condition: {history.condition}")
            return Response(MedicalHistorySerializer(history).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# APPOINTMENT / CONSULTATION VIEWS
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def appointment_list_create(request):
    role = get_user_role(request.user)

    if request.method == 'GET':
        if role == Role.DOCTOR:
            appointments = Appointment.objects.filter(doctor=request.user)
        else:
            appointments = Appointment.objects.all()

        serializer = AppointmentSerializer(appointments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if role == Role.CLINICAL_TECHNICIAN:
            return Response({"error": "Technicians cannot schedule consultations."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        if 'appointment_id' not in data or not data['appointment_id']:
            data['appointment_id'] = f"APT-{Appointment.objects.count() + 101}"

        serializer = AppointmentSerializer(data=data)
        if serializer.is_valid():
            appointment = serializer.save()
            log_audit(request.user, 'APPOINTMENT_CREATED', target_repr=appointment.appointment_id, details=f"Scheduled appointment for patient {appointment.patient.patient_id}")
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def appointment_detail(request, pk):
    role = get_user_role(request.user)
    try:
        appointment = Appointment.objects.get(pk=pk)
    except Appointment.DoesNotExist:
        return Response({"error": "Appointment not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = AppointmentSerializer(appointment)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        if role == Role.CLINICAL_TECHNICIAN:
            return Response({"error": "Technicians cannot update consultation details."}, status=status.HTTP_403_FORBIDDEN)

        serializer = AppointmentSerializer(appointment, data=request.data, partial=True)
        if serializer.is_valid():
            appointment = serializer.save()
            log_audit(request.user, 'APPOINTMENT_UPDATED', target_repr=appointment.appointment_id, details=f"Updated appointment status to {appointment.status}")
            return Response(AppointmentSerializer(appointment).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# X-RAY REQUEST VIEWS (WORKFLOW METADATA)
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def xray_request_list_create(request):
    role = get_user_role(request.user)

    if request.method == 'GET':
        if role == Role.CLINICAL_TECHNICIAN:
            # Technician view queue: all requests
            requests = XRayRequest.objects.all()
        elif role == Role.DOCTOR:
            # Doctor view: requests created by doctor
            requests = XRayRequest.objects.filter(requested_by=request.user)
        else:
            requests = XRayRequest.objects.all()

        serializer = XRayRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if role != Role.DOCTOR and not request.user.is_superuser:
            return Response({"error": "Only attending Doctors can initiate X-ray imaging requests."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        if 'request_id' not in data or not data['request_id']:
            data['request_id'] = f"XRQ-{XRayRequest.objects.count() + 101}"

        serializer = XRayRequestSerializer(data=data)
        if serializer.is_valid():
            xray_req = serializer.save(requested_by=request.user)
            log_audit(request.user, 'XRAY_REQUEST_CREATED', target_repr=xray_req.request_id, details=f"Requested X-ray for patient {xray_req.patient.patient_id}")
            return Response(XRayRequestSerializer(xray_req).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def xray_request_detail(request, pk):
    role = get_user_role(request.user)
    try:
        xray_req = XRayRequest.objects.get(pk=pk)
    except XRayRequest.DoesNotExist:
        return Response({"error": "X-ray request not found."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = XRayRequestSerializer(xray_req)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        serializer = XRayRequestSerializer(xray_req, data=request.data, partial=True)
        if serializer.is_valid():
            updated_req = serializer.save()
            log_audit(request.user, 'XRAY_REQUEST_UPDATED', target_repr=updated_req.request_id, details=f"Updated status to {updated_req.status}")
            return Response(XRayRequestSerializer(updated_req).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# IMAGING STUDY VIEWS (READ-ONLY INGESTED STUDIES)
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def imaging_study_list(request):
    patient_id = request.query_params.get('patient')
    status_param = request.query_params.get('status')

    studies = ImagingStudy.objects.all()
    if patient_id:
        studies = studies.filter(patient__patient_id__iexact=patient_id)
    if status_param:
        studies = studies.filter(status__iexact=status_param)

    serializer = ImagingStudySerializer(studies, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHospitalMember])
def imaging_study_detail(request, pk):
    try:
        if str(pk).isdigit():
            study = ImagingStudy.objects.get(pk=pk)
        else:
            study = ImagingStudy.objects.get(study_id=pk)
    except ImagingStudy.DoesNotExist:
        return Response({"error": "ImagingStudy not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = ImagingStudySerializer(study)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ==================================================
# AUDIT LOG VIEWS
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsHospitalAdmin])
def audit_log_list(request):
    logs = HospitalAuditLog.objects.all()[:50]
    serializer = HospitalAuditLogSerializer(logs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

