import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { userService, patientService, xrayRequestService, auditService } from '../../services/api';
import { User, Patient, XRayRequest, AuditLog } from '../../types';
import { Users, UserCheck, FileText, Activity } from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [requests, setRequests] = useState<XRayRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [u, p, r, l] = await Promise.all([
          userService.getUsers(),
          patientService.getPatients(),
          xrayRequestService.getXRayRequests(),
          auditService.getAuditLogs(),
        ]);
        setUsers(u);
        setPatients(p);
        setRequests(r);
        setLogs(l);
      } catch (err) {
        console.error('Failed to load admin dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const doctorsCount = users.filter((u) => u.role === 'DOCTOR').length;
  const techCount = users.filter((u) => u.role === 'CLINICAL_TECHNICIAN').length;
  const activePatientsCount = patients.filter((p) => p.is_active).length;

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Administrator Overview</h2>
      </div>

      {loading ? (
        <div>Loading dashboard metrics...</div>
      ) : (
        <>
          <div className="card-grid">
            <StatCard title="Active Patients" value={activePatientsCount} icon={<Users size={20} />} subtitle="Master patient directory" />
            <StatCard title="Attending Doctors" value={doctorsCount} icon={<UserCheck size={20} />} subtitle="Medical staff" />
            <StatCard title="Clinical Technicians" value={techCount} icon={<Activity size={20} />} subtitle="Imaging staff" />
            <StatCard title="Total X-Ray Requests" value={requests.length} icon={<FileText size={20} />} subtitle="Imaging workflow count" />
          </div>

          <div className="section-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Security Audit Log (Recent Events)</h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Staff Member</th>
                  <th>Action</th>
                  <th>Target Record</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No audit logs recorded yet.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.username || 'System'}</td>
                      <td><StatusBadge status={log.action} /></td>
                      <td>{log.target_repr || '-'}</td>
                      <td>{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AppShell>
  );
};
