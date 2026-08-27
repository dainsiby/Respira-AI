import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { hospitalPortalService } from '../services/api';
import { InstallerStatusResponse } from '../types';
import { Download, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const HospitalInstallerView: React.FC = () => {
  const [installer, setInstaller] = useState<InstallerStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await hospitalPortalService.getInstallerStatus();
        setInstaller(data);
      } catch (err) {
        console.error('Failed to load installer status:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Node Installer Access</h2>
      </div>

      {loading ? (
        <div>Checking installer eligibility...</div>
      ) : installer ? (
        <div style={{ background: '#1e293b', borderRadius: '10px', padding: '2rem', border: '1px solid #334155', maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <Download size={28} style={{ color: installer.eligible ? '#38bdf8' : '#94a3b8' }} />
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                Hospital Node Installer — Coming in Task 5P
              </h3>
              <span style={{ fontSize: '0.85rem', color: installer.eligible ? '#34d399' : '#f87171' }}>
                {installer.eligible ? 'Approved & Installer Eligible' : 'Ineligible (Application Pending/Rejected)'}
              </span>
            </div>
          </div>

          <div style={{ background: '#0f172a', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem', border: '1px solid #334155' }}>
            <p style={{ margin: '0 0 0.75rem 0', color: '#e2e8f0', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {installer.message}
            </p>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>
              The Hospital Node Edge package allows local deployment of the DICOM/X-ray directory watcher, clinical database, and local AI processing pipeline.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: installer.eligible ? '#10b981' : '#94a3b8', fontSize: '0.875rem' }}>
              {installer.eligible ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>Cloud Onboarding Approval Status</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b', fontSize: '0.875rem' }}>
              <AlertTriangle size={16} />
              <span>Installer Executable Delivery: Scheduled for Task 5P</span>
            </div>
          </div>

          <button
            className="btn btn-primary"
            disabled
            style={{
              width: '100%',
              padding: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              opacity: 0.5,
              cursor: 'not-allowed',
              background: '#334155',
              borderColor: '#475569'
            }}
          >
            <Download size={18} /> Download Hospital Node Installer (Task 5P)
          </button>
        </div>
      ) : (
        <div>Failed to load installer status.</div>
      )}
    </AppShell>
  );
};
