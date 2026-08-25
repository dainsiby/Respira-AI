from django.db import models
from django.contrib.auth.models import User


class Hospital(models.Model):
    hospital_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=255, blank=True, default='')
    city = models.CharField(max_length=100, blank=True, default='')
    state = models.CharField(max_length=100, blank=True, default='')
    country = models.CharField(max_length=100, blank=True, default='USA')
    phone = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.hospital_id})"

    class Meta:
        ordering = ['name']


class UserProfile(models.Model):
    ROLE_SYSTEM_ADMIN = 'SYSTEM_ADMIN'
    ROLE_HOSPITAL_ADMIN = 'HOSPITAL_ADMIN'
    ROLE_DOCTOR = 'DOCTOR'
    ROLE_CLINICAL_TECHNICIAN = 'CLINICAL_TECHNICIAN'

    ROLE_CHOICES = [
        (ROLE_SYSTEM_ADMIN, 'System Administrator'),
        (ROLE_HOSPITAL_ADMIN, 'Hospital Administrator'),
        (ROLE_DOCTOR, 'Doctor'),
        (ROLE_CLINICAL_TECHNICIAN, 'Clinical Technician'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default=ROLE_DOCTOR)
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True, related_name='staff')
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        hosp_name = self.hospital.name if self.hospital else 'System'
        return f"{self.user.username} - {self.get_role_display()} ({hosp_name})"


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('Other', 'Other'),
    ]

    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='patients', null=True, blank=True)
    patient_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient_id} - {self.first_name} {self.last_name}"

    class Meta:
        ordering = ['-created_at']


class ImagingStudy(models.Model):
    STATUS_PENDING = 'PENDING'
    STATUS_PROCESSING = 'PROCESSING'
    STATUS_COMPLETED = 'COMPLETED'
    STATUS_FAILED = 'FAILED'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_PROCESSING, 'Processing'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
    ]

    study_id = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='imaging_studies')
    hospital = models.ForeignKey(Hospital, on_delete=models.CASCADE, related_name='imaging_studies')
    modality = models.CharField(max_length=50, default='Chest X-Ray')
    body_part = models.CharField(max_length=50, default='Chest')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    findings_summary = models.TextField(blank=True, default='')
    confidence_score = models.FloatField(null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='uploaded_studies')
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviewed_studies')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.study_id} - {self.patient.first_name} {self.patient.last_name}"

    class Meta:
        ordering = ['-created_at']


class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    hospital = models.ForeignKey(Hospital, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    details = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.user} - {self.action}"

    class Meta:
        ordering = ['-timestamp']

