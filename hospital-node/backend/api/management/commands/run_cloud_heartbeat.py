import time
from django.core.management.base import BaseCommand
from django.conf import settings
from cloud_integration.heartbeat import send_heartbeat


class Command(BaseCommand):
    help = 'Runs the Hospital Node periodic heartbeat daemon to report operational status to Cloud.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--once',
            action='store_true',
            help='Sends a single heartbeat once and exits cleanly.'
        )

    def handle(self, *args, **options):
        once_mode = options.get('once', False)
        interval = getattr(settings, 'RESPIRA_HEARTBEAT_INTERVAL', 60)

        if once_mode:
            self.stdout.write('Sending single Cloud Heartbeat...')
            success, message = send_heartbeat()
            if success:
                self.stdout.write(self.style.SUCCESS(f"Heartbeat Success: {message}"))
            else:
                self.stdout.write(self.style.WARNING(f"Heartbeat Warning: {message}"))
            return

        self.stdout.write(self.style.SUCCESS(f"Starting RESPIRA Cloud Heartbeat Daemon (Interval: {interval}s)..."))

        try:
            while True:
                success, message = send_heartbeat()
                if success:
                    self.stdout.write(self.style.SUCCESS(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message}"))
                else:
                    self.stdout.write(self.style.WARNING(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {message} (Hospital Node operational)"))
                
                time.sleep(interval)
        except KeyboardInterrupt:
            self.stdout.write('\nCloud Heartbeat daemon stopped by user.')
