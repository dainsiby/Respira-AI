from django.core.management.base import BaseCommand
from imaging_ingestion.watcher import start_xray_watcher


class Command(BaseCommand):
    help = 'Runs the automatic local X-ray ingestion folder watcher for RESPIRA AI Hospital Node.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--once',
            action='store_true',
            help='Scans the incoming directory once for pending files and exits (useful for tests or batch execution).'
        )

    def handle(self, *args, **options):
        run_once = options.get('once', False)
        if run_once:
            self.stdout.write('Scanning incoming X-rays directory once...')
            start_xray_watcher(run_once=True)
            self.stdout.write(self.style.SUCCESS('Finished scanning incoming X-rays directory.'))
        else:
            self.stdout.write(self.style.SUCCESS('Starting RESPIRA AI X-Ray Watcher daemon... Press Ctrl+C to stop.'))
            start_xray_watcher(run_once=False)
