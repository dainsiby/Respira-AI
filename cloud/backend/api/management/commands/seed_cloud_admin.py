from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, Role, HospitalRegistry, HospitalNode  # pyright: ignore


class Command(BaseCommand):
    help = 'Seeds initial System Admin account and sample Hospital Registries for Cloud Control Plane.'

    def handle(self, *args, **options):
        # 1. Create System Admin
        sys_admin, created = User.objects.get_or_create(
            username='sysadmin',
            defaults={
                'email': 'sysadmin@respira.ai',
                'first_name': 'System',
                'last_name': 'Administrator',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            sys_admin.set_password(password='Password123!')
            sys_admin.save()

        UserProfile.objects.get_or_create(user=sys_admin, defaults={'role': Role.SYSTEM_ADMIN})

        # 2. Create sample Hospital Registries
        HospitalRegistry.objects.get_or_create(
            hospital_code='HOSP-DEMO',
            defaults={'name': 'Demo General Hospital', 'city': 'Boston', 'country': 'USA'}
        )

        hosp_a, _ = HospitalRegistry.objects.get_or_create(
            hospital_code='HOSP-A',
            defaults={'name': 'St. Jude General Hospital', 'city': 'Boston', 'country': 'USA'}
        )

        hosp_b, _ = HospitalRegistry.objects.get_or_create(
            hospital_code='HOSP-B',
            defaults={'name': 'Metropolitan Medical Center', 'city': 'London', 'country': 'UK'}
        )

        # 3. Create sample Hospital Nodes
        HospitalNode.objects.get_or_create(
            node_id='NODE-001',
            defaults={'hospital': hosp_a, 'status': HospitalNode.Status.ONLINE, 'installed_version': '1.0.0'}
        )

        HospitalNode.objects.get_or_create(
            node_id='NODE-002',
            defaults={'hospital': hosp_b, 'status': HospitalNode.Status.OFFLINE, 'installed_version': '1.0.0'}
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded Cloud Control Plane data (HOSP-DEMO & sysadmin / Password123!).'))  # pyright: ignore
