import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

interface RoleRouteProps {
  allowedRoles: Role[];
}

export const RoleRoute: React.FC<RoleRouteProps> = ({ allowedRoles }) => {
  const { user, hasRole, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || !hasRole(allowedRoles)) {
    if (user?.role === 'HOSPITAL_ADMIN') return <Navigate to="/hospital/dashboard" replace />;
    if (user?.role === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
    if (user?.role === 'CLINICAL_TECHNICIAN') return <Navigate to="/clinical/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};
