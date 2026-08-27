import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { dashboardService, auditService } from '../services/api';
import { CloudDashboardMetrics, CloudAuditLog } from '../types';
import { Building2, Server, Activity, ShieldCheck, Wifi, WifiOff, Slash } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<CloudDashboardMetrics | null>(null);
  const [logs, setLogs] = useState<CloudAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [m, l] = await Promise.all([
          dashboardService.getMetrics(),
          auditService.getAuditLogs(),
        ]);
        setMetrics(m);
        setLogs(l);
      } catch (err) {
        console.error('Failed to load cloud metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Cloud Control Plane Operational Dashboard</h2>
        {metrics && <StatusBadge status={metrics.system_status} />}
      </div>

      <div className="info-banner">
        <strong>Privacy Architecture Guarantee:</strong> The RESPIRA AI Cloud Control Plane stores ONLY operational telemetry, hospital metadata, and node status. Zero patient names, diagnoses, X-ray images, or medical histories are transmitted or stored on Cloud infrastructure.
      </div>

      {loading ? (
        <div>Loading global infrastructure metrics...</div>
      ) : metrics ? (
        <>
          <div className="card-grid">
            <StatCard title="Registered Hospitals" value={metrics.registered_hospitals} icon={<Building2 size={20} />} subtitle={`${metrics.active_hospitals} active clinical partners`} />
            <StatCard title="Total Hospital Nodes" value={metrics.total_nodes} icon={<Server size={20} />} subtitle="Distributed edge nodes" />
            <StatCard title="Online Nodes" value={metrics.online_nodes} icon={<Wifi size={20} />} subtitle="Active heartbeat signals" />
            <StatCard title="Offline Nodes" value={metrics.offline_nodes} icon={<WifiOff size={20} />} subtitle="Heartbeat threshold exceeded" />
            <StatCard title="Disabled Nodes" value={metrics.disabled_nodes} icon={<Slash size={20} />} subtitle="Administratively disabled" />
          </div>

          <div className="section-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent Operational Cloud Events</h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Node</th>
                  <th>Action</th>
                  <th>Operational Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8' }}>No operational cloud logs recorded.</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.username || 'System'}</td>
                      <td>{log.node_identifier || '-'}</td>
                      <td><StatusBadge status={log.action} /></td>
                      <td>{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div>Failed to load metrics.</div>
      )}
    </AppShell>
  );
};
