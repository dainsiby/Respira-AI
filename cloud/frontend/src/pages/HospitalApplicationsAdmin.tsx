import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { hospitalApplicationAdminService } from '../services/api';
import { HospitalApplication } from '../types';
import { FileCheck, CheckCircle2, XCircle, Clock, Eye, Building2, MapPin, Mail, Phone, User as UserIcon } from 'lucide-react';

export const HospitalApplicationsAdmin: React.FC = () => {
  const [applications, setApplications] = useState<HospitalApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedApp, setSelectedApp] = useState<HospitalApplication | null>(null);

  const [rejectModalOpen, setRejectModalOpen] = useState<boolean>(false);
  const [rejectAppId, setRejectAppId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string>('');

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await hospitalApplicationAdminService.getApplications();
      setApplications(data);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleApprove = async (id: number) => {
    if (!window.confirm('Approve this hospital onboarding application? This will generate a unique Hospital Code and activate installer eligibility.')) return;
    setIsProcessing(true);
    setActionMessage('');
    try {
      const res = await hospitalApplicationAdminService.approveApplication(id);
      setActionMessage(`Approved! Assigned Hospital Code: ${res.hospital_code}`);
      loadApplications();
      if (selectedApp?.id === id) {
        setSelectedApp(res.application);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve application.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenRejectModal = (id: number) => {
    setRejectAppId(id);
    setRejectionReason('Incomplete or unverified hospital documentation.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectAppId) return;
    setIsProcessing(true);
    try {
      const res = await hospitalApplicationAdminService.rejectApplication(rejectAppId, rejectionReason);
      setActionMessage(`Application rejected.`);
      setRejectModalOpen(false);
      loadApplications();
      if (selectedApp?.id === rejectAppId) {
        setSelectedApp(res.application);
      }
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject application.');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredApps = filterStatus === 'ALL'
    ? applications
    : applications.filter(a => a.status === filterStatus);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Onboarding Queue Management</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
            <button
              key={st}
              className={`btn ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              onClick={() => setFilterStatus(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {actionMessage && (
        <div className="status-badge badge-online" style={{ width: '100%', marginBottom: '1rem', padding: '0.75rem', textAlign: 'center' }}>
          {actionMessage}
        </div>
      )}

      {loading ? (
        <div>Loading onboarding queue...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>App ID</th>
                <th>Hospital Name</th>
                <th>Applicant Account</th>
                <th>Official Email</th>
                <th>City / Country</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8' }}>
                    No hospital onboarding applications found.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id}>
                    <td><strong>{app.application_id}</strong></td>
                    <td>{app.hospital_name}</td>
                    <td>{app.username}</td>
                    <td>{app.official_email}</td>
                    <td>{app.city ? `${app.city}, ${app.country}` : app.country || '-'}</td>
                    <td>{new Date(app.submitted_at).toLocaleDateString()}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                          onClick={() => setSelectedApp(app)}
                        >
                          <Eye size={14} /> Detail
                        </button>

                        {app.status === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: '#10b981', borderColor: '#059669' }}
                              onClick={() => handleApprove(app.id)}
                              disabled={isProcessing}
                            >
                              <CheckCircle2 size={14} /> Approve
                            </button>

                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#f87171', borderColor: '#ef4444' }}
                              onClick={() => handleOpenRejectModal(app.id)}
                              disabled={isProcessing}
                            >
                              <XCircle size={14} /> Reject
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Application Detail Modal */}
      {selectedApp && (
        <Modal isOpen={!!selectedApp} title={`Application ${selectedApp.application_id}`} onClose={() => setSelectedApp(null)}>
          <div style={{ padding: '0.5rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#f8fafc' }}>{selectedApp.hospital_name}</h3>
              <StatusBadge status={selectedApp.status} />
            </div>

            {selectedApp.hospital_code && (
              <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Generated Hospital Code: </span>
                <strong style={{ color: '#10b981', fontSize: '1rem' }}>{selectedApp.hospital_code}</strong>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              <div>
                <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8' }}><strong>Official Email:</strong> {selectedApp.official_email}</p>
                <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8' }}><strong>Phone:</strong> {selectedApp.phone || 'N/A'}</p>
                <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8' }}><strong>Contact Person:</strong> {selectedApp.contact_person || 'N/A'}</p>
              </div>

              <div>
                <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8' }}><strong>City/State:</strong> {selectedApp.city} {selectedApp.state}</p>
                <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8' }}><strong>Country:</strong> {selectedApp.country}</p>
                <p style={{ margin: '0 0 0.4rem 0', color: '#94a3b8' }}><strong>Address:</strong> {selectedApp.address || 'N/A'}</p>
              </div>
            </div>

            {selectedApp.rejection_reason && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', color: '#f87171', fontSize: '0.85rem' }}>
                <strong>Rejection Reason:</strong> {selectedApp.rejection_reason}
              </div>
            )}

            {selectedApp.status === 'PENDING' && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', borderTop: '1px solid #334155', paddingTop: '1rem' }}>
                <button className="btn btn-primary" style={{ flex: 1, background: '#10b981', borderColor: '#059669' }} onClick={() => handleApprove(selectedApp.id)}>
                  Approve Application
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, color: '#f87171', borderColor: '#ef4444' }} onClick={() => handleOpenRejectModal(selectedApp.id)}>
                  Reject Application
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <Modal isOpen={rejectModalOpen} title="Reject Hospital Onboarding Application" onClose={() => setRejectModalOpen(false)}>
          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Specify the reason for rejecting this hospital application:
            </p>
            <div className="form-group">
              <label>Rejection Reason *</label>
              <textarea
                className="form-control"
                rows={4}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                style={{ width: '100%', background: '#0f172a', color: '#f8fafc', padding: '0.75rem', borderRadius: '6px', border: '1px solid #334155' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setRejectModalOpen(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" style={{ flex: 1, background: '#ef4444', borderColor: '#dc2626' }} onClick={handleConfirmReject} disabled={isProcessing}>
                Confirm Rejection
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
};
