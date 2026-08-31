import secrets
import hashlib
from django.utils import timezone
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

from .models import (
    UserProfile,
    Role,
    HospitalRegistry,
    HospitalNode,
    HospitalApplication,
    CloudAuditLog,
)
from .permissions import IsSystemAdmin, IsCloudHospital
from .serializers import (
    UserSerializer,
    LoginSerializer,
    HospitalRegistrationSerializer,
    HospitalApplicationSerializer,
    HospitalRegistrySerializer,
    HospitalNodeSerializer,
    NodeRegistrationSerializer,
    NodeHeartbeatSerializer,
    CloudAuditLogSerializer,
)


def log_cloud_audit(actor=None, node=None, action='', details=''):
    try:
        CloudAuditLog.objects.create(
            actor=actor if actor and actor.is_authenticated else None,
            node=node,
            action=action,
            details=details
        )
    except Exception:
        pass


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({
        "status": "ok",
        "service": "respira-cloud-platform"
    }, status=status.HTTP_200_OK)


# ==================================================
# CLOUD AUTHENTICATION VIEWS
# ==================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)

        user_role = getattr(user.profile, 'role', Role.SYSTEM_ADMIN) if hasattr(user, 'profile') else Role.SYSTEM_ADMIN
        action_name = 'HOSPITAL_CLOUD_LOGIN' if user_role == Role.HOSPITAL else 'SYSTEM_ADMIN_LOGIN'
        log_cloud_audit(actor=user, action=action_name, details=f"Logged in to Cloud Control Plane ({user_role})")

        user_serializer = UserSerializer(user)
        return Response({
            "token": token.key,
            "user": user_serializer.data,
            "message": "Cloud authentication successful"
        }, status=status.HTTP_200_OK)

    errors = serializer.errors
    error_msg = list(errors.values())[0][0] if errors and isinstance(list(errors.values())[0], list) else "Invalid credentials"
    return Response({"error": error_msg, "details": errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    log_cloud_audit(actor=request.user, action='CLOUD_LOGOUT', details='Logged out from Cloud Control Plane')
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
# PUBLIC HOSPITAL CLOUD REGISTRATION
# ==================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def hospital_registration_view(request):
    serializer = HospitalRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        data = serializer.validated_data

        # 1. Create User with hashed password
        user = User.objects.create_user(
            username=data['username'],
            email=data['official_email'],
            password=data['password']
        )

        # 2. Assign HOSPITAL Cloud Role
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)

        # 3. Generate unique application ID
        app_id = f"APP-{secrets.token_hex(4).upper()}"

        # 4. Create HospitalApplication in PENDING status
        app_obj = HospitalApplication.objects.create(
            application_id=app_id,
            user=user,
            hospital_name=data['hospital_name'],
            official_email=data['official_email'],
            phone=data.get('phone', ''),
            address=data.get('address', ''),
            city=data.get('city', ''),
            state=data.get('state', ''),
            country=data.get('country', ''),
            contact_person=data.get('contact_person', ''),
            status=HospitalApplication.Status.PENDING
        )

        log_cloud_audit(actor=user, action='HOSPITAL_APPLICATION_SUBMITTED', details=f"Submitted onboarding application '{app_id}' for '{app_obj.hospital_name}'")

        return Response({
            "message": "Hospital Cloud onboarding application submitted successfully.",
            "application_id": app_obj.application_id,
            "status": app_obj.status,
            "username": user.username
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# SYSTEM ADMIN APPLICATION MANAGEMENT VIEWS
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def hospital_application_list(request):
    apps = HospitalApplication.objects.all().select_related('user', 'reviewed_by', 'hospital_registry')
    serializer = HospitalApplicationSerializer(apps, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def hospital_application_detail(request, pk):
    try:
        app_obj = HospitalApplication.objects.get(pk=pk)
    except HospitalApplication.DoesNotExist:
        return Response({"error": "Hospital Application not found."}, status=status.HTTP_404_NOT_FOUND)

    serializer = HospitalApplicationSerializer(app_obj)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def hospital_application_approve(request, pk):
    try:
        app_obj = HospitalApplication.objects.get(pk=pk)
    except HospitalApplication.DoesNotExist:
        return Response({"error": "Hospital Application not found."}, status=status.HTTP_404_NOT_FOUND)

    if app_obj.status != HospitalApplication.Status.PENDING:
        return Response({"error": f"Cannot approve application with status '{app_obj.status}'."}, status=status.HTTP_400_BAD_REQUEST)

    # 1. Generate unique hospital code
    code = f"HOSP-{secrets.token_hex(3).upper()}"
    while HospitalRegistry.objects.filter(hospital_code=code).exists():
        code = f"HOSP-{secrets.token_hex(3).upper()}"

    # 2. Create HospitalRegistry entry
    registry = HospitalRegistry.objects.create(
        hospital_code=code,
        name=app_obj.hospital_name,
        city=app_obj.city,
        country=app_obj.country,
        is_active=True
    )

    # 3. Update application status
    app_obj.status = HospitalApplication.Status.APPROVED
    app_obj.reviewed_by = request.user
    app_obj.reviewed_at = timezone.now()
    app_obj.hospital_registry = registry
    app_obj.save()

    log_cloud_audit(actor=request.user, action='HOSPITAL_APPLICATION_APPROVED', details=f"Approved application '{app_obj.application_id}' for '{app_obj.hospital_name}' [Code: {code}]")

    return Response({
        "message": f"Hospital application '{app_obj.application_id}' approved successfully.",
        "hospital_code": code,
        "application": HospitalApplicationSerializer(app_obj).data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def hospital_application_reject(request, pk):
    try:
        app_obj = HospitalApplication.objects.get(pk=pk)
    except HospitalApplication.DoesNotExist:
        return Response({"error": "Hospital Application not found."}, status=status.HTTP_404_NOT_FOUND)

    if app_obj.status != HospitalApplication.Status.PENDING:
        return Response({"error": f"Cannot reject application with status '{app_obj.status}'."}, status=status.HTTP_400_BAD_REQUEST)

    reason = request.data.get('rejection_reason', 'Application rejected by System Administrator.').strip()

    app_obj.status = HospitalApplication.Status.REJECTED
    app_obj.reviewed_by = request.user
    app_obj.reviewed_at = timezone.now()
    app_obj.rejection_reason = reason
    app_obj.save()

    log_cloud_audit(actor=request.user, action='HOSPITAL_APPLICATION_REJECTED', details=f"Rejected application '{app_obj.application_id}' for '{app_obj.hospital_name}'. Reason: {reason}")

    return Response({
        "message": f"Hospital application '{app_obj.application_id}' rejected.",
        "application": HospitalApplicationSerializer(app_obj).data
    }, status=status.HTTP_200_OK)


# ==================================================
# HOSPITAL CLOUD PORTAL VIEWS
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCloudHospital])
def hospital_portal_profile(request):
    user = request.user
    app_obj = getattr(user, 'hospital_application', None)
    return Response({
        "username": user.username,
        "email": user.email,
        "role": user.profile.role,
        "has_application": app_obj is not None,
        "application_status": app_obj.status if app_obj else "NONE",
        "hospital_code": app_obj.hospital_registry.hospital_code if app_obj and app_obj.hospital_registry else None
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCloudHospital])
def hospital_portal_application(request):
    user = request.user
    app_obj = getattr(user, 'hospital_application', None)
    if not app_obj:
        return Response({"error": "No hospital onboarding application found for this account."}, status=status.HTTP_404_NOT_FOUND)
    serializer = HospitalApplicationSerializer(app_obj)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCloudHospital])
def hospital_portal_nodes(request):
    user = request.user
    app_obj = getattr(user, 'hospital_application', None)
    if not app_obj or not app_obj.hospital_registry:
        return Response([], status=status.HTTP_200_OK)
    nodes = HospitalNode.objects.filter(hospital=app_obj.hospital_registry)
    serializer = HospitalNodeSerializer(nodes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated, IsCloudHospital])
def hospital_portal_installer(request):
    user = request.user
    app_obj = getattr(user, 'hospital_application', None)
    is_approved = app_obj is not None and app_obj.status == HospitalApplication.Status.APPROVED
    return Response({
        "eligible": is_approved,
        "available": False,
        "message": "Hospital Node installer will be available in Task 5P."
    }, status=status.HTTP_200_OK)


# ==================================================
# CLOUD OPERATIONAL DASHBOARD
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def cloud_dashboard(request):
    hospitals_count = HospitalRegistry.objects.count()
    active_hospitals = HospitalRegistry.objects.filter(is_active=True).count()
    nodes = HospitalNode.objects.all()
    pending_applications = HospitalApplication.objects.filter(status=HospitalApplication.Status.PENDING).count()

    online_nodes = 0
    offline_nodes = 0
    disabled_nodes = 0

    for n in nodes:
        if n.status == HospitalNode.Status.DISABLED:
            disabled_nodes += 1
        elif n.is_online():
            online_nodes += 1
        else:
            offline_nodes += 1

    return Response({
        "registered_hospitals": hospitals_count,
        "active_hospitals": active_hospitals,
        "pending_applications": pending_applications,
        "total_nodes": nodes.count(),
        "online_nodes": online_nodes,
        "offline_nodes": offline_nodes,
        "disabled_nodes": disabled_nodes,
        "system_status": "OPERATIONAL"
    }, status=status.HTTP_200_OK)


# ==================================================
# HOSPITAL REGISTRY VIEWS
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def hospital_list_create(request):
    if request.method == 'GET':
        hospitals = HospitalRegistry.objects.all()
        serializer = HospitalRegistrySerializer(hospitals, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = HospitalRegistrySerializer(data=request.data)
        if serializer.is_valid():
            hosp = serializer.save()
            log_cloud_audit(actor=request.user, action='HOSPITAL_REGISTERED', details=f"Registered hospital [{hosp.hospital_code}] {hosp.name}")
            return Response(HospitalRegistrySerializer(hosp).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def hospital_detail(request, pk):
    try:
        if str(pk).isdigit():
            hosp = HospitalRegistry.objects.get(pk=pk)
        else:
            hosp = HospitalRegistry.objects.get(hospital_code__iexact=pk)
    except HospitalRegistry.DoesNotExist:
        return Response({"error": "Hospital not found in registry."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = HospitalRegistrySerializer(hosp)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        serializer = HospitalRegistrySerializer(hosp, data=request.data, partial=True)
        if serializer.is_valid():
            hosp = serializer.save()
            log_cloud_audit(actor=request.user, action='HOSPITAL_UPDATED', details=f"Updated hospital [{hosp.hospital_code}] parameters")
            return Response(HospitalRegistrySerializer(hosp).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# HOSPITAL NODE REGISTRY VIEWS
# ==================================================

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def node_list_create(request):
    if request.method == 'GET':
        nodes = HospitalNode.objects.all().select_related('hospital')
        serializer = HospitalNodeSerializer(nodes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        serializer = HospitalNodeSerializer(data=request.data)
        if serializer.is_valid():
            node = serializer.save()
            log_cloud_audit(actor=request.user, node=node, action='NODE_REGISTERED', details=f"Registered node {node.node_id} for hospital [{node.hospital.hospital_code}]")
            return Response(HospitalNodeSerializer(node).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def node_detail(request, pk):
    try:
        if str(pk).isdigit():
            node = HospitalNode.objects.get(pk=pk)
        else:
            node = HospitalNode.objects.get(node_id__iexact=pk)
    except HospitalNode.DoesNotExist:
        return Response({"error": "Hospital Node not found in registry."}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = HospitalNodeSerializer(node)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'PATCH':
        serializer = HospitalNodeSerializer(node, data=request.data, partial=True)
        if serializer.is_valid():
            node = serializer.save()
            log_cloud_audit(actor=request.user, node=node, action='NODE_STATUS_CHANGE', details=f"Updated node {node.node_id} status to {node.status}")
            return Response(HospitalNodeSerializer(node).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# NODE REGISTRATION FOUNDATION (INTER-SERVICE ENDPOINT)
# ==================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def node_register_view(request):
    serializer = NodeRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        hosp_code = serializer.validated_data['hospital_code']
        node_id = serializer.validated_data['node_id']
        version = serializer.validated_data.get('installed_version', '1.0.0')

        hospital = HospitalRegistry.objects.get(hospital_code__iexact=hosp_code)

        raw_token = secrets.token_hex(32)
        token_hash = hashlib.sha256(raw_token.encode('utf-8')).hexdigest()

        node, created = HospitalNode.objects.update_or_create(
            node_id=node_id,
            defaults={
                'hospital': hospital,
                'api_key_hash': token_hash,
                'status': HospitalNode.Status.ONLINE,
                'last_heartbeat': timezone.now(),
                'installed_version': version,
            }
        )

        action_str = 'NODE_REGISTERED' if created else 'NODE_RE_REGISTERED'
        log_cloud_audit(node=node, action=action_str, details=f"Node {node_id} registered securely for hospital {hosp_code}")

        return Response({
            "message": f"Hospital Node '{node_id}' registered successfully.",
            "node_id": node.node_id,
            "hospital_code": hospital.hospital_code,
            "node_credentials": {
                "node_token": raw_token
            },
            "status": node.status
        }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# NODE HEARTBEAT ENDPOINT
# ==================================================

@api_view(['POST'])
@permission_classes([AllowAny])
def node_heartbeat_view(request):
    serializer = NodeHeartbeatSerializer(data=request.data)
    if serializer.is_valid():
        node_id = serializer.validated_data['node_id']
        version = serializer.validated_data.get('installed_version', '1.0.0')

        node = HospitalNode.objects.get(node_id__iexact=node_id)

        if node.api_key_hash:
            token = request.headers.get('X-Node-Token') or ''
            if not token and 'Authorization' in request.headers:
                auth_val = request.headers.get('Authorization', '')
                if auth_val.startswith('NodeToken '):
                    token = auth_val.split('NodeToken ')[-1].strip()

            if token:
                token_hash = hashlib.sha256(token.encode('utf-8')).hexdigest()
                if token_hash != node.api_key_hash:
                    return Response({"error": "Invalid node authentication token."}, status=status.HTTP_401_UNAUTHORIZED)
            else:
                return Response({"error": "Node authentication token required in header ('X-Node-Token')."}, status=status.HTTP_401_UNAUTHORIZED)

        if node.status == HospitalNode.Status.DISABLED:
            log_cloud_audit(node=node, action='REJECTED_HEARTBEAT', details=f"Heartbeat rejected for disabled node {node_id}")
            return Response({
                "error": "Hospital Node is administratively disabled by System Administrator.",
                "node_id": node.node_id,
                "node_status": node.status
            }, status=status.HTTP_403_FORBIDDEN)

        node.last_heartbeat = timezone.now()
        node.installed_version = version
        node.status = HospitalNode.Status.ONLINE
        node.save()

        log_cloud_audit(node=node, action='NODE_HEARTBEAT', details=f"Received heartbeat from node {node_id} (v{version})")

        return Response({
            "status": "ok",
            "node_id": node.node_id,
            "node_status": node.status,
            "last_heartbeat": node.last_heartbeat.isoformat()
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================================================
# CLOUD AUDIT LOG VIEWS
# ==================================================

@api_view(['GET'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def audit_log_list(request):
    logs = CloudAuditLog.objects.all()[:50]
    serializer = CloudAuditLogSerializer(logs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
