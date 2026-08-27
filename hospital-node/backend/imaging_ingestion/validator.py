import os
import time
from pathlib import Path
import pydicom
from PIL import Image


SUPPORTED_EXTENSIONS = {
    '.dcm': 'DICOM',
    '.png': 'PNG',
    '.jpg': 'JPEG',
    '.jpeg': 'JPEG',
}


def check_file_stability(file_path: str, wait_seconds: float = 0.1, retries: int = 3) -> bool:
    """Verifies that the file size is stable and not actively being written by PACS or file transfer."""
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        return False

    for _ in range(retries):
        try:
            size1 = path.stat().st_size
            if size1 == 0:
                time.sleep(wait_seconds)
                continue
            time.sleep(wait_seconds)
            size2 = path.stat().st_size
            if size1 == size2 and size1 > 0:
                return True
        except OSError:
            time.sleep(wait_seconds)
    return False


def validate_image_file(file_path: str) -> tuple[bool, str, str]:
    """
    Validates image file format, parseability, and image data integrity.
    Returns: (is_valid: bool, format_name: str, error_message: str)
    """
    path = Path(file_path)
    if not path.exists() or not path.is_file():
        return False, 'UNKNOWN', f"File does not exist: {file_path}"

    ext = path.suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        return False, 'UNSUPPORTED', f"Unsupported file extension '{ext}'. Allowed: .dcm, .png, .jpg, .jpeg"

    format_name = SUPPORTED_EXTENSIONS[ext]

    if format_name == 'DICOM':
        try:
            dcm = pydicom.dcmread(str(path), stop_before_pixels=False)
            if not hasattr(dcm, 'PixelData') or len(getattr(dcm, 'PixelData', b'')) == 0:
                return False, 'DICOM', "DICOM file lacks valid pixel data."
            return True, 'DICOM', ""
        except Exception as e:
            return False, 'DICOM', f"Corrupted or invalid DICOM file: {str(e)}"

    elif format_name in ['PNG', 'JPEG']:
        try:
            with Image.open(str(path)) as img:
                img.verify()
            with Image.open(str(path)) as img:
                if img.size[0] <= 0 or img.size[1] <= 0:
                    return False, format_name, "Invalid image dimensions."
            return True, format_name, ""
        except Exception as e:
            return False, format_name, f"Corrupted or invalid {format_name} image: {str(e)}"

    return False, 'UNKNOWN', "Unknown validation failure."
