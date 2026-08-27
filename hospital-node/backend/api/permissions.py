from rest_framework import permissions
from .models import Role


def get_user_role(user):
    if not user or not user.is_authenticated:
        return None
    if hasattr(user, 'profile') and user.profile:
        return user.profile.role
    return Role.DOCTOR


class IsHospitalAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or get_user_role(request.user) == Role.HOSPITAL_ADMIN)
        )


class IsDoctor(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or get_user_role(request.user) in [Role.DOCTOR, Role.HOSPITAL_ADMIN])
        )


class IsClinicalTechnician(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or get_user_role(request.user) in [Role.CLINICAL_TECHNICIAN, Role.HOSPITAL_ADMIN])
        )


class IsDoctorOrTechnician(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (request.user.is_superuser or get_user_role(request.user) in [Role.DOCTOR, Role.CLINICAL_TECHNICIAN, Role.HOSPITAL_ADMIN])
        )


class IsHospitalMember(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)
