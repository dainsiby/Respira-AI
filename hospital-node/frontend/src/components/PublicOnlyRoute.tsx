import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicOnlyRoute: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated && user) {
    if (user.role === 'HOSPITAL_ADMIN') return <Navigate to="/hospital/dashboard" replace />;
    if (user.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'CLINICAL_TECHNICIAN') return <Navigate to="/clinical/dashboard" replace />;
  }

  return <Outlet />;
};
