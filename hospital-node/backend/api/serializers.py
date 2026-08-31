from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import UserProfile, Role, Patient, MedicalHistory, Appointment, XRayRequest, HospitalAuditLog, ImagingStudy


class UserProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['role', 'role_display', 'is_active', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    is_active_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_active_status', 'role', 'role_display', 'date_joined']

    def get_role(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.role
        return Role.DOCTOR

    def get_role_display(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.get_role_display()
        return 'Doctor'

    def get_is_active_status(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.is_active and obj.is_active
        return obj.is_active


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, attrs):
        username_or_email = attrs.get('username', '').strip()
        password = attrs.get('password', '')

        if not username_or_email or not password:
            raise serializers.ValidationError("Both username and password are required.")

        user = authenticate(username=username_or_email, password=password)

        if not user:
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role=Role.DOCTOR)
        elif not user.profile.is_active:
            raise serializers.ValidationError("User staff profile is deactivated.")

        attrs['user'] = user
        return attrs


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=Role.choices, required=True)

    def validate_username(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=cleaned).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return cleaned

    def validate_role(self, value):
        valid_roles = [choice[0] for choice in Role.choices]
        if value not in valid_roles:
            raise serializers.ValidationError(f"Invalid role. Allowed roles are: {', '.join(valid_roles)}")
        return value


class PatientSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model = Patient
        fields = [
            'id',
            'patient_id',
            'first_name',
            'last_name',
            'date_of_birth',
            'gender',
            'phone',
            'email',
            'address',
            'is_active',
            'created_by',
            'created_by_username',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']

    def validate_patient_id(self, value):
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError("Patient ID is required.")
        # Check uniqueness on creation or change
        instance = getattr(self, 'instance', None)
        qs = Patient.objects.filter(patient_id__iexact=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A patient with this Patient ID already exists in this hospital node.")
        return cleaned


class MedicalHistorySerializer(serializers.ModelSerializer):
    recorded_by_username = serializers.CharField(source='recorded_by.username', read_only=True, default='')

    class Meta:
        model = MedicalHistory
        fields = [
            'id',
            'patient',
            'condition',
            'notes',
            'recorded_by',
            'recorded_by_username',
            'recorded_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'patient', 'recorded_by', 'recorded_at', 'updated_at']


class AppointmentSerializer(serializers.ModelSerializer):
    doctor_username = serializers.CharField(source='doctor.username', read_only=True, default='')
    patient_name = serializers.SerializerMethodField()

    class Meta:
        model = Appointment
        fields = [
            'id',
            'appointment_id',
            'patient',
            'patient_name',
            'doctor',
            'doctor_username',
            'scheduled_at',
            'reason',
            'status',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name} ({obj.patient.patient_id})"
        return ""

    def validate_doctor(self, value):
        if not hasattr(value, 'profile') or value.profile.role != Role.DOCTOR:
            raise serializers.ValidationError("Assigned user must have the DOCTOR role.")
        return value


class XRayRequestSerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    requested_by_username = serializers.CharField(source='requested_by.username', read_only=True, default='')
    assigned_technician_username = serializers.CharField(source='assigned_technician.username', read_only=True, default='')

    class Meta:
        model = XRayRequest
        fields = [
            'id',
            'request_id',
            'patient',
            'patient_name',
            'appointment',
            'requested_by',
            'requested_by_username',
            'assigned_technician',
            'assigned_technician_username',
            'clinical_indication',
            'priority',
            'status',
            'requested_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'requested_by', 'requested_at', 'updated_at']

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name} ({obj.patient.patient_id})"
        return ""

    def validate_assigned_technician(self, value):
        if value is not None:
            if not hasattr(value, 'profile') or value.profile.role not in [Role.CLINICAL_TECHNICIAN, Role.HOSPITAL_ADMIN]:
                raise serializers.ValidationError("Assigned user must be a Clinical Technician.")
        return value

    def validate(self, attrs):
        instance = getattr(self, 'instance', None)
        if instance and 'status' in attrs:
            old_status = instance.status
            new_status = attrs['status']
            if old_status != new_status:
                valid_transitions = {
                    XRayRequest.Status.REQUESTED: [XRayRequest.Status.ASSIGNED, XRayRequest.Status.CANCELLED],
                    XRayRequest.Status.ASSIGNED: [XRayRequest.Status.IN_PROGRESS, XRayRequest.Status.CANCELLED],
                    XRayRequest.Status.IN_PROGRESS: [XRayRequest.Status.ACQUIRED, XRayRequest.Status.CANCELLED],
                    XRayRequest.Status.ACQUIRED: [],
                    XRayRequest.Status.CANCELLED: [],
                }
                allowed = valid_transitions.get(old_status, [])
                if new_status not in allowed:
                    raise serializers.ValidationError({
                        "status": f"Invalid workflow transition from '{old_status}' to '{new_status}'. Allowed transitions: {allowed}"
                    })
        return attrs


class HospitalAuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System')

    class Meta:
        model = HospitalAuditLog
        fields = ['id', 'user', 'username', 'action', 'target_repr', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class ImagingStudySerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    xray_request_id = serializers.CharField(source='xray_request.request_id', read_only=True, default='')

    class Meta:
        model = ImagingStudy
        fields = [
            'id',
            'study_id',
            'patient',
            'patient_name',
            'xray_request',
            'xray_request_id',
            'file_path',
            'original_filename',
            'file_format',
            'study_instance_uid',
            'series_instance_uid',
            'sop_instance_uid',
            'modality',
            'body_part',
            'status',
            'acquired_at',
            'ingested_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'id',
            'study_id',
            'patient',
            'xray_request',
            'file_path',
            'original_filename',
            'file_format',
            'study_instance_uid',
            'series_instance_uid',
            'sop_instance_uid',
            'modality',
            'body_part',
            'status',
            'acquired_at',
            'ingested_at',
            'created_at',
            'updated_at',
        ]

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name} ({obj.patient.patient_id})"
        return ""

