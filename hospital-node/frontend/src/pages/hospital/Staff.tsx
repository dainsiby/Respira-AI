import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { userService } from '../../services/api';
import { User, Role } from '../../types';
import { UserPlus, UserCheck, UserX } from 'lucide-react';

export const StaffManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<Role>('DOCTOR');

  const loadUsers = async () => {
    try {
      const data = await userService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await userService.createUser({
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });
      setIsModalOpen(false);
      setUsername('');
      setPassword('');
      setFirstName('');
      setLastName('');
      loadUsers();
    } catch (err: any) {
      const msg = err.response?.data?.username?.[0] || err.response?.data?.error || 'Failed to create user account.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (userObj: User) => {
    try {
      await userService.toggleActiveStatus(userObj.id);
      loadUsers();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Local Staff Management</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <UserPlus size={16} />
          Create New Staff Member
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Full Name</th>
              <th>Role</th>
              <th>Account Status</th>
              <th>Date Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>Loading staff records...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No staff members created yet.</td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>{u.username}</td>
                  <td>{u.first_name || u.last_name ? `${u.first_name} ${u.last_name}` : '-'}</td>
                  <td><StatusBadge status={u.role} /></td>
                  <td>
                    <StatusBadge status={u.is_active ? 'ACTIVE' : 'INACTIVE'} type={u.is_active ? 'success' : 'error'} />
                  </td>
                  <td>{u.date_joined ? new Date(u.date_joined).toLocaleDateString() : '-'}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${u.is_active ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.is_active ? <UserX size={14} /> : <UserCheck size={14} />}
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Local Hospital Staff">
        {error && <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleCreateStaff}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" className="form-control" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Password (Min 6 chars)</label>
            <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input type="text" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              <option value="DOCTOR">Doctor</option>
              <option value="CLINICAL_TECHNICIAN">Clinical Technician</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Staff Member'}
            </button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
