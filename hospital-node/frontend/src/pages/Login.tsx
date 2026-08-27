import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Lock, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('dr_smith');
  const [password, setPassword] = useState('Password123!');
  const [selectedRole, setSelectedRole] = useState<Role>('DOCTOR');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    if (role === 'HOSPITAL_ADMIN') setUsername('hospadmin');
    if (role === 'DOCTOR') setUsername('dr_smith');
    if (role === 'CLINICAL_TECHNICIAN') setUsername('tech_john');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const loggedUser = await login({ username, password });
      if (loggedUser.role === 'HOSPITAL_ADMIN') navigate('/hospital/dashboard');
      else if (loggedUser.role === 'DOCTOR') navigate('/doctor/dashboard');
      else if (loggedUser.role === 'CLINICAL_TECHNICIAN') navigate('/clinical/dashboard');
      else navigate('/login');
    } catch (err: any) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">R</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>RESPIRA AI</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Local Hospital Node Portal</p>
        </div>

        <div className="role-switcher">
          <button
            type="button"
            className={`role-btn ${selectedRole === 'HOSPITAL_ADMIN' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('HOSPITAL_ADMIN')}
          >
            Admin
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'DOCTOR' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('DOCTOR')}
          >
            Doctor
          </button>
          <button
            type="button"
            className={`role-btn ${selectedRole === 'CLINICAL_TECHNICIAN' ? 'active' : ''}`}
            onClick={() => handleRoleSelect('CLINICAL_TECHNICIAN')}
          >
            Technician
          </button>
        </div>

        {error && (
          <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <UserIcon size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="form-control"
                style={{ width: '100%', paddingLeft: '2.25rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Authenticating...' : 'Sign In to Hospital Node'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
          Strictly for local hospital personnel. Patient data remains stored inside local node storage.
        </p>
      </div>
    </div>
  );
};
