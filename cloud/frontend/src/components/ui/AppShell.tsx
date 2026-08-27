import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Cloud,
  Building2,
  Server,
  Cpu,
  Layers,
  ShieldAlert,
  LogOut,
  ShieldCheck,
  FileCheck,
  Download,
  Activity
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

  const isHospital = user?.role === 'HOSPITAL';

  const adminNavItems = [
    { label: 'Cloud Overview', path: '/dashboard', icon: <Cloud size={18} /> },
    { label: 'Onboarding Queue', path: '/hospital-applications', icon: <FileCheck size={18} /> },
    { label: 'Hospital Registry', path: '/hospitals', icon: <Building2 size={18} /> },
    { label: 'Node Registry', path: '/nodes', icon: <Server size={18} /> },
    { label: 'FL Coordinator', path: '/federation', icon: <Cpu size={18} /> },
    { label: 'Global Models', path: '/models', icon: <Layers size={18} /> },
    { label: 'Audit Event Log', path: '/audit-logs', icon: <ShieldAlert size={18} /> },
  ];

  const hospitalNavItems = [
    { label: 'Hospital Portal', path: '/hospital/dashboard', icon: <Activity size={18} /> },
    { label: 'Application Status', path: '/hospital/application', icon: <FileCheck size={18} /> },
    { label: 'Hospital Nodes', path: '/hospital/nodes', icon: <Server size={18} /> },
    { label: 'Node Installer', path: '/hospital/installer', icon: <Download size={18} /> },
  ];

  const navItems = isHospital ? hospitalNavItems : adminNavItems;

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">R</div>
          <div className="brand-info">
            <span className="brand-name">RESPIRA AI</span>
            <span className="brand-sub">{isHospital ? 'Hospital Cloud Portal' : 'Cloud Control Plane'}</span>
          </div>
        </div>

        {user && (
          <div className="user-card">
            <div className="user-avatar">{isHospital ? 'HC' : 'SA'}</div>
            <div className="user-details">
              <span className="user-name">{user.username}</span>
              <span className="user-role">
                <ShieldCheck size={14} style={{ color: isHospital ? '#10b981' : '#3b82f6' }} />
                {user.role_display}
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
            <h1>{isHospital ? 'Hospital Cloud Portal' : 'Global Federation & Control Plane'}</h1>
            <span className="badge-cloud-status">{isHospital ? 'Hospital Cloud Account' : 'Cloud Core: Active'}</span>
          </div>
        </header>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
};
