from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import Hospital, UserProfile, Patient, ImagingStudy, AuditLog
import datetime


class Command(BaseCommand):
    help = 'Seeds initial demonstration data for hospitals, users across all roles, patients, and imaging studies.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding RESPIRA AI platform demo data...')

        # 1. Create Hospitals
        hosp_a, created = Hospital.objects.get_or_create(
            hospital_id='HOSP-A',
            defaults={
                'name': 'Metro General Hospital',
                'address': '100 Hospital Drive',
                'city': 'New York',
                'state': 'NY',
                'country': 'USA',
                'phone': '+1 (212) 555-0199',
                'email': 'contact@metrogeneral.org',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(f'Created Hospital A: {hosp_a.name}')

        hosp_b, created = Hospital.objects.get_or_create(
            hospital_id='HOSP-B',
            defaults={
                'name': 'St. Jude Medical Center',
                'address': '500 Healthcare Blvd',
                'city': 'Boston',
                'state': 'MA',
                'country': 'USA',
                'phone': '+1 (617) 555-0288',
                'email': 'info@stjude-health.org',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(f'Created Hospital B: {hosp_b.name}')

        # Helper to create user & profile safely
        def create_test_user(username, password, role, hospital=None, email='', first_name='', last_name=''):
            user, u_created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_staff': True if role == UserProfile.ROLE_SYSTEM_ADMIN else False,
                    'is_superuser': True if role == UserProfile.ROLE_SYSTEM_ADMIN else False
                }
            )
            if u_created:
                user.set_password(password)
                user.save()

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': role,
                    'hospital': hospital,
                    'is_active': True
                }
            )
            # Ensure existing user has correct profile attributes
            profile.role = role
            profile.hospital = hospital
            profile.save()
            return user

        # 2. Create Users for all roles
        u_admin = create_test_user('systemadmin', 'Password123!', UserProfile.ROLE_SYSTEM_ADMIN, None, 'admin@respira.ai', 'System', 'Admin')
        u_hosp_admin = create_test_user('hospitaladmin', 'Password123!', UserProfile.ROLE_HOSPITAL_ADMIN, hosp_a, 'admin@metrogeneral.org', 'Eleanor', 'Vane')
        u_doctor = create_test_user('doctor', 'Password123!', UserProfile.ROLE_DOCTOR, hosp_a, 'dr.chen@metrogeneral.org', 'Robert', 'Chen')
        u_tech = create_test_user('technician', 'Password123!', UserProfile.ROLE_CLINICAL_TECHNICIAN, hosp_a, 'm.vance@metrogeneral.org', 'Marcus', 'Vance')
        
        # User for Hospital B (Cross-hospital isolation test)
        u_doctor_b = create_test_user('doctor_b', 'Password123!', UserProfile.ROLE_DOCTOR, hosp_b, 'dr.rostova@stjude.org', 'Elena', 'Rostova')

        self.stdout.write(self.style.SUCCESS('Users seeded for all roles: systemadmin, hospitaladmin, doctor, technician, doctor_b'))

        # 3. Create Patients for Hospital A
        p_a1, _ = Patient.objects.get_or_create(
            patient_id='PAT-A101',
            defaults={
                'hospital': hosp_a,
                'first_name': 'James',
                'last_name': 'Wilson',
                'date_of_birth': datetime.date(1968, 7, 12),
                'gender': 'M'
            }
        )
        p_a2, _ = Patient.objects.get_or_create(
            patient_id='PAT-A102',
            defaults={
                'hospital': hosp_a,
                'first_name': 'Maria',
                'last_name': 'Garcia',
                'date_of_birth': datetime.date(1982, 11, 23),
                'gender': 'F'
            }
        )
        p_a3, _ = Patient.objects.get_or_create(
            patient_id='PAT-A103',
            defaults={
                'hospital': hosp_a,
                'first_name': 'David',
                'last_name': 'Miller',
                'date_of_birth': datetime.date(1955, 3, 4),
                'gender': 'M'
            }
        )

        # 4. Create Patients for Hospital B
        p_b1, _ = Patient.objects.get_or_create(
            patient_id='PAT-B201',
            defaults={
                'hospital': hosp_b,
                'first_name': 'Sophia',
                'last_name': 'Taylor',
                'date_of_birth': datetime.date(1990, 9, 18),
                'gender': 'F'
            }
        )
        p_b2, _ = Patient.objects.get_or_create(
            patient_id='PAT-B202',
            defaults={
                'hospital': hosp_b,
                'first_name': 'Anthony',
                'last_name': 'Clark',
                'date_of_birth': datetime.date(1974, 1, 30),
                'gender': 'M'
            }
        )

        # 5. Create Imaging Studies
        ImagingStudy.objects.get_or_create(
            study_id='STD-A101',
            defaults={
                'patient': p_a1,
                'hospital': hosp_a,
                'modality': 'Chest X-Ray',
                'status': ImagingStudy.STATUS_COMPLETED,
                'findings_summary': 'Demo AI Prediction: Bilateral lower lobe infiltrates observed. Recommended high-flow oxygen monitoring.',
                'confidence_score': 0.94,
                'uploaded_by': u_tech,
                'reviewed_by': u_doctor
            }
        )

        ImagingStudy.objects.get_or_create(
            study_id='STD-A102',
            defaults={
                'patient': p_a2,
                'hospital': hosp_a,
                'modality': 'Chest X-Ray',
                'status': ImagingStudy.STATUS_PROCESSING,
                'findings_summary': 'Demo Processing: Heatmap analysis in progress. Grad-CAM visualization queued.',
                'confidence_score': 0.88,
                'uploaded_by': u_tech
            }
        )

        ImagingStudy.objects.get_or_create(
            study_id='STD-B201',
            defaults={
                'patient': p_b1,
                'hospital': hosp_b,
                'modality': 'Chest X-Ray',
                'status': ImagingStudy.STATUS_COMPLETED,
                'findings_summary': 'Demo AI Prediction: Clear lung fields. No acute cardiopulmonary abnormalities.',
                'confidence_score': 0.96,
                'uploaded_by': u_doctor_b
            }
        )

        # 6. Audit logs
        AuditLog.objects.create(
            user=u_admin,
            action='SYSTEM_SEED',
            details='Initial platform demo data successfully seeded.'
        )

        self.stdout.write(self.style.SUCCESS('RESPIRA AI demo seeding completed successfully!'))
