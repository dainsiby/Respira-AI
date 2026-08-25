from rest_framework import permissions


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    if hasattr(user, 'profile') and user.profile:
        return user.profile.role
    return 'DOCTOR'


def get_user_hospital(user):
    if not user or not user.is_authenticated:
        return None
    if hasattr(user, 'profile') and user.profile:
        return user.profile.hospital
    return None


class IsSystemAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (
            request.user.is_superuser or get_user_role(request.user) == 'SYSTEM_ADMIN'
        ))


class IsHospitalAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and get_user_role(request.user) in ['HOSPITAL_ADMIN', 'SYSTEM_ADMIN'])


class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and get_user_role(request.user) in ['DOCTOR', 'SYSTEM_ADMIN'])


class IsClinicalTechnician(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and get_user_role(request.user) in ['CLINICAL_TECHNICIAN', 'SYSTEM_ADMIN'])


class IsDoctorOrTechnician(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and get_user_role(request.user) in ['DOCTOR', 'CLINICAL_TECHNICIAN', 'HOSPITAL_ADMIN', 'SYSTEM_ADMIN'])


class IsHospitalMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
