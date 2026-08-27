import hashlib
from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from api.models import UserProfile, Role, HospitalRegistry, HospitalNode, HospitalApplication, CloudAuditLog


class CloudPlatformBackendTests(TestCase):
    def setUp(self):
        self.client = APIClient()

        # Create System Admin user
        self.sys_admin = User.objects.create_user(username='cloud_admin', password='Password123!')
        UserProfile.objects.create(user=self.sys_admin, role=Role.SYSTEM_ADMIN)

        # Login and acquire token
        res = self.client.post('/api/auth/login/', {'username': 'cloud_admin', 'password': 'Password123!'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.admin_token = res.data['token']

        # Seed sample hospital & node
        self.hospital = HospitalRegistry.objects.create(
            hospital_code='HOSP-TEST',
            name='Test Central Hospital',
            city='Boston',
            country='USA'
        )

        self.node_raw_token = 'secret_node_token_123'
        self.node_token_hash = hashlib.sha256(self.node_raw_token.encode('utf-8')).hexdigest()

        self.node = HospitalNode.objects.create(
            node_id='NODE-TEST-01',
            hospital=self.hospital,
            api_key_hash=self.node_token_hash,
            status=HospitalNode.Status.ONLINE,
            installed_version='1.0.0'
        )

    def test_01_health_endpoint(self):
        response = self.client.get('/api/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['service'], 'respira-cloud-platform')

    def test_02_anonymous_access_rejected(self):
        self.client.credentials()  # Clear token
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_03_system_admin_login(self):
        response = self.client.post('/api/auth/login/', {'username': 'cloud_admin', 'password': 'Password123!'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['role'], Role.SYSTEM_ADMIN)

    def test_04_me_view(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['user']['username'], 'cloud_admin')

    def test_05_hospital_creation(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        payload = {
            'hospital_code': 'HOSP-NEW',
            'name': 'St. Mary Regional Center',
            'city': 'Chicago',
            'country': 'USA'
        }
        response = self.client.post('/api/hospitals/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(HospitalRegistry.objects.filter(hospital_code='HOSP-NEW').exists())

    def test_06_hospital_listing(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        response = self.client.get('/api/hospitals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_07_node_registration_endpoint(self):
        payload = {
            'hospital_code': 'HOSP-TEST',
            'node_id': 'NODE-TEST-02',
            'installed_version': '1.0.1'
        }
        response = self.client.post('/api/nodes/register/', payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(HospitalNode.objects.filter(node_id='NODE-TEST-02').exists())
        self.assertIn('node_credentials', response.data)

    def test_08_node_listing(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        response = self.client.get('/api/nodes/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_09_node_credentials_not_exposed(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        response = self.client.get(f'/api/nodes/{self.node.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('api_key_hash', response.data)

    def test_10_heartbeat_update_with_valid_token(self):
        payload = {
            'node_id': 'NODE-TEST-01',
            'installed_version': '1.0.0'
        }
        response = self.client.post('/api/nodes/heartbeat/', payload, HTTP_X_NODE_TOKEN=self.node_raw_token)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.node.refresh_from_db()
        self.assertIsNotNone(self.node.last_heartbeat)

    def test_11_cloud_dashboard(self):
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        response = self.client.get('/api/dashboard/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('registered_hospitals', response.data)
        self.assertIn('online_nodes', response.data)

    def test_12_cloud_audit_logging(self):
        initial_count = CloudAuditLog.objects.count()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        self.client.post('/api/hospitals/', {
            'hospital_code': 'HOSP-AUDIT',
            'name': 'Audit Hospital'
        })
        self.assertGreater(CloudAuditLog.objects.count(), initial_count)

    def test_13_no_clinical_models_or_patient_data(self):
        from django.apps import apps
        app_models = [m.__name__ for m in apps.get_app_config('api').get_models()]
        self.assertNotIn('Patient', app_models)
        self.assertNotIn('MedicalHistory', app_models)
        self.assertNotIn('ImagingStudy', app_models)
        self.assertNotIn('XRayRequest', app_models)
        self.assertNotIn('Appointment', app_models)

    def test_14_disabled_node_heartbeat_rejected(self):
        self.node.status = HospitalNode.Status.DISABLED
        self.node.save()

        payload = {'node_id': 'NODE-TEST-01', 'installed_version': '1.0.0'}
        response = self.client.post('/api/nodes/heartbeat/', payload, HTTP_X_NODE_TOKEN=self.node_raw_token)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.node.refresh_from_db()
        self.assertEqual(self.node.status, HospitalNode.Status.DISABLED)

    def test_15_invalid_node_token_rejected(self):
        payload = {'node_id': 'NODE-TEST-01', 'installed_version': '1.0.0'}
        response = self.client.post('/api/nodes/heartbeat/', payload, HTTP_X_NODE_TOKEN='wrong_token')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    # ==================================================
    # TASK 5G-0D NEW HOSPITAL ONBOARDING & PERMISSION TESTS
    # ==================================================

    def test_16_hospital_onboarding_registration(self):
        payload = {
            'username': 'hosp_applicant_01',
            'password': 'Password123!',
            'hospital_name': 'St. Jude General Hospital',
            'official_email': 'contact@stjude.org',
            'phone': '+1-555-0199',
            'city': 'Boston',
            'country': 'USA',
            'contact_person': 'Dr. Sarah Connor'
        }
        res = self.client.post('/api/hospital-registration/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('application_id', res.data)
        self.assertEqual(res.data['status'], HospitalApplication.Status.PENDING)

        user = User.objects.get(username='hosp_applicant_01')
        self.assertEqual(user.profile.role, Role.HOSPITAL)
        app_obj = HospitalApplication.objects.get(user=user)
        self.assertEqual(app_obj.hospital_name, 'St. Jude General Hospital')
        self.assertEqual(app_obj.status, HospitalApplication.Status.PENDING)

    def test_17_applicant_cannot_self_create_system_admin(self):
        payload = {
            'username': 'hosp_hacker_01',
            'password': 'Password123!',
            'role': 'SYSTEM_ADMIN',  # Malicious payload attempt
            'hospital_name': 'Malicious Clinic',
            'official_email': 'hacker@clinic.org'
        }
        res = self.client.post('/api/hospital-registration/', payload)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username='hosp_hacker_01')
        self.assertEqual(user.profile.role, Role.HOSPITAL)  # Must remain HOSPITAL

    def test_18_pending_hospital_cannot_access_installer(self):
        # Create hospital applicant
        user = User.objects.create_user(username='hosp_pending', password='Password123!')
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)
        HospitalApplication.objects.create(
            application_id='APP-PEND-01', user=user, hospital_name='Pending Hospital', official_email='p@hosp.org'
        )

        login_res = self.client.post('/api/auth/login/', {'username': 'hosp_pending', 'password': 'Password123!'})
        h_token = login_res.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {h_token}')
        res = self.client.get('/api/hospital-portal/installer/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data['eligible'])
        self.assertFalse(res.data['available'])

    def test_19_system_admin_can_list_and_manage_applications(self):
        user = User.objects.create_user(username='hosp_applicant_02', password='Password123!')
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)
        app_obj = HospitalApplication.objects.create(
            application_id='APP-LIST-01', user=user, hospital_name='Listing Hospital', official_email='list@hosp.org'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        res = self.client.get('/api/hospital-applications/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_20_hospital_cannot_list_all_applications(self):
        user = User.objects.create_user(username='hosp_restricted', password='Password123!')
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)
        login_res = self.client.post('/api/auth/login/', {'username': 'hosp_restricted', 'password': 'Password123!'})
        h_token = login_res.data['token']

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {h_token}')
        res = self.client.get('/api/hospital-applications/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_21_system_admin_can_approve_application(self):
        user = User.objects.create_user(username='hosp_to_approve', password='Password123!')
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)
        app_obj = HospitalApplication.objects.create(
            application_id='APP-APPROVE-01',
            user=user,
            hospital_name='Approval City Hospital',
            official_email='approve@hosp.org',
            city='Seattle',
            country='USA'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        res = self.client.post(f'/api/hospital-applications/{app_obj.id}/approve/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('hospital_code', res.data)

        app_obj.refresh_from_db()
        self.assertEqual(app_obj.status, HospitalApplication.Status.APPROVED)
        self.assertIsNotNone(app_obj.hospital_registry)
        self.assertEqual(app_obj.hospital_registry.name, 'Approval City Hospital')

    def test_22_approved_hospital_sees_code_and_becomes_installer_eligible(self):
        user = User.objects.create_user(username='hosp_approved_user', password='Password123!')
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)
        registry = HospitalRegistry.objects.create(hospital_code='HOSP-APPROVED-01', name='Approved Hosp')
        app_obj = HospitalApplication.objects.create(
            application_id='APP-APP-01',
            user=user,
            hospital_name='Approved Hosp',
            official_email='a@hosp.org',
            status=HospitalApplication.Status.APPROVED,
            hospital_registry=registry
        )

        login_res = self.client.post('/api/auth/login/', {'username': 'hosp_approved_user', 'password': 'Password123!'})
        h_token = login_res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {h_token}')

        # Profile check
        profile_res = self.client.get('/api/hospital-portal/profile/')
        self.assertEqual(profile_res.status_code, status.HTTP_200_OK)
        self.assertEqual(profile_res.data['hospital_code'], 'HOSP-APPROVED-01')

        # Installer check
        inst_res = self.client.get('/api/hospital-portal/installer/')
        self.assertEqual(inst_res.status_code, status.HTTP_200_OK)
        self.assertTrue(inst_res.data['eligible'])
        self.assertFalse(inst_res.data['available'])
        self.assertIn('Task 5P', inst_res.data['message'])

    def test_23_system_admin_can_reject_application(self):
        user = User.objects.create_user(username='hosp_to_reject', password='Password123!')
        UserProfile.objects.create(user=user, role=Role.HOSPITAL)
        app_obj = HospitalApplication.objects.create(
            application_id='APP-REJECT-01',
            user=user,
            hospital_name='Invalid Hospital',
            official_email='reject@hosp.org'
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.admin_token}')
        res = self.client.post(f'/api/hospital-applications/{app_obj.id}/reject/', {'rejection_reason': 'Incomplete documentation.'})
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        app_obj.refresh_from_db()
        self.assertEqual(app_obj.status, HospitalApplication.Status.REJECTED)
        self.assertEqual(app_obj.rejection_reason, 'Incomplete documentation.')

    def test_24_hospital_a_cannot_see_hospital_b_nodes(self):
        # Create Hosp A & Node A
        reg_a = HospitalRegistry.objects.create(hospital_code='HOSP-A-TEST', name='Hospital A')
        user_a = User.objects.create_user(username='user_hosp_a', password='Password123!')
        UserProfile.objects.create(user=user_a, role=Role.HOSPITAL)
        HospitalApplication.objects.create(application_id='APP-A', user=user_a, hospital_name='Hospital A', official_email='a@h.org', status='APPROVED', hospital_registry=reg_a)
        node_a = HospitalNode.objects.create(node_id='NODE-A-01', hospital=reg_a)

        # Create Hosp B & Node B
        reg_b = HospitalRegistry.objects.create(hospital_code='HOSP-B-TEST', name='Hospital B')
        node_b = HospitalNode.objects.create(node_id='NODE-B-01', hospital=reg_b)

        # Login Hosp A
        login_res = self.client.post('/api/auth/login/', {'username': 'user_hosp_a', 'password': 'Password123!'})
        h_token = login_res.data['token']
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {h_token}')

        nodes_res = self.client.get('/api/hospital-portal/nodes/')
        self.assertEqual(nodes_res.status_code, status.HTTP_200_OK)
        node_ids = [n['node_id'] for n in nodes_res.data]
        self.assertIn('NODE-A-01', node_ids)
        self.assertNotIn('NODE-B-01', node_ids)
