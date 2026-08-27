import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { auditService } from '../services/api';
import { CloudAuditLog } from '../types';

export const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<CloudAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await auditService.getAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to load cloud audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Operational Cloud Audit Event Log</h2>
      </div>

      <div className="info-banner">
        <strong>Privacy Audit Standard:</strong> This log records System Admin actions, node registrations, heartbeat status changes, and operational security events only.
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>System Actor</th>
              <th>Target Node</th>
              <th>Operational Action</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>Loading operational cloud audit logs...</td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>No operational audit events logged yet.</td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id}>
                  <td>{new Date(log.timestamp).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>{log.username || 'System'}</td>
                  <td>{log.node_identifier || '-'}</td>
                  <td><StatusBadge status={log.action} /></td>
                  <td>{log.details}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};
