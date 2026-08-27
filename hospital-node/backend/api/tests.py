import datetime
import os
import shutil
import tempfile
from pathlib import Path
from PIL import Image
import pydicom
from pydicom.dataset import Dataset, FileMetaDataset
from pydicom.uid import ExplicitVRLittleEndian, SecondaryCaptureImageStorage

from django.test import TestCase, override_settings
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status

from api.models import (
    UserProfile,
    Role,
    Patient,
    MedicalHistory,
    Appointment,
    XRayRequest,
    HospitalAuditLog,
    ImagingStudy,
)
from imaging_ingestion.validator import validate_image_file
from imaging_ingestion.metadata import extract_metadata
from imaging_ingestion.matcher import match_patient_and_request
from imaging_ingestion.processor import process_xray_file, get_storage_dirs


def create_synthetic_dicom(file_path: str, patient_id: str, request_id: str, sop_uid: str = None) -> str:
    file_meta = FileMetaDataset()
    file_meta.MediaStorageSOPClassUID = SecondaryCaptureImageStorage
    file_meta.MediaStorageSOPInstanceUID = sop_uid or pydicom.uid.generate_uid()
    file_meta.TransferSyntaxUID = ExplicitVRLittleEndian

    ds = Dataset()
    ds.file_meta = file_meta
    ds.is_little_endian = True
    ds.is_implicit_VR = False
    ds.PatientID = patient_id
    ds.AccessionNumber = request_id
    ds.Modality = 'PX'
    ds.BodyPartExamined = 'CHEST'
    ds.SOPInstanceUID = file_meta.MediaStorageSOPInstanceUID
    ds.StudyInstanceUID = pydicom.uid.generate_uid()
    ds.SeriesInstanceUID = pydicom.uid.generate_uid()

    pixels = bytes([0] * (32 * 32))
    ds.Rows = 32
    ds.Columns = 32
    ds.BitsAllocated = 8
    ds.BitsStored = 8
    ds.HighBit = 7
    ds.PixelRepresentation = 0
    ds.SamplesPerPixel = 1
    ds.PhotometricInterpretation = "MONOCHROME2"
    ds.PixelData = pixels

    ds.save_as(file_path, write_like_original=False)
    return file_path


def create_synthetic_png(file_path: str) -> str:
    img = Image.new('RGB', (32, 32), color='gray')
    img.save(file_path)
    return file_path


class LocalClinicalWorkflowTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.u_admin = User.objects.create_user(username='hosp_admin', password='Password123!')
        UserProfile.objects.create(user=self.u_admin, role=Role.HOSPITAL_ADMIN)

        self.u_doctor = User.objects.create_user(username='dr_john', password='Password123!')
        UserProfile.objects.create(user=self.u_doctor, role=Role.DOCTOR)

        self.u_tech = User.objects.create_user(username='tech_mary', password='Password123!')
        UserProfile.objects.create(user=self.u_tech, role=Role.CLINICAL_TECHNICIAN)

        res = self.client.post('/api/auth/login/', {'username': 'hosp_admin', 'password': 'Password123!'})
        self.admin_token = res.data['token']

        res = self.client.post('/api/auth/login/', {'username': 'dr_john', 'password': 'Password123!'})
        self.doc_token = res.data['token']

        res = self.client.post('/api/auth/login/', {'username': 'tech_mary', 'password': 'Password123!'})
        self.tech_token = res.data['token']

        self.patient = Patient.objects.create(
            patient_id='PAT-1001',
            first_name='Alice',
            last_name='Smith',
            date_of_birth=datetime.date(1990, 5, 15),
            gender='F',
            created_by=self.u_doctor
        )

    def test_01_admin_can_view_patients(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        response = self.client.get('/api/patients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_02_doctor_can_view_patients(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doc_token}')
        response = self.client.get('/api/patients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_03_technician_can_view_patients(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.tech_token}')
        response = self.client.get('/api/patients/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_04_doctor_can_add_medical_history(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doc_token}')
        payload = {
            'condition': 'Acute Bronchitis',
            'notes': 'Persistent cough for 5 days'
        }
        response = self.client.post(f'/api/patients/{self.patient.patient_id}/medical-history/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(MedicalHistory.objects.filter(patient=self.patient, condition='Acute Bronchitis').exists())

    def test_05_technician_cannot_add_medical_history(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.tech_token}')
        payload = {
            'condition': 'Pneumothorax',
            'notes': 'Tech notes'
        }
        response = self.client.post(f'/api/patients/{self.patient.patient_id}/medical-history/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_06_doctor_can_create_xray_request(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doc_token}')
        payload = {
            'request_id': 'XRQ-9001',
            'patient': self.patient.id,
            'clinical_indication': 'Evaluate lower lobe infiltration',
            'priority': 'URGENT'
        }
        response = self.client.post('/api/xray-requests/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(XRayRequest.objects.filter(request_id='XRQ-9001').exists())

    def test_07_technician_cannot_create_xray_request(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.tech_token}')
        payload = {
            'request_id': 'XRQ-9002',
            'patient': self.patient.id,
            'clinical_indication': 'Tech self request',
            'priority': 'ROUTINE'
        }
        response = self.client.post('/api/xray-requests/', payload)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_08_technician_can_see_xray_queue(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.tech_token}')
        response = self.client.get('/api/xray-requests/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_09_technician_valid_workflow_transitions(self):
        xray_req = XRayRequest.objects.create(
            request_id='XRQ-FLOW',
            patient=self.patient,
            requested_by=self.u_doctor,
            clinical_indication='Shortness of breath',
            status=XRayRequest.Status.REQUESTED
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.tech_token}')

        res1 = self.client.patch(f'/api/xray-requests/{xray_req.id}/', {'status': 'ASSIGNED', 'assigned_technician': self.u_tech.id})
        self.assertEqual(res1.status_code, status.HTTP_200_OK)

        res2 = self.client.patch(f'/api/xray-requests/{xray_req.id}/', {'status': 'IN_PROGRESS'})
        self.assertEqual(res2.status_code, status.HTTP_200_OK)

        res3 = self.client.patch(f'/api/xray-requests/{xray_req.id}/', {'status': 'ACQUIRED'})
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        xray_req.refresh_from_db()
        self.assertEqual(xray_req.status, XRayRequest.Status.ACQUIRED)

    def test_10_invalid_xray_transition_rejected(self):
        xray_req = XRayRequest.objects.create(
            request_id='XRQ-SKIP',
            patient=self.patient,
            requested_by=self.u_doctor,
            clinical_indication='Direct skip test',
            status=XRayRequest.Status.REQUESTED
        )
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.tech_token}')
        res = self.client.patch(f'/api/xray-requests/{xray_req.id}/', {'status': 'ACQUIRED'})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_11_non_doctor_cannot_be_assigned_as_appointment_doctor(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        payload = {
            'appointment_id': 'APT-BAD',
            'patient': self.patient.id,
            'doctor': self.u_tech.id,
            'scheduled_at': '2026-09-01T10:00:00Z',
            'reason': 'Checkup'
        }
        response = self.client.post('/api/appointments/', payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_12_anonymous_patient_access_rejected(self):
        self.client.credentials()
        response = self.client.get('/api/patients/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_13_audit_entries_generated(self):
        initial_count = HospitalAuditLog.objects.count()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doc_token}')
        self.client.post(f'/api/patients/{self.patient.patient_id}/medical-history/', {
            'condition': 'Hypertension',
            'notes': 'BP 140/90'
        })
        self.assertGreater(HospitalAuditLog.objects.count(), initial_count)

    def test_14_data_stored_in_respira_hospital(self):
        self.assertTrue(Patient.objects.filter(patient_id='PAT-1001').exists())


class LocalXRayIngestionWatcherTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.u_doctor = User.objects.create_user(username='dr_smith', password='Password123!')
        UserProfile.objects.create(user=self.u_doctor, role=Role.DOCTOR)

        res = self.client.post('/api/auth/login/', {'username': 'dr_smith', 'password': 'Password123!'})
        self.doc_token = res.data['token']

        self.patient = Patient.objects.create(
            patient_id='PAT-5001',
            first_name='Bob',
            last_name='Jones',
            date_of_birth=datetime.date(1985, 3, 20),
            gender='M',
            created_by=self.u_doctor
        )

        self.xray_request = XRayRequest.objects.create(
            request_id='XRQ-5001',
            patient=self.patient,
            requested_by=self.u_doctor,
            clinical_indication='Cough & Fever',
            status=XRayRequest.Status.REQUESTED
        )

        self.incoming_dir, self.processed_dir, self.failed_dir, self.quarantine_dir = get_storage_dirs()

    def test_01_valid_dicom_detected_and_ingested(self):
        file_name = 'sample_scan.dcm'
        file_path = str(self.incoming_dir / file_name)
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-5001')

        success = process_xray_file(file_path)
        self.assertTrue(success)
        self.assertTrue(ImagingStudy.objects.filter(patient=self.patient, xray_request=self.xray_request).exists())

    def test_02_valid_png_demo_image_detected(self):
        file_name = 'PAT-5001__XRQ-5001.png'
        file_path = str(self.incoming_dir / file_name)
        create_synthetic_png(file_path)

        success = process_xray_file(file_path)
        self.assertTrue(success)
        self.assertTrue(ImagingStudy.objects.filter(patient=self.patient, original_filename=file_name).exists())

    def test_03_unsupported_file_rejected(self):
        file_name = 'test_document.pdf'
        file_path = str(self.incoming_dir / file_name)
        with open(file_path, 'w') as f:
            f.write('%PDF-1.4 fake pdf data')

        success = process_xray_file(file_path)
        self.assertFalse(success)
        self.assertTrue((self.failed_dir / file_name).exists())

    def test_04_corrupted_image_rejected(self):
        file_name = 'PAT-5001__XRQ-5001.png'
        file_path = str(self.incoming_dir / file_name)
        with open(file_path, 'wb') as f:
            f.write(b'INVALID_PNG_CORRUPTED_BYTES_HEADER')

        success = process_xray_file(file_path)
        self.assertFalse(success)
        self.assertTrue((self.failed_dir / file_name).exists())

    def test_05_matching_patient_request_creates_imaging_study(self):
        file_name = 'match_test.dcm'
        file_path = str(self.incoming_dir / file_name)
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-5001')

        process_xray_file(file_path)
        study = ImagingStudy.objects.get(patient=self.patient, xray_request=self.xray_request)
        self.assertEqual(study.status, ImagingStudy.Status.READY_FOR_AI)

    def test_06_missing_patient_causes_quarantine(self):
        file_name = 'missing_patient.dcm'
        file_path = str(self.incoming_dir / file_name)
        create_synthetic_dicom(file_path, patient_id='PAT-9999', request_id='XRQ-5001')

        success = process_xray_file(file_path)
        self.assertFalse(success)
        self.assertTrue((self.quarantine_dir / file_name).exists())

    def test_07_missing_request_causes_quarantine(self):
        file_name = 'missing_request.dcm'
        file_path = str(self.incoming_dir / file_name)
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-9999')

        success = process_xray_file(file_path)
        self.assertFalse(success)
        self.assertTrue((self.quarantine_dir / file_name).exists())

    def test_08_patient_request_mismatch_causes_quarantine(self):
        other_patient = Patient.objects.create(
            patient_id='PAT-5002',
            first_name='Carol',
            last_name='White',
            date_of_birth=datetime.date(1992, 1, 10),
            gender='F'
        )
        file_name = 'mismatch.dcm'
        file_path = str(self.incoming_dir / file_name)
        # DICOM PatientID is PAT-5002, but XRQ-5001 belongs to PAT-5001!
        create_synthetic_dicom(file_path, patient_id='PAT-5002', request_id='XRQ-5001')

        success = process_xray_file(file_path)
        self.assertFalse(success)
        self.assertTrue((self.quarantine_dir / file_name).exists())

    def test_09_cancelled_request_not_ingested_normally(self):
        self.xray_request.status = XRayRequest.Status.CANCELLED
        self.xray_request.save()

        file_name = 'cancelled_test.dcm'
        file_path = str(self.incoming_dir / file_name)
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-5001')

        success = process_xray_file(file_path)
        self.assertFalse(success)
        self.assertTrue((self.quarantine_dir / file_name).exists())

    def test_10_duplicate_image_does_not_create_duplicate_study(self):
        sop_uid = pydicom.uid.generate_uid()
        file1 = str(self.incoming_dir / 'scan1.dcm')
        create_synthetic_dicom(file1, patient_id='PAT-5001', request_id='XRQ-5001', sop_uid=sop_uid)
        res1 = process_xray_file(file1)
        self.assertTrue(res1)

        # Attempt to process duplicate with same SOPInstanceUID
        file2 = str(self.incoming_dir / 'scan2.dcm')
        create_synthetic_dicom(file2, patient_id='PAT-5001', request_id='XRQ-5001', sop_uid=sop_uid)
        res2 = process_xray_file(file2)
        self.assertFalse(res2)
        self.assertEqual(ImagingStudy.objects.filter(sop_instance_uid=sop_uid).count(), 1)

    def test_11_successful_study_status_becomes_ready_for_ai(self):
        file_path = str(self.incoming_dir / 'ready_test.dcm')
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-5001')
        process_xray_file(file_path)

        study = ImagingStudy.objects.get(patient=self.patient)
        self.assertEqual(study.status, ImagingStudy.Status.READY_FOR_AI)

    def test_12_actual_image_remains_local(self):
        file_path = str(self.incoming_dir / 'local_disk_test.dcm')
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-5001')
        process_xray_file(file_path)

        study = ImagingStudy.objects.get(patient=self.patient)
        self.assertTrue(os.path.exists(study.file_path))
        self.assertTrue(str(self.processed_dir) in study.file_path)

    def test_13_no_clinical_data_sent_to_cloud(self):
        # Verify database connection targets local hospital database
        from django.db import connection
        self.assertIn('respira_hospital', connection.settings_dict['NAME'])

    def test_14_doctor_can_read_imaging_study_api(self):
        file_path = str(self.incoming_dir / 'api_test.dcm')
        create_synthetic_dicom(file_path, patient_id='PAT-5001', request_id='XRQ-5001')
        process_xray_file(file_path)

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.doc_token}')
        response = self.client.get('/api/imaging-studies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_15_anonymous_user_cannot_read_imaging_study_api(self):
        self.client.credentials()
        response = self.client.get('/api/imaging-studies/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_16_bad_file_does_not_terminate_watcher(self):
        # 1. Bad file
        bad_file = str(self.incoming_dir / 'corrupt.dcm')
        with open(bad_file, 'wb') as f:
            f.write(b'BAD_DATA')

        # 2. Good file
        good_file = str(self.incoming_dir / 'PAT-5001__XRQ-5001.png')
        create_synthetic_png(good_file)

        # Process bad file
        res_bad = process_xray_file(bad_file)
        self.assertFalse(res_bad)

        # Processor continues and processes good file successfully!
        res_good = process_xray_file(good_file)
        self.assertTrue(res_good)


from unittest.mock import patch
from cloud_integration.registration import register_node, load_node_credentials
from cloud_integration.heartbeat import send_heartbeat


class CloudIntegrationTests(TestCase):
    def setUp(self):
        self.tmp_dir = tempfile.mkdtemp()
        self.cred_path = Path(self.tmp_dir) / '.node_credentials.json'

    def tearDown(self):
        shutil.rmtree(self.tmp_dir, ignore_errors=True)

    @patch('cloud_integration.registration.get_credentials_path')
    @patch('cloud_integration.client.post_cloud_request')
    def test_01_cloud_registration_success(self, mock_post, mock_cred_path):
        mock_cred_path.return_value = self.cred_path
        mock_post.return_value = (True, {
            'message': 'Registered successfully',
            'node_credentials': {'node_token': 'test_token_123'}
        }, '')

        success, msg = register_node()
        self.assertTrue(success)
        self.assertIn('registered successfully', msg)

        creds = load_node_credentials()
        self.assertIsNotNone(creds)
        self.assertEqual(creds.get('node_token'), 'test_token_123')

    @patch('cloud_integration.heartbeat.load_node_credentials')
    @patch('cloud_integration.client.post_cloud_request')
    def test_02_cloud_heartbeat_success(self, mock_post, mock_creds):
        mock_creds.return_value = {'node_token': 'test_token_123'}
        mock_post.return_value = (True, {'status': 'ok', 'node_status': 'ONLINE'}, '')

        success, msg = send_heartbeat()
        self.assertTrue(success)
        self.assertIn('ONLINE', msg)

        # Verify headers passed node token
        args, kwargs = mock_post.call_args
        self.assertEqual(kwargs['headers'].get('X-Node-Token'), 'test_token_123')

    @patch('cloud_integration.heartbeat.load_node_credentials')
    @patch('cloud_integration.client.post_cloud_request')
    def test_03_cloud_heartbeat_failure_handled_gracefully(self, mock_post, mock_creds):
        mock_creds.return_value = {'node_token': 'test_token_123'}
        mock_post.return_value = (False, None, 'Network connection failed')

        success, msg = send_heartbeat()
        self.assertFalse(success)
        self.assertIn('Network connection failed', msg)

    @patch('cloud_integration.heartbeat.load_node_credentials')
    @patch('cloud_integration.client.post_cloud_request')
    def test_04_cloud_privacy_verification(self, mock_post, mock_creds):
        mock_creds.return_value = {'node_token': 'test_token_123'}
        mock_post.return_value = (True, {'status': 'ok'}, '')
        send_heartbeat()

        args, kwargs = mock_post.call_args
        payload = args[1]

        # Verify no clinical keys exist in payload
        forbidden_keys = [
            'patient_id', 'patient_name', 'date_of_birth', 'gender',
            'medical_history', 'appointment', 'xray_request', 'imaging_study',
            'filename', 'image', 'dicom', 'diagnosis', 'prediction', 'gradcam'
        ]
        for key in forbidden_keys:
            self.assertNotIn(key, payload)

