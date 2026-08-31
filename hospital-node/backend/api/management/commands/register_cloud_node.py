from django.core.management.base import BaseCommand
from cloud_integration.registration import register_node


class Command(BaseCommand):
    help = 'Registers the local Hospital Node with the RESPIRA AI Cloud Control Plane.'

    def handle(self, *args, **options):
        self.stdout.write('Initiating Hospital Node Cloud Registration...')
        success, message = register_node()
        if success:
            self.stdout.write(self.style.SUCCESS(f"Registration Success: {message}"))
        else:
            self.stderr.write(self.style.ERROR(f"Registration Failure: {message}"))
