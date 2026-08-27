import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { hospitalPortalService } from '../services/api';
import { HospitalProfileResponse, HospitalApplication, HospitalNode, InstallerStatusResponse } from '../types';
import { Building2, Server, Download, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const HospitalDashboard: React.FC = () => {
  const [profile, setProfile] = useState<HospitalProfileResponse | null>(null);
  const [application, setApplication] = useState<HospitalApplication | null>(null);
  const [nodes, setNodes] = useState<HospitalNode[]>([]);
  const [installer, setInstaller] = useState<InstallerStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, app, n, inst] = await Promise.all([
          hospitalPortalService.getProfile(),
          hospitalPortalService.getApplication().catch(() => null),
          hospitalPortalService.getNodes().catch(() => []),
          hospitalPortalService.getInstallerStatus().catch(() => null),
        ]);
        setProfile(p);
        setApplication(app);
        setNodes(n);
        setInstaller(inst);
      } catch (err) {
        console.error('Failed to load hospital portal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Cloud Account Overview</h2>
        {application && <StatusBadge status={application.status} />}
      </div>

      <div className="info-banner">
        <strong>Privacy Architecture Guarantee:</strong> Your Hospital Cloud Account provides operational telemetry, onboarding status, and node connectivity management. Zero patient names, diagnoses, X-ray images, DICOM metadata, or local clinical data enter the Cloud.
      </div>

      {loading ? (
        <div>Loading hospital onboarding status...</div>
      ) : (
        <>
          <div className="card-grid">
            <StatCard
              title="Application Status"
              value={application ? application.status : 'NONE'}
              icon={application?.status === 'APPROVED' ? <CheckCircle2 size={20} style={{ color: '#10b981' }} /> : application?.status === 'REJECTED' ? <XCircle size={20} style={{ color: '#ef4444' }} /> : <Clock size={20} style={{ color: '#f59e0b' }} />}
              subtitle={application ? `Submitted ${new Date(application.submitted_at).toLocaleDateString()}` : 'No application found'}
            />

            <StatCard
              title="Hospital Code"
              value={profile?.hospital_code || 'Pending'}
              icon={<Building2 size={20} />}
              subtitle={profile?.hospital_code ? 'Active Cloud Registry ID' : 'Generated upon approval'}
            />

            <StatCard
              title="Registered Nodes"
              value={nodes.length}
              icon={<Server size={20} />}
              subtitle="Edge Hospital Nodes"
            />

            <StatCard
              title="Installer Eligibility"
              value={installer?.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}
              icon={<Download size={20} />}
              subtitle={installer?.eligible ? 'Approved for node deployment' : 'Requires System Admin approval'}
            />
          </div>

          {/* Detailed Status Section */}
          <div style={{ background: '#1e293b', borderRadius: '10px', padding: '1.5rem', border: '1px solid #334155', marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#f8fafc', marginBottom: '1rem' }}>
              Onboarding Application & Node Status
            </h3>

            {application?.status === 'APPROVED' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ color: '#34d399', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle2 size={18} /> Hospital Onboarding Approved
                </h4>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>
                  Your hospital application has been approved by the System Administrator. Your unique Hospital Code is <strong>{profile?.hospital_code}</strong>.
                </p>
              </div>
            )}

            {application?.status === 'PENDING' && (
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ color: '#fbbf24', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={18} /> Application Pending System Admin Review
                </h4>
                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.9rem' }}>
                  Your application <strong>{application.application_id}</strong> is currently being reviewed. Your hospital code will be assigned upon approval.
                </p>
              </div>
            )}

            {application?.status === 'REJECTED' && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', padding: '1rem', marginBottom: '1rem' }}>
                <h4 style={{ color: '#f87171', margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <XCircle size={18} /> Application Rejected
                </h4>
                <p style={{ margin: '0 0 0.5rem 0', color: '#e2e8f0', fontSize: '0.9rem' }}>
                  Your onboarding application was rejected.
                </p>
                {application.rejection_reason && (
                  <div style={{ background: '#0f172a', padding: '0.75rem', borderRadius: '6px', fontSize: '0.85rem', color: '#f87171' }}>
                    Reason: {application.rejection_reason}
                  </div>
                )}
              </div>
            )}

            {/* Installer Availability Section */}
            <div style={{ borderTop: '1px solid #334155', paddingTop: '1rem', marginTop: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '0.5rem' }}>Hospital Node Installer Status</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1rem' }}>
                {installer?.message || 'Hospital Node installer status unavailable.'}
              </p>
              <button className="btn btn-secondary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                Download Hospital Node Installer (Coming in Task 5P)
              </button>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
};
