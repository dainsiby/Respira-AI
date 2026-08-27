from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import UserProfile, Role  # pyright: ignore


class Command(BaseCommand):
    help = 'Seeds initial demonstration local hospital users across roles (HOSPITAL_ADMIN, DOCTOR, CLINICAL_TECHNICIAN) for development.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding RESPIRA AI Hospital Node local staff users...')

        def create_local_user(username, password, role, email='', first_name='', last_name=''):
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email,
                    'first_name': first_name,
                    'last_name': last_name,
                    'is_staff': True if role == Role.HOSPITAL_ADMIN else False,
                }
            )
            if created:
                user.set_password(password)
                user.save()

            profile, _ = UserProfile.objects.get_or_create(
                user=user,
                defaults={
                    'role': role,
                    'is_active': True
                }
            )
            profile.role = role
            profile.is_active = True
            profile.save()
            return user

        # Seed local users
        u_admin = create_local_user('hospadmin', 'Password123!', Role.HOSPITAL_ADMIN, 'admin@localhospital.org', 'Eleanor', 'Vane')
        u_doctor = create_local_user('dr_smith', 'Password123!', Role.DOCTOR, 'dr.smith@localhospital.org', 'Robert', 'Smith')
        u_tech = create_local_user('tech_john', 'Password123!', Role.CLINICAL_TECHNICIAN, 'm.john@localhospital.org', 'Marcus', 'John')

        self.stdout.write(self.style.SUCCESS('Hospital Node local users seeded: hospadmin, dr_smith, tech_john'))  # pyright: ignore
