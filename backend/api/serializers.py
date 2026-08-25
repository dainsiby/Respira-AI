from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import Hospital, UserProfile, Patient, ImagingStudy, AuditLog


class HospitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hospital
        fields = [
            'id',
            'hospital_id',
            'name',
            'address',
            'city',
            'state',
            'country',
            'phone',
            'email',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='')

    class Meta:
        model = UserProfile
        fields = ['role', 'hospital', 'hospital_name', 'is_active', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()
    hospital = HospitalSerializer(source='profile.hospital', read_only=True)
    is_active_status = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'is_active_status', 'role', 'role_display', 'hospital', 'date_joined']

    def get_role(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.role
        return UserProfile.ROLE_DOCTOR

    def get_role_display(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.get_role_display()
        return 'Doctor'

    def get_is_active_status(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.is_active and obj.is_active
        return obj.is_active


class PatientSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='General')

    class Meta:
        model = Patient
        fields = [
            'id',
            'hospital',
            'hospital_name',
            'patient_id',
            'first_name',
            'last_name',
            'date_of_birth',
            'gender',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ImagingStudySerializer(serializers.ModelSerializer):
    patient_name = serializers.SerializerMethodField()
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='')
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True, default='')

    class Meta:
        model = ImagingStudy
        fields = [
            'id',
            'study_id',
            'patient',
            'patient_name',
            'hospital',
            'hospital_name',
            'modality',
            'body_part',
            'status',
            'findings_summary',
            'confidence_score',
            'uploaded_by',
            'uploaded_by_username',
            'reviewed_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        if obj.patient:
            return f"{obj.patient.first_name} {obj.patient.last_name} ({obj.patient.patient_id})"
        return ""


class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True, default='System')
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='Platform')

    class Meta:
        model = AuditLog
        fields = ['id', 'user', 'username', 'hospital', 'hospital_name', 'action', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=False, default=UserProfile.ROLE_HOSPITAL_ADMIN)
    hospital_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_username(self, value):
        cleaned_username = value.strip()
        if not cleaned_username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=cleaned_username).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return cleaned_username

    def create(self, validated_data):
        role = validated_data.pop('role', UserProfile.ROLE_HOSPITAL_ADMIN)
        hospital_id = validated_data.pop('hospital_id', None)

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        hospital = None
        if hospital_id:
            hospital = Hospital.objects.filter(id=hospital_id).first()

        UserProfile.objects.create(
            user=user,
            role=role,
            hospital=hospital
        )

        return user


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=UserProfile.ROLE_CHOICES, required=True)
    hospital_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_username(self, value):
        cleaned_username = value.strip()
        if not cleaned_username:
            raise serializers.ValidationError("Username is required.")
        if User.objects.filter(username__iexact=cleaned_username).exists():
            raise serializers.ValidationError("A user with that username already exists.")
        return cleaned_username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate(self, data):
        username_or_email = data.get('username', '').strip()
        password = data.get('password', '')

        if not username_or_email or not password:
            raise serializers.ValidationError("Both username and password are required.")

        user = authenticate(username=username_or_email, password=password)

        if not user:
            # Try lookup by email if username match failed
            user_obj = User.objects.filter(email__iexact=username_or_email).first()
            if user_obj:
                user = authenticate(username=user_obj.username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid username or password.")

        if not user.is_active:
            raise serializers.ValidationError("User account is disabled.")

        # Ensure user profile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role=UserProfile.ROLE_DOCTOR)
        elif not user.profile.is_active:
            raise serializers.ValidationError("User staff profile is deactivated.")

        data['user'] = user
        return data
