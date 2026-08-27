import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatCard } from '../../components/ui/StatCard';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { patientService, appointmentService, xrayRequestService, imagingStudyService } from '../../services/api';
import { Patient, Appointment, XRayRequest, ImagingStudy } from '../../types';
import { Users, Calendar, FileText, Camera } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DoctorDashboard: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [xrayRequests, setXRayRequests] = useState<XRayRequest[]>([]);
  const [imagingStudies, setImagingStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [p, a, r, i] = await Promise.all([
          patientService.getPatients(),
          appointmentService.getAppointments(),
          xrayRequestService.getXRayRequests(),
          imagingStudyService.getImagingStudies(),
        ]);
        setPatients(p);
        setAppointments(a);
        setXRayRequests(r);
        setImagingStudies(i);
      } catch (err) {
        console.error('Failed to load doctor dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const readyForAiCount = imagingStudies.filter((s) => s.status === 'READY_FOR_AI').length;

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Attending Doctor Workspace</h2>
        <Link to="/doctor/xray-requests" className="btn btn-primary">
          <FileText size={16} />
          New X-Ray Request
        </Link>
      </div>

      {loading ? (
        <div>Loading clinical workspace...</div>
      ) : (
        <>
          <div className="card-grid">
            <StatCard title="Active Patients" value={patients.length} icon={<Users size={20} />} subtitle="Assigned medical records" />
            <StatCard title="Scheduled Consultations" value={appointments.length} icon={<Calendar size={20} />} subtitle="Appointments" />
            <StatCard title="X-Ray Imaging Requests" value={xrayRequests.length} icon={<FileText size={20} />} subtitle="Ordered scans" />
            <StatCard title="Studies Ready for AI" value={readyForAiCount} icon={<Camera size={20} />} subtitle="Acquired X-rays pending AI" />
          </div>

          <div className="section-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Recent X-Ray Requests</h3>
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
                {xrayRequests.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center' }}>No X-ray imaging requests created.</td>
                  </tr>
                ) : (
                  xrayRequests.map((req) => (
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
