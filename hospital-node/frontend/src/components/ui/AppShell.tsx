import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  Users,
  UserCheck,
  Calendar,
  FileText,
  Camera,
  LogOut,
  Shield,
  Stethoscope,
  Radio
} from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getNavItems = () => {
    if (!user) return [];

    switch (user.role) {
      case 'HOSPITAL_ADMIN':
        return [
          { label: 'Overview', path: '/hospital/dashboard', icon: <Activity size={18} /> },
          { label: 'Staff Management', path: '/hospital/staff', icon: <UserCheck size={18} /> },
          { label: 'Patient Directory', path: '/hospital/patients', icon: <Users size={18} /> },
        ];

      case 'DOCTOR':
        return [
          { label: 'Clinical Dashboard', path: '/doctor/dashboard', icon: <Activity size={18} /> },
          { label: 'Patient Records', path: '/doctor/patients', icon: <Users size={18} /> },
          { label: 'Appointments', path: '/doctor/appointments', icon: <Calendar size={18} /> },
          { label: 'X-Ray Requests', path: '/doctor/xray-requests', icon: <FileText size={18} /> },
          { label: 'Imaging Studies', path: '/doctor/imaging', icon: <Camera size={18} /> },
        ];

      case 'CLINICAL_TECHNICIAN':
        return [
          { label: 'Technician Dashboard', path: '/clinical/dashboard', icon: <Activity size={18} /> },
          { label: 'X-Ray Work Queue', path: '/clinical/xray-queue', icon: <Radio size={18} /> },
          { label: 'Patient Info', path: '/clinical/patients', icon: <Users size={18} /> },
          { label: 'Ingested Imaging', path: '/clinical/imaging', icon: <Camera size={18} /> },
        ];

      default:
        return [];
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'HOSPITAL_ADMIN':
        return <Shield size={16} className="role-icon admin" />;
      case 'DOCTOR':
        return <Stethoscope size={16} className="role-icon doctor" />;
      case 'CLINICAL_TECHNICIAN':
        return <Radio size={16} className="role-icon tech" />;
      default:
        return null;
    }
  };

  const navItems = getNavItems();

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">R</div>
          <div className="brand-info">
            <span className="brand-name">RESPIRA AI</span>
            <span className="brand-sub">Hospital Node</span>
          </div>
        </div>

        {user && (
          <div className="user-card">
            <div className="user-avatar">{user.username.substring(0, 2).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">{user.first_name ? `${user.first_name} ${user.last_name}` : user.username}</span>
              <span className="user-role">
                {getRoleIcon(user.role)}
                {user.role_display || user.role}
              </span>
            </div>
          </div>
        )}

        <nav className="nav-menu">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <div className="header-title">
            <h1>Local Clinical Operating System</h1>
            <span className="badge-hospital-node">Node Status: Online</span>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};
