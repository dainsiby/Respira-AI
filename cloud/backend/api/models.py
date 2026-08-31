from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone


class Role(models.TextChoices):
    SYSTEM_ADMIN = 'SYSTEM_ADMIN', 'System Administrator'
    HOSPITAL = 'HOSPITAL', 'Hospital Cloud Account'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.SYSTEM_ADMIN)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


class HospitalRegistry(models.Model):
    hospital_code = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    city = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    is_active = models.BooleanField(default=True)
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"[{self.hospital_code}] {self.name}"

    class Meta:
        ordering = ['-registered_at']


class HospitalNode(models.Model):
    class Status(models.TextChoices):
        ONLINE = 'ONLINE', 'Online'
        OFFLINE = 'OFFLINE', 'Offline'
        DISABLED = 'DISABLED', 'Disabled'

    node_id = models.CharField(max_length=50, unique=True)
    hospital = models.ForeignKey(HospitalRegistry, on_delete=models.CASCADE, related_name='nodes')
    api_key_hash = models.CharField(max_length=128, blank=True, default='')
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OFFLINE)
    last_heartbeat = models.DateTimeField(null=True, blank=True)
    installed_version = models.CharField(max_length=50, default='1.0.0')
    registered_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def is_online(self, threshold_seconds=300) -> bool:
        if self.status == self.Status.DISABLED:
            return False
        if not self.last_heartbeat:
            return False
        delta = (timezone.now() - self.last_heartbeat).total_seconds()
        return delta <= threshold_seconds

    def __str__(self):
        return f"Node {self.node_id} ({self.hospital.hospital_code}) - Status: {self.status}"

    class Meta:
        ordering = ['-registered_at']


class HospitalApplication(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending Review'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    application_id = models.CharField(max_length=50, unique=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='hospital_application')
    hospital_name = models.CharField(max_length=255)
    official_email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, default='')
    address = models.TextField(blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='')
    contact_person = models.CharField(max_length=150, blank=True, default='')

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_applications')
    rejection_reason = models.TextField(blank=True, default='')

    hospital_registry = models.ForeignKey(HospitalRegistry, on_delete=models.SET_NULL, null=True, blank=True, related_name='applications')

    def __str__(self):
        return f"[{self.application_id}] {self.hospital_name} - Status: {self.status}"

    class Meta:
        ordering = ['-submitted_at']


class CloudAuditLog(models.Model):
    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='cloud_audit_logs')
    node = models.ForeignKey(HospitalNode, on_delete=models.SET_NULL, null=True, blank=True, related_name='audit_logs')
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.action} - {self.details[:50]}"

    class Meta:
        ordering = ['-timestamp']


class GlobalModelVersion(models.Model):
    model_version = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100, default='RESPIRA Chest X-Ray Global Model')
    release_status = models.CharField(max_length=30, default='DRAFT')
    accuracy_metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Global Model v{self.model_version} ({self.release_status})"


class FLRound(models.Model):
    round_number = models.IntegerField(unique=True)
    status = models.CharField(max_length=30, default='PLANNED')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"FL Round #{self.round_number} ({self.status})"
