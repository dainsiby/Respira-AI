import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { nodeService, hospitalService } from '../services/api';
import { HospitalNode, HospitalRegistry } from '../types';
import { Plus, Server, Slash, Wifi } from 'lucide-react';

export const Nodes: React.FC = () => {
  const [nodes, setNodes] = useState<HospitalNode[]>([]);
  const [hospitals, setHospitals] = useState<HospitalRegistry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [hospitalId, setHospitalId] = useState<number | ''>('');
  const [nodeId, setNodeId] = useState('');
  const [version, setVersion] = useState('1.0.0');

  const loadData = async () => {
    try {
      const [nData, hData] = await Promise.all([
        nodeService.getNodes(),
        hospitalService.getHospitals(),
      ]);
      setNodes(nData);
      setHospitals(hData);
      if (hData.length > 0) setHospitalId(hData[0].id);
    } catch (err) {
      console.error('Failed to load nodes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!hospitalId || !nodeId) return;

    try {
      await nodeService.createNode({
        hospital: Number(hospitalId),
        node_id: nodeId,
        installed_version: version,
      });
      setIsModalOpen(false);
      setNodeId('');
      loadData();
    } catch (err: any) {
      const msg = err.response?.data?.node_id?.[0] || err.response?.data?.error || 'Failed to register node.';
      setError(msg);
    }
  };

  const handleToggleDisable = async (node: HospitalNode) => {
    const newStatus = node.status === 'DISABLED' ? 'ONLINE' : 'DISABLED';
    try {
      await nodeService.updateNodeStatus(node.id, newStatus);
      loadData();
    } catch (err) {
      console.error('Failed to update node status:', err);
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Edge Node Registry</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Register Edge Node
        </button>
      </div>

      <div className="info-banner">
        <strong>Edge Security Architecture:</strong> Node API credentials are standard hash-verified tokens. Raw secrets are never exposed in administrative views.
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Node ID</th>
              <th>Hospital Partner</th>
              <th>Status</th>
              <th>Installed Software Version</th>
              <th>Last Heartbeat</th>
              <th>Registered Date</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Loading node registry...</td>
              </tr>
            ) : nodes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>No edge nodes registered yet.</td>
              </tr>
            ) : (
              nodes.map((n) => (
                <tr key={n.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{n.node_id}</td>
                  <td>{n.hospital_name} ({n.hospital_code})</td>
                  <td><StatusBadge status={n.status} /></td>
                  <td>v{n.installed_version}</td>
                  <td>{n.last_heartbeat ? new Date(n.last_heartbeat).toLocaleString() : 'Never'}</td>
                  <td>{new Date(n.registered_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${n.status === 'DISABLED' ? 'btn-secondary' : 'btn-danger'}`}
                      onClick={() => handleToggleDisable(n)}
                    >
                      {n.status === 'DISABLED' ? <Wifi size={14} /> : <Slash size={14} />}
                      {n.status === 'DISABLED' ? 'Enable Node' : 'Disable Node'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register New Edge Node">
        {error && <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleCreateNode}>
          <div className="form-group">
            <label>Select Partner Hospital</label>
            <select className="form-control" value={hospitalId} onChange={(e) => setHospitalId(Number(e.target.value))} required>
              {hospitals.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.hospital_code})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Unique Node ID (e.g. NODE-003)</label>
            <input type="text" className="form-control" value={nodeId} onChange={(e) => setNodeId(e.target.value)} required placeholder="NODE-003" />
          </div>

          <div className="form-group">
            <label>Installed Software Version</label>
            <input type="text" className="form-control" value={version} onChange={(e) => setVersion(e.target.value)} required placeholder="1.0.0" />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Edge Node</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
