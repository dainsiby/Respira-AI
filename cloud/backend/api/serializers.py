import hashlib
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import UserProfile, Role, HospitalRegistry, HospitalNode, HospitalApplication, CloudAuditLog


class UserProfileSerializer(serializers.ModelSerializer):
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = UserProfile
        fields = ['role', 'role_display', 'is_active', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    role_display = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'role', 'role_display', 'date_joined']

    def get_role(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.role
        return Role.SYSTEM_ADMIN

    def get_role_display(self, obj):
        if hasattr(obj, 'profile') and obj.profile:
            return obj.profile.get_role_display()
        return 'System Administrator'


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
            raise serializers.ValidationError("Account disabled.")

        if not hasattr(user, 'profile'):
            UserProfile.objects.create(user=user, role=Role.SYSTEM_ADMIN)

        attrs['user'] = user
        return attrs


class HospitalRegistrationSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)
    hospital_name = serializers.CharField(max_length=255, required=True)
    official_email = serializers.EmailField(required=True)
    phone = serializers.CharField(max_length=50, required=False, allow_blank=True, default='')
    address = serializers.CharField(required=False, allow_blank=True, default='')
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    country = serializers.CharField(max_length=100, required=False, allow_blank=True, default='')
    contact_person = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')

    def validate_username(self, value):
        clean_user = value.strip()
        if User.objects.filter(username__iexact=clean_user).exists():
            raise serializers.ValidationError("A user account with this username already exists.")
        return clean_user

    def validate_official_email(self, value):
        clean_email = value.strip().lower()
        if User.objects.filter(email__iexact=clean_email).exists():
            raise serializers.ValidationError("An account with this email address already exists.")
        return clean_email


class HospitalApplicationSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    applicant_email = serializers.CharField(source='user.email', read_only=True)
    reviewed_by_username = serializers.CharField(source='reviewed_by.username', read_only=True, default='')
    hospital_code = serializers.CharField(source='hospital_registry.hospital_code', read_only=True, default='')

    class Meta:
        model = HospitalApplication
        fields = [
            'id',
            'application_id',
            'user',
            'username',
            'applicant_email',
            'hospital_name',
            'official_email',
            'phone',
            'address',
            'city',
            'state',
            'country',
            'contact_person',
            'status',
            'submitted_at',
            'reviewed_at',
            'reviewed_by',
            'reviewed_by_username',
            'rejection_reason',
            'hospital_registry',
            'hospital_code',
        ]
        read_only_fields = [
            'id', 'application_id', 'user', 'status', 'submitted_at',
            'reviewed_at', 'reviewed_by', 'hospital_registry'
        ]


class HospitalRegistrySerializer(serializers.ModelSerializer):
    node_count = serializers.SerializerMethodField()

    class Meta:
        model = HospitalRegistry
        fields = ['id', 'hospital_code', 'name', 'city', 'country', 'is_active', 'node_count', 'registered_at', 'updated_at']
        read_only_fields = ['id', 'registered_at', 'updated_at']

    def get_node_count(self, obj):
        return obj.nodes.count()

    def validate_hospital_code(self, value):
        cleaned = value.strip().upper()
        if not cleaned:
            raise serializers.ValidationError("Hospital code is required.")
        instance = getattr(self, 'instance', None)
        qs = HospitalRegistry.objects.filter(hospital_code__iexact=cleaned)
        if instance:
            qs = qs.exclude(pk=instance.pk)
        if qs.exists():
            raise serializers.ValidationError("A hospital with this code already exists.")
        return cleaned


class HospitalNodeSerializer(serializers.ModelSerializer):
    hospital_name = serializers.CharField(source='hospital.name', read_only=True, default='')
    hospital_code = serializers.CharField(source='hospital.hospital_code', read_only=True, default='')
    is_online_status = serializers.SerializerMethodField()

    class Meta:
        model = HospitalNode
        fields = [
            'id',
            'node_id',
            'hospital',
            'hospital_code',
            'hospital_name',
            'status',
            'is_online_status',
            'last_heartbeat',
            'installed_version',
            'registered_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'registered_at', 'updated_at']

    def get_is_online_status(self, obj):
        return obj.is_online()


class NodeRegistrationSerializer(serializers.Serializer):
    hospital_code = serializers.CharField(max_length=50, required=True)
    node_id = serializers.CharField(max_length=50, required=True)
    installed_version = serializers.CharField(max_length=50, required=False, default='1.0.0')

    def validate_hospital_code(self, value):
        cleaned = value.strip().upper()
        if not HospitalRegistry.objects.filter(hospital_code__iexact=cleaned, is_active=True).exists():
            raise serializers.ValidationError(f"Registered active hospital '{cleaned}' not found in Cloud Registry.")
        return cleaned

    def validate_node_id(self, value):
        cleaned = value.strip().upper()
        if not cleaned:
            raise serializers.ValidationError("Node ID is required.")
        return cleaned


class NodeHeartbeatSerializer(serializers.Serializer):
    node_id = serializers.CharField(max_length=50, required=True)
    installed_version = serializers.CharField(max_length=50, required=False, default='1.0.0')

    def validate_node_id(self, value):
        cleaned = value.strip().upper()
        if not HospitalNode.objects.filter(node_id__iexact=cleaned).exists():
            raise serializers.ValidationError(f"Hospital Node '{cleaned}' is not registered.")
        return cleaned


class CloudAuditLogSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='actor.username', read_only=True, default='System')
    node_identifier = serializers.CharField(source='node.node_id', read_only=True, default='')

    class Meta:
        model = CloudAuditLog
        fields = ['id', 'actor', 'username', 'node', 'node_identifier', 'action', 'details', 'timestamp']
        read_only_fields = ['id', 'timestamp']
