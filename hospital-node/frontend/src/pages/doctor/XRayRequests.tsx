import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { xrayRequestService, patientService } from '../../services/api';
import { XRayRequest, Patient } from '../../types';
import { FilePlus } from 'lucide-react';

export const DoctorXRayRequests: React.FC = () => {
  const [requests, setRequests] = useState<XRayRequest[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [patientId, setPatientId] = useState<number | ''>('');
  const [indication, setIndication] = useState('');
  const [priority, setPriority] = useState<'ROUTINE' | 'URGENT'>('ROUTINE');

  const loadData = async () => {
    try {
      const [reqData, patData] = await Promise.all([
        xrayRequestService.getXRayRequests(),
        patientService.getPatients(),
      ]);
      setRequests(reqData);
      setPatients(patData);
      if (patData.length > 0) setPatientId(patData[0].id);
    } catch (err) {
      console.error('Failed to load X-ray requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !indication) return;

    try {
      await xrayRequestService.createXRayRequest({
        patient: Number(patientId),
        clinical_indication: indication,
        priority,
      });
      setIsModalOpen(false);
      setIndication('');
      loadData();
    } catch (err) {
      console.error('Failed to create X-ray request:', err);
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Chest X-Ray Imaging Orders</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <FilePlus size={16} />
          Create X-Ray Request
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Patient</th>
              <th>Clinical Indication</th>
              <th>Priority</th>
              <th>Workflow Status</th>
              <th>Assigned Technician</th>
              <th>Requested Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Loading imaging requests...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>No X-ray requests ordered yet.</td>
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
                  <td>{new Date(r.requested_at).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Order Chest X-Ray Scan">
        <form onSubmit={handleCreateRequest}>
          <div className="form-group">
            <label>Select Patient</label>
            <select className="form-control" value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} required>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.patient_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select className="form-control" value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="ROUTINE">Routine Scan</option>
              <option value="URGENT">Urgent Scan</option>
            </select>
          </div>

          <div className="form-group">
            <label>Clinical Indication / Diagnostic Objective</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Evaluate lower lobe opacity / persistent cough"
              value={indication}
              onChange={(e) => setIndication(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Submit X-Ray Order</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
