import os
import time
import logging
from pathlib import Path
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from .processor import process_xray_file, get_storage_dirs

logger = logging.getLogger(__name__)


class XRayFileHandler(FileSystemEventHandler):
    """Event handler for detecting new X-ray files arriving in incoming_xrays directory."""

    def on_created(self, event):
        if event.is_directory:
            return
        file_path = event.src_path
        if Path(file_path).name.startswith('.'):
            return

        try:
            process_xray_file(file_path)
        except Exception as e:
            logger.error(f"Error processing image {file_path}: {e}")

    def on_moved(self, event):
        if event.is_directory:
            return
        file_path = event.dest_path
        if Path(file_path).name.startswith('.'):
            return

        try:
            process_xray_file(file_path)
        except Exception as e:
            logger.error(f"Error processing moved image {file_path}: {e}")


def scan_existing_incoming_files(incoming_dir: Path):
    """Processes any existing files present in incoming directory at startup."""
    for entry in incoming_dir.iterdir():
        if entry.is_file() and not entry.name.startswith('.'):
            try:
                process_xray_file(str(entry))
            except Exception as e:
                logger.error(f"Error scanning pre-existing file {entry}: {e}")


def start_xray_watcher(poll_interval: float = 1.0, run_once: bool = False):
    """
    Starts background folder watcher monitoring incoming_xrays directory.
    If run_once=True, scans once and returns (used for tests and batch processing).
    """
    incoming, processed, failed, quarantine = get_storage_dirs()

    # Process pre-existing files in incoming directory first
    scan_existing_incoming_files(incoming)

    if run_once:
        return

    event_handler = XRayFileHandler()
    observer = Observer()
    observer.schedule(event_handler, str(incoming), recursive=False)
    observer.start()

    logger.info(f"RESPIRA AI Hospital Node X-Ray Watcher active on: {incoming}")

    try:
        while True:
            time.sleep(poll_interval)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()
