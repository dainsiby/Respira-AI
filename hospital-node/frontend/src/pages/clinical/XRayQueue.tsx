import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { xrayRequestService } from '../../services/api';
import { XRayRequest } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Play, Check, Clock } from 'lucide-react';

export const ClinicalXRayQueue: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<XRayRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const loadQueue = async () => {
    try {
      const data = await xrayRequestService.getXRayRequests();
      setRequests(data);
    } catch (err) {
      console.error('Failed to load X-ray queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleUpdateStatus = async (request: XRayRequest, newStatus: 'ASSIGNED' | 'IN_PROGRESS' | 'ACQUIRED') => {
    setError('');
    try {
      const payload: Partial<XRayRequest> = { status: newStatus };
      if (newStatus === 'ASSIGNED' && user) {
        payload.assigned_technician = user.id;
      }
      await xrayRequestService.updateXRayRequest(request.id, payload);
      loadQueue();
    } catch (err: any) {
      const msg = err.response?.data?.status || err.response?.data?.error || 'Invalid state transition.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Radiology X-Ray Work Queue & Workflow State</h2>
      </div>

      <div className="info-banner">
        <strong>Automatic Acquisition Notice:</strong> When you complete the physical scan on the X-ray machine, save the file to <code>incoming_xrays/</code> folder. RESPIRA AI will automatically validate it and update status to <code>ACQUIRED</code> and <code>READY_FOR_AI</code>.
      </div>

      {error && <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Patient</th>
              <th>Clinical Indication</th>
              <th>Priority</th>
              <th>Current Status</th>
              <th>Assigned Tech</th>
              <th>Workflow Transition Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Loading work queue...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Work queue empty.</td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{r.request_id}</td>
                  <td>{r.patient_name || r.patient}</td>
                  <td>{r.clinical_indication}</td>
                  <td><StatusBadge status={r.priority} /></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{r.assigned_technician_username || 'Unassigned'}</td>
                  <td>
                    {r.status === 'REQUESTED' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(r, 'ASSIGNED')}>
                        <Clock size={12} /> Assign to Self
                      </button>
                    )}
                    {r.status === 'ASSIGNED' && (
                      <button className="btn btn-sm btn-secondary" onClick={() => handleUpdateStatus(r, 'IN_PROGRESS')}>
                        <Play size={12} /> Start Scan
                      </button>
                    )}
                    {r.status === 'IN_PROGRESS' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(r, 'ACQUIRED')}>
                        <Check size={12} /> Mark Acquired
                      </button>
                    )}
                    {r.status === 'ACQUIRED' && (
                      <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>Acquired & Ingested</span>
                    )}
                    {r.status === 'CANCELLED' && (
                      <span style={{ fontSize: '0.75rem', color: '#f87171' }}>Cancelled</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};
