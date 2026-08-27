import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { RoleRoute } from './components/RoleRoute';

import { Login } from './pages/Login';

// Hospital Admin Pages
import { HospitalDashboard } from './pages/hospital/Dashboard';
import { StaffManagement } from './pages/hospital/Staff';
import { HospitalPatients } from './pages/hospital/Patients';

// Doctor Pages
import { DoctorDashboard } from './pages/doctor/Dashboard';
import { DoctorPatients } from './pages/doctor/Patients';
import { DoctorAppointments } from './pages/doctor/Appointments';
import { DoctorXRayRequests } from './pages/doctor/XRayRequests';
import { DoctorImaging } from './pages/doctor/Imaging';

// Technician Pages
import { ClinicalDashboard } from './pages/clinical/Dashboard';
import { ClinicalXRayQueue } from './pages/clinical/XRayQueue';
import { ClinicalPatients } from './pages/clinical/Patients';
import { ClinicalImaging } from './pages/clinical/Imaging';

import './App.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            {/* Hospital Admin Routes */}
            <Route element={<RoleRoute allowedRoles={['HOSPITAL_ADMIN']} />}>
              <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
              <Route path="/hospital/staff" element={<StaffManagement />} />
              <Route path="/hospital/patients" element={<HospitalPatients />} />
            </Route>

            {/* Doctor Routes */}
            <Route element={<RoleRoute allowedRoles={['DOCTOR']} />}>
              <Route path="/doctor/dashboard" element={<DoctorDashboard />} />
              <Route path="/doctor/patients" element={<DoctorPatients />} />
              <Route path="/doctor/appointments" element={<DoctorAppointments />} />
              <Route path="/doctor/xray-requests" element={<DoctorXRayRequests />} />
              <Route path="/doctor/imaging" element={<DoctorImaging />} />
            </Route>

            {/* Clinical Technician Routes */}
            <Route element={<RoleRoute allowedRoles={['CLINICAL_TECHNICIAN']} />}>
              <Route path="/clinical/dashboard" element={<ClinicalDashboard />} />
              <Route path="/clinical/xray-queue" element={<ClinicalXRayQueue />} />
              <Route path="/clinical/patients" element={<ClinicalPatients />} />
              <Route path="/clinical/imaging" element={<ClinicalImaging />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
