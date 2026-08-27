import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { xrayRequestService, imagingStudyService, patientService } from '../../services/api';
import { XRayRequest, ImagingStudy } from '../../types';
import { Radio, Camera, Clock, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ClinicalDashboard: React.FC = () => {
  const [requests, setRequests] = useState<XRayRequest[]>([]);
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [patientCount, setPatientCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, s, p] = await Promise.all([
          xrayRequestService.getXRayRequests(),
          imagingStudyService.getImagingStudies(),
          patientService.getPatients(),
        ]);
        setRequests(r);
        setStudies(s);
        setPatientCount(p.length);
      } catch (err) {
        console.error('Failed to load technician dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const requestedCount = requests.filter((r) => r.status === 'REQUESTED').length;
  const inProgressCount = requests.filter((r) => r.status === 'IN_PROGRESS' || r.status === 'ASSIGNED').length;
  const acquiredCount = requests.filter((r) => r.status === 'ACQUIRED').length;

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Clinical Radiology Technician Workspace</h2>
        <Link to="/clinical/xray-queue" className="btn btn-primary">
          <Radio size={16} />
          View X-Ray Work Queue
        </Link>
      </div>

      <div className="info-banner">
        <strong>Automatic Image Ingestion Notice:</strong> There is NO manual image upload button. Hospital X-ray hardware saves images directly into <code>storage/incoming_xrays/</code>, where RESPIRA AI automatically detects and matches them with patient orders.
      </div>

      {loading ? (
        <div>Loading technician workspace...</div>
      ) : (
        <>
          <div className="card-grid">
            <StatCard title="Pending Requests" value={requestedCount} icon={<Clock size={20} />} subtitle="Awaiting assignment" />
            <StatCard title="In Acquisition" value={inProgressCount} icon={<Radio size={20} />} subtitle="Active scans" />
            <StatCard title="Acquired Scans" value={acquiredCount} icon={<CheckCircle size={20} />} subtitle="Image acquired" />
            <StatCard title="Ingested Studies" value={studies.length} icon={<Camera size={20} />} subtitle="Ready for AI pipeline" />
          </div>

          <div className="section-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Active Work Queue</h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Patient</th>
                  <th>Clinical Indication</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Requested Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>Work queue empty.</td>
                  </tr>
                ) : (
                  requests.map((req) => (
                    <tr key={req.id}>
                      <td style={{ fontWeight: 600, color: '#3b82f6' }}>{req.request_id}</td>
                      <td>{req.patient_name || req.patient}</td>
                      <td>{req.clinical_indication}</td>
                      <td><StatusBadge status={req.priority} /></td>
                      <td><StatusBadge status={req.status} /></td>
                      <td>{new Date(req.requested_at).toLocaleDateString()}</td>
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
