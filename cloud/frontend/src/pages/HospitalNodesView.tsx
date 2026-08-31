import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { hospitalPortalService } from '../services/api';
import { HospitalNode } from '../types';
import { Server, Wifi, WifiOff } from 'lucide-react';

export const HospitalNodesView: React.FC = () => {
  const [nodes, setNodes] = useState<HospitalNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await hospitalPortalService.getNodes();
        setNodes(data);
      } catch (err) {
        console.error('Failed to load hospital nodes:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Registered Hospital Edge Nodes</h2>
      </div>

      {loading ? (
        <div>Loading node records...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Hospital Code</th>
                <th>Status</th>
                <th>Live Connection</th>
                <th>Version</th>
                <th>Last Heartbeat</th>
              </tr>
            </thead>
            <tbody>
              {nodes.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8' }}>
                    No Hospital Nodes registered yet for this hospital. Once installed, registered nodes will appear here automatically.
                  </td>
                </tr>
              ) : (
                nodes.map((node) => (
                  <tr key={node.id}>
                    <td><strong>{node.node_id}</strong></td>
                    <td>{node.hospital_code}</td>
                    <td><StatusBadge status={node.status} /></td>
                    <td>
                      {node.is_online_status ? (
                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Wifi size={14} /> ONLINE
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <WifiOff size={14} /> OFFLINE
                        </span>
                      )}
                    </td>
                    <td>v{node.installed_version}</td>
                    <td>{node.last_heartbeat ? new Date(node.last_heartbeat).toLocaleString() : 'Never'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
};
