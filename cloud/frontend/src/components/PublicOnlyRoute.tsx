import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const PublicOnlyRoute: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (isAuthenticated) {
    return user?.role === 'HOSPITAL'
      ? <Navigate to="/hospital/dashboard" replace />
      : <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};
