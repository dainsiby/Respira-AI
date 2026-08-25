from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.db.models import Count, Q

from .models import Hospital, UserProfile, Patient, ImagingStudy, AuditLog
from .permissions import (
    IsSystemAdmin,
    IsHospitalAdmin,
    IsDoctor,
    IsClinicalTechnician,
    IsDoctorOrTechnician,
    IsHospitalMember,
    get_user_role,
    get_user_hospital,
)
from .serializers import (
    HospitalSerializer,
    UserProfileSerializer,
    UserSerializer,
    PatientSerializer,
    ImagingStudySerializer,
    AuditLogSerializer,
    RegisterSerializer,
    UserCreateSerializer,
    LoginSerializer,
)


def log_audit(user, action, details=''):
    try:
        hospital = get_user_hospital(user)
        AuditLog.objects.create(
            user=user if user and user.is_authenticated else None,
            hospital=hospital,
            action=action,
            details=details
        )
    except Exception:
        pass


@api_view(['GET'])
@permission_classes([AllowAny])
def test_api(request):
    return Response({
        "message": "RESPIRA AI Clinical Platform API is operational"
    }, status=status.HTTP_200_OK)


# ==================================================
# AUTHENTICATION VIEWS
# ==================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        token, _ = Token.objects.get_or_create(user=user)
        log_audit(user, 'USER_REGISTERED', f"User {user.username} registered with role {user.profile.role}")
        user_serializer = UserSerializer(user)
        return Response({
            "token": token.key,
            "user": user_serializer.data,
            "message": "Registration successful"
        }, status=status.HTTP_201_CREATED)

    errors = serializer.errors
    error_msg = list(errors.values())[0][0] if errors and isinstance(list(errors.values())[0], list) else str(errors)
    return Response({"error": error_msg, "details": errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        log_audit(user, 'USER_LOGIN', f"User {user.username} logged in successfully")
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
    log_audit(request.user, 'USER_LOGOUT', f"User {request.user.username} logged out")
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
# DASHBOARD METRICS VIEW (ROLE-SPECIFIC)
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_metrics_view(request):
    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if role == UserProfile.ROLE_SYSTEM_ADMIN:
        metrics = {
            "role": role,
            "total_hospitals": Hospital.objects.count(),
            "active_hospitals": Hospital.objects.filter(is_active=True).count(),
            "total_users": User.objects.count(),
            "active_users": UserProfile.objects.filter(is_active=True, user__is_active=True).count(),
            "total_patients": Patient.objects.count(),
            "system_status": "Operational (All Services Normal)",
            "recent_activity_count": AuditLog.objects.count()
        }
    elif role == UserProfile.ROLE_HOSPITAL_ADMIN:
        h_filter = Q(hospital=hospital) if hospital else Q()
        metrics = {
            "role": role,
            "hospital_name": hospital.name if hospital else "System",
            "total_patients": Patient.objects.filter(h_filter).count(),
            "doctors_count": UserProfile.objects.filter(h_filter, role=UserProfile.ROLE_DOCTOR, is_active=True).count(),
            "technicians_count": UserProfile.objects.filter(h_filter, role=UserProfile.ROLE_CLINICAL_TECHNICIAN, is_active=True).count(),
            "pending_imaging": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_PENDING).count(),
            "completed_analyses": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_COMPLETED).count(),
            "recent_activity_count": AuditLog.objects.filter(h_filter).count()
        }
    elif role == UserProfile.ROLE_DOCTOR:
        h_filter = Q(hospital=hospital) if hospital else Q()
        metrics = {
            "role": role,
            "hospital_name": hospital.name if hospital else "System",
            "assigned_patients": Patient.objects.filter(h_filter).count(),
            "pending_reviews": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_PROCESSING).count(),
            "completed_ai_analyses": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_COMPLETED).count(),
            "reports_ready": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_COMPLETED).count(),
            "clinical_alerts": 2  # Demo alert count
        }
    else:  # CLINICAL_TECHNICIAN
        h_filter = Q(hospital=hospital) if hospital else Q()
        metrics = {
            "role": role,
            "hospital_name": hospital.name if hospital else "System",
            "pending_xray_requests": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_PENDING).count(),
            "processing_studies": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_PROCESSING).count(),
            "completed_studies": ImagingStudy.objects.filter(h_filter, status=ImagingStudy.STATUS_COMPLETED).count(),
            "total_hospital_patients": Patient.objects.filter(h_filter).count()
        }

    return Response(metrics, status=status.HTTP_200_OK)


# ==================================================
# PATIENT MANAGEMENT VIEWS (STRICT HOSPITAL ISOLATION)
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def patient_list_create(request):
    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if request.method == 'GET':
        if role == UserProfile.ROLE_SYSTEM_ADMIN:
            patients = Patient.objects.all()
        else:
            if not hospital:
                return Response([], status=status.HTTP_200_OK)
            patients = Patient.objects.filter(hospital=hospital)

        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = PatientSerializer(data=request.data)
        if serializer.is_valid():
            # Strict hospital assignment backend check
            if role == UserProfile.ROLE_SYSTEM_ADMIN:
                h_id = request.data.get('hospital')
                h_obj = Hospital.objects.filter(id=h_id).first() if h_id else hospital
                patient = serializer.save(hospital=h_obj)
            else:
                patient = serializer.save(hospital=hospital)

            log_audit(request.user, 'PATIENT_CREATED', f"Created patient {patient.patient_id} ({patient.first_name} {patient.last_name})")
            return Response(PatientSerializer(patient).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def patient_detail(request, pk):
    try:
        if str(pk).isdigit():
            patient = Patient.objects.get(pk=pk)
        else:
            patient = Patient.objects.get(patient_id=pk)
    except Patient.DoesNotExist:
        return Response({"error": "Patient record not found"}, status=status.HTTP_404_NOT_FOUND)

    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    # BACKEND HOSPITAL ISOLATION CHECK
    if role != UserProfile.ROLE_SYSTEM_ADMIN and patient.hospital != hospital:
        return Response({"error": "Access restricted to authorized hospital staff."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        serializer = PatientSerializer(patient)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PUT':
        serializer = PatientSerializer(patient, data=request.data, partial=True)
        if serializer.is_valid():
            patient = serializer.save()
            log_audit(request.user, 'PATIENT_UPDATED', f"Updated patient {patient.patient_id}")
            return Response(PatientSerializer(patient).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        patient_id = patient.patient_id
        patient.delete()
        log_audit(request.user, 'PATIENT_DELETED', f"Deleted patient {patient_id}")
        return Response({"message": f"Patient {patient_id} removed"}, status=status.HTTP_200_OK)


# ==================================================
# HOSPITAL MANAGEMENT VIEWS (SYSTEM ADMIN / HOSPITAL ADMIN)
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def hospital_list_create(request):
    role = get_user_role(request.user)
    user_hospital = get_user_hospital(request.user)

    if request.method == 'GET':
        if role == UserProfile.ROLE_SYSTEM_ADMIN:
            hospitals = Hospital.objects.all()
        elif role == UserProfile.ROLE_HOSPITAL_ADMIN and user_hospital:
            hospitals = Hospital.objects.filter(id=user_hospital.id)
        else:
            return Response({"error": "Unauthorized to view hospitals list."}, status=status.HTTP_403_FORBIDDEN)

        serializer = HospitalSerializer(hospitals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        if role != UserProfile.ROLE_SYSTEM_ADMIN:
            return Response({"error": "Only System Administrators can register new hospitals."}, status=status.HTTP_403_FORBIDDEN)

        serializer = HospitalSerializer(data=request.data)
        if serializer.is_valid():
            hosp = serializer.save()
            log_audit(request.user, 'HOSPITAL_CREATED', f"Created hospital {hosp.name} ({hosp.hospital_id})")
            return Response(HospitalSerializer(hosp).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def hospital_detail(request, pk):
    try:
        hospital = Hospital.objects.get(pk=pk)
    except Hospital.DoesNotExist:
        return Response({"error": "Hospital not found"}, status=status.HTTP_404_NOT_FOUND)

    role = get_user_role(request.user)
    user_hospital = get_user_hospital(request.user)

    if role != UserProfile.ROLE_SYSTEM_ADMIN and (not user_hospital or user_hospital.id != hospital.id):
        return Response({"error": "Forbidden: Cannot access other hospital settings."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        return Response(HospitalSerializer(hospital).data, status=status.HTTP_200_OK)

    elif request.method in ['PUT', 'PATCH']:
        if role != UserProfile.ROLE_SYSTEM_ADMIN and role != UserProfile.ROLE_HOSPITAL_ADMIN:
            return Response({"error": "Forbidden: Insufficient privileges."}, status=status.HTTP_403_FORBIDDEN)

        serializer = HospitalSerializer(hospital, data=request.data, partial=True)
        if serializer.is_valid():
            hosp = serializer.save()
            log_audit(request.user, 'HOSPITAL_UPDATED', f"Updated hospital {hosp.name}")
            return Response(HospitalSerializer(hosp).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# USER MANAGEMENT VIEWS (SYSTEM & HOSPITAL ADMIN)
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def user_list_create(request):
    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if role not in [UserProfile.ROLE_SYSTEM_ADMIN, UserProfile.ROLE_HOSPITAL_ADMIN]:
        return Response({"error": "Access restricted to authorized administrative staff."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        if role == UserProfile.ROLE_SYSTEM_ADMIN:
            users = User.objects.all().select_related('profile', 'profile__hospital')
        else:
            users = User.objects.filter(profile__hospital=hospital).select_related('profile', 'profile__hospital')

        serializer = UserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            req_role = serializer.validated_data['role']
            req_hosp_id = serializer.validated_data.get('hospital_id')

            # Permission check: Hospital Admin cannot create System Admin or create users for other hospitals
            if role == UserProfile.ROLE_HOSPITAL_ADMIN:
                if req_role == UserProfile.ROLE_SYSTEM_ADMIN:
                    return Response({"error": "Hospital Administrators cannot create System Administrators."}, status=status.HTTP_403_FORBIDDEN)
                target_hospital = hospital
            else:
                target_hospital = Hospital.objects.filter(id=req_hosp_id).first() if req_hosp_id else None

            user = User.objects.create_user(
                username=serializer.validated_data['username'],
                email=serializer.validated_data.get('email', ''),
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data.get('first_name', ''),
                last_name=serializer.validated_data.get('last_name', '')
            )

            UserProfile.objects.create(
                user=user,
                role=req_role,
                hospital=target_hospital
            )

            log_audit(request.user, 'STAFF_CREATED', f"Created staff user {user.username} ({req_role})")
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_toggle_active(request, pk):
    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if role not in [UserProfile.ROLE_SYSTEM_ADMIN, UserProfile.ROLE_HOSPITAL_ADMIN]:
        return Response({"error": "Unauthorized action."}, status=status.HTTP_403_FORBIDDEN)

    try:
        target_user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response({"error": "User not found."}, status=status.HTTP_404_NOT_FOUND)

    if role == UserProfile.ROLE_HOSPITAL_ADMIN:
        if target_user.profile.hospital != hospital:
            return Response({"error": "Cannot modify staff from another hospital."}, status=status.HTTP_403_FORBIDDEN)

    # Toggle active state
    new_state = not target_user.is_active
    target_user.is_active = new_state
    target_user.save()

    if hasattr(target_user, 'profile'):
        target_user.profile.is_active = new_state
        target_user.profile.save()

    status_str = "activated" if new_state else "deactivated"
    log_audit(request.user, 'USER_STATUS_CHANGE', f"{status_str.capitalize()} user {target_user.username}")
    return Response({"message": f"User {target_user.username} {status_str}.", "user": UserSerializer(target_user).data}, status=status.HTTP_200_OK)


# ==================================================
# IMAGING STUDIES & CLINICAL WORKFLOW VIEWS
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def imaging_list_create(request):
    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if request.method == 'GET':
        if role == UserProfile.ROLE_SYSTEM_ADMIN:
            studies = ImagingStudy.objects.all()
        else:
            if not hospital:
                return Response([], status=status.HTTP_200_OK)
            studies = ImagingStudy.objects.filter(hospital=hospital)

        serializer = ImagingStudySerializer(studies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Technicians and Doctors can upload / register imaging studies
        patient_id = request.data.get('patient')
        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response({"error": "Invalid patient ID"}, status=status.HTTP_400_BAD_REQUEST)

        # Check hospital alignment
        if role != UserProfile.ROLE_SYSTEM_ADMIN and patient.hospital != hospital:
            return Response({"error": "Cannot upload study for another hospital's patient."}, status=status.HTTP_403_FORBIDDEN)

        study_id = request.data.get('study_id') or f"STD-{patient.patient_id}-{ImagingStudy.objects.count() + 101}"
        modality = request.data.get('modality', 'Chest X-Ray')
        body_part = request.data.get('body_part', 'Chest')

        study = ImagingStudy.objects.create(
            study_id=study_id,
            patient=patient,
            hospital=patient.hospital or hospital,
            modality=modality,
            body_part=body_part,
            status=ImagingStudy.STATUS_PROCESSING,
            findings_summary="Demo AI Analysis: Infiltration detected in lower right lobe (Confidence: 89.4%). No acute pneumothorax.",
            confidence_score=0.894,
            uploaded_by=request.user
        )

        log_audit(request.user, 'IMAGING_UPLOADED', f"Uploaded X-ray study {study.study_id} for patient {patient.patient_id}")
        return Response(ImagingStudySerializer(study).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def imaging_detail(request, pk):
    try:
        study = ImagingStudy.objects.get(pk=pk)
    except ImagingStudy.DoesNotExist:
        return Response({"error": "Imaging study not found"}, status=status.HTTP_404_NOT_FOUND)

    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if role != UserProfile.ROLE_SYSTEM_ADMIN and study.hospital != hospital:
        return Response({"error": "Access denied."}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        return Response(ImagingStudySerializer(study).data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Action: process AI or review
        action = request.data.get('action')
        if action == 'process':
            study.status = ImagingStudy.STATUS_COMPLETED
            study.findings_summary = "AI Analysis Completed: Ground-glass opacities identified. Low risk of severe respiratory failure."
            study.confidence_score = 0.942
            study.save()
            log_audit(request.user, 'AI_ANALYSIS_RUN', f"Ran AI processing on study {study.study_id}")
        elif action == 'review':
            study.reviewed_by = request.user
            study.save()
            log_audit(request.user, 'STUDY_REVIEWED', f"Reviewed study {study.study_id}")

        return Response(ImagingStudySerializer(study).data, status=status.HTTP_200_OK)


# ==================================================
# AUDIT LOG VIEWS
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def audit_log_list(request):
    role = get_user_role(request.user)
    hospital = get_user_hospital(request.user)

    if role == UserProfile.ROLE_SYSTEM_ADMIN:
        logs = AuditLog.objects.all()[:50]
    elif role == UserProfile.ROLE_HOSPITAL_ADMIN and hospital:
        logs = AuditLog.objects.filter(hospital=hospital)[:50]
    else:
        return Response({"error": "Unauthorized to access audit logs."}, status=status.HTTP_403_FORBIDDEN)

    serializer = AuditLogSerializer(logs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)