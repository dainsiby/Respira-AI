import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';

import { Login } from './pages/Login';
import { RegisterHospital } from './pages/RegisterHospital';
import { Dashboard } from './pages/Dashboard';
import { HospitalApplicationsAdmin } from './pages/HospitalApplicationsAdmin';
import { Hospitals } from './pages/Hospitals';
import { Nodes } from './pages/Nodes';
import { Federation } from './pages/Federation';
import { Models } from './pages/Models';
import { AuditLogs } from './pages/AuditLogs';

import { HospitalDashboard } from './pages/HospitalDashboard';
import { HospitalApplicationView } from './pages/HospitalApplicationView';
import { HospitalNodesView } from './pages/HospitalNodesView';
import { HospitalInstallerView } from './pages/HospitalInstallerView';

import './App.css';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register-hospital" element={<RegisterHospital />} />
          </Route>

          {/* Protected System Admin Routes */}
          <Route element={<ProtectedRoute requiredRole="SYSTEM_ADMIN" />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hospital-applications" element={<HospitalApplicationsAdmin />} />
            <Route path="/hospitals" element={<Hospitals />} />
            <Route path="/nodes" element={<Nodes />} />
            <Route path="/federation" element={<Federation />} />
            <Route path="/models" element={<Models />} />
            <Route path="/audit-logs" element={<AuditLogs />} />
          </Route>

          {/* Protected Hospital Cloud Portal Routes */}
          <Route element={<ProtectedRoute requiredRole="HOSPITAL" />}>
            <Route path="/hospital/dashboard" element={<HospitalDashboard />} />
            <Route path="/hospital/application" element={<HospitalApplicationView />} />
            <Route path="/hospital/nodes" element={<HospitalNodesView />} />
            <Route path="/hospital/installer" element={<HospitalInstallerView />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
