from django.db import models
from django.contrib.auth.models import User


class Role(models.TextChoices):
    HOSPITAL_ADMIN = 'HOSPITAL_ADMIN', 'Hospital Administrator'
    DOCTOR = 'DOCTOR', 'Doctor'
    CLINICAL_TECHNICIAN = 'CLINICAL_TECHNICIAN', 'Clinical Technician'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=30, choices=Role.choices, default=Role.DOCTOR)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


class Patient(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('Other', 'Other'),
    ]

    patient_id = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField()
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    phone = models.CharField(max_length=30, blank=True, default='')
    email = models.EmailField(blank=True, default='')
    address = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_patients')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient_id} - {self.first_name} {self.last_name}"

    class Meta:
        ordering = ['-created_at']


class MedicalHistory(models.Model):
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='medical_histories')
    condition = models.CharField(max_length=255)
    notes = models.TextField(blank=True, default='')
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='recorded_medical_histories')
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.patient.patient_id} - {self.condition}"

    class Meta:
        ordering = ['-recorded_at']


class Appointment(models.Model):
    class Status(models.TextChoices):
        SCHEDULED = 'SCHEDULED', 'Scheduled'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        COMPLETED = 'COMPLETED', 'Completed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    appointment_id = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='doctor_appointments')
    scheduled_at = models.DateTimeField()
    reason = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SCHEDULED)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.appointment_id} - {self.patient.first_name} {self.patient.last_name} with Dr. {self.doctor.username}"

    class Meta:
        ordering = ['-scheduled_at']


class XRayRequest(models.Model):
    class Priority(models.TextChoices):
        ROUTINE = 'ROUTINE', 'Routine'
        URGENT = 'URGENT', 'Urgent'

    class Status(models.TextChoices):
        REQUESTED = 'REQUESTED', 'Requested'
        ASSIGNED = 'ASSIGNED', 'Assigned'
        IN_PROGRESS = 'IN_PROGRESS', 'In Progress'
        ACQUIRED = 'ACQUIRED', 'Acquired'
        CANCELLED = 'CANCELLED', 'Cancelled'

    request_id = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='xray_requests')
    appointment = models.ForeignKey(Appointment, on_delete=models.SET_NULL, null=True, blank=True, related_name='xray_requests')
    requested_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='requested_xrays')
    assigned_technician = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_xrays')
    clinical_indication = models.TextField()
    priority = models.CharField(max_length=20, choices=Priority.choices, default=Priority.ROUTINE)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    requested_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.request_id} - Patient: {self.patient.patient_id} ({self.status})"

    class Meta:
        ordering = ['-requested_at']


class HospitalAuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    target_repr = models.CharField(max_length=255, blank=True, default='')
    details = models.TextField(blank=True, default='')
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}] {self.user} - {self.action}"

    class Meta:
        ordering = ['-timestamp']


class ImagingStudy(models.Model):
    class Status(models.TextChoices):
        INGESTING = 'INGESTING', 'Ingesting'
        READY_FOR_AI = 'READY_FOR_AI', 'Ready for AI'
        AI_PROCESSING = 'AI_PROCESSING', 'AI Processing'
        AI_COMPLETED = 'AI_COMPLETED', 'AI Completed'
        AI_FAILED = 'AI_FAILED', 'AI Failed'
        QUARANTINED = 'QUARANTINED', 'Quarantined'

    study_id = models.CharField(max_length=50, unique=True)
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='imaging_studies')
    xray_request = models.ForeignKey(XRayRequest, on_delete=models.SET_NULL, null=True, blank=True, related_name='imaging_studies')
    file_path = models.CharField(max_length=500)
    original_filename = models.CharField(max_length=255)
    file_format = models.CharField(max_length=20, default='DICOM')
    study_instance_uid = models.CharField(max_length=255, blank=True, default='')
    series_instance_uid = models.CharField(max_length=255, blank=True, default='')
    sop_instance_uid = models.CharField(max_length=255, blank=True, default='')
    modality = models.CharField(max_length=50, default='Chest X-Ray')
    body_part = models.CharField(max_length=50, default='Chest')
    status = models.CharField(max_length=30, choices=Status.choices, default=Status.READY_FOR_AI)
    acquired_at = models.DateTimeField(null=True, blank=True)
    ingested_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.study_id} - Patient: {self.patient.patient_id} ({self.status})"

    class Meta:
        ordering = ['-created_at']

