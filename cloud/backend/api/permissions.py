from rest_framework.permissions import BasePermission
from .models import Role


class IsSystemAdmin(BasePermission):
    """Allows access only to authenticated System Administrators."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'profile'):
            return request.user.profile.role == Role.SYSTEM_ADMIN
        return request.user.is_superuser


class IsCloudHospital(BasePermission):
    """Allows access only to authenticated Hospital Cloud accounts."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, 'profile'):
            return request.user.profile.role == Role.HOSPITAL
        return False
