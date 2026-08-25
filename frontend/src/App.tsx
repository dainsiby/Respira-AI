import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import RoleRoute from "./components/RoleRoute";

import Login from "./pages/Login";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminHospitals from "./pages/admin/AdminHospitals";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminAuditLogs from "./pages/admin/AdminAuditLogs";

// Hospital Admin Pages
import HospitalDashboard from "./pages/hospital/HospitalDashboard";
import HospitalStaff from "./pages/hospital/HospitalStaff";
import HospitalPatients from "./pages/hospital/HospitalPatients";
import HospitalSettings from "./pages/hospital/HospitalSettings";

// Doctor Pages
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorPatients from "./pages/doctor/DoctorPatients";
import DoctorImaging from "./pages/doctor/DoctorImaging";
import DoctorReports from "./pages/doctor/DoctorReports";

// Technician Pages
import TechnicianDashboard from "./pages/clinical/TechnicianDashboard";
import TechnicianQueue from "./pages/clinical/TechnicianQueue";
import TechnicianUpload from "./pages/clinical/TechnicianUpload";
import TechnicianPatients from "./pages/clinical/TechnicianPatients";

const RoleBasedRedirect: React.FC = () => {
  const { user, token, loading, getRoleDefaultRoute } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", fontFamily: "system-ui, sans-serif", color: "#64748b" }}>
        <div>Loading RESPIRA AI Clinical Platform...</div>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getRoleDefaultRoute()} replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Root Redirect */}
          <Route path="/" element={<RoleBasedRedirect />} />
          <Route path="/dashboard" element={<RoleBasedRedirect />} />

          {/* Public Auth Route */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />

          {/* SYSTEM ADMIN ROUTES */}
          <Route
            path="/admin/dashboard"
            element={
              <RoleRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/hospitals"
            element={
              <RoleRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminHospitals />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <RoleRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminUsers />
              </RoleRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <RoleRoute allowedRoles={['SYSTEM_ADMIN']}>
                <AdminAuditLogs />
              </RoleRoute>
            }
          />

          {/* HOSPITAL ADMIN ROUTES */}
          <Route
            path="/hospital/dashboard"
            element={
              <RoleRoute allowedRoles={['HOSPITAL_ADMIN', 'SYSTEM_ADMIN']}>
                <HospitalDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/hospital/staff"
            element={
              <RoleRoute allowedRoles={['HOSPITAL_ADMIN', 'SYSTEM_ADMIN']}>
                <HospitalStaff />
              </RoleRoute>
            }
          />
          <Route
            path="/hospital/patients"
            element={
              <RoleRoute allowedRoles={['HOSPITAL_ADMIN', 'SYSTEM_ADMIN']}>
                <HospitalPatients />
              </RoleRoute>
            }
          />
          <Route
            path="/hospital/settings"
            element={
              <RoleRoute allowedRoles={['HOSPITAL_ADMIN', 'SYSTEM_ADMIN']}>
                <HospitalSettings />
              </RoleRoute>
            }
          />

          {/* DOCTOR CLINICAL ROUTES */}
          <Route
            path="/doctor/dashboard"
            element={
              <RoleRoute allowedRoles={['DOCTOR', 'SYSTEM_ADMIN']}>
                <DoctorDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <RoleRoute allowedRoles={['DOCTOR', 'SYSTEM_ADMIN']}>
                <DoctorPatients />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/imaging"
            element={
              <RoleRoute allowedRoles={['DOCTOR', 'SYSTEM_ADMIN']}>
                <DoctorImaging />
              </RoleRoute>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <RoleRoute allowedRoles={['DOCTOR', 'SYSTEM_ADMIN']}>
                <DoctorReports />
              </RoleRoute>
            }
          />

          {/* CLINICAL TECHNICIAN ROUTES */}
          <Route
            path="/clinical/dashboard"
            element={
              <RoleRoute allowedRoles={['CLINICAL_TECHNICIAN', 'SYSTEM_ADMIN']}>
                <TechnicianDashboard />
              </RoleRoute>
            }
          />
          <Route
            path="/clinical/queue"
            element={
              <RoleRoute allowedRoles={['CLINICAL_TECHNICIAN', 'SYSTEM_ADMIN']}>
                <TechnicianQueue />
              </RoleRoute>
            }
          />
          <Route
            path="/clinical/upload"
            element={
              <RoleRoute allowedRoles={['CLINICAL_TECHNICIAN', 'SYSTEM_ADMIN']}>
                <TechnicianUpload />
              </RoleRoute>
            }
          />
          <Route
            path="/clinical/patients"
            element={
              <RoleRoute allowedRoles={['CLINICAL_TECHNICIAN', 'SYSTEM_ADMIN']}>
                <TechnicianPatients />
              </RoleRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<RoleBasedRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;