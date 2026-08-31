import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { hospitalPortalService } from '../services/api';
import { HospitalApplication } from '../types';
import { FileCheck, Building2, Mail, Phone, MapPin, User as UserIcon, Calendar } from 'lucide-react';

export const HospitalApplicationView: React.FC = () => {
  const [app, setApp] = useState<HospitalApplication | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await hospitalPortalService.getApplication();
        setApp(data);
      } catch (err) {
        console.error('Failed to load application:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Onboarding Application</h2>
        {app && <StatusBadge status={app.status} />}
      </div>

      {loading ? (
        <div>Loading application details...</div>
      ) : app ? (
        <div style={{ background: '#1e293b', borderRadius: '10px', padding: '1.5rem', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>{app.hospital_name}</h3>
              <span style={{ fontSize: '0.875rem', color: '#38bdf8' }}>Application ID: {app.application_id}</span>
            </div>
            {app.hospital_code && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>Assigned Hospital Code</span>
                <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{app.hospital_code}</strong>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={16} /> Hospital Information
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>Official Email:</strong> {app.official_email}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>Phone:</strong> {app.phone || 'N/A'}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>Contact Person:</strong> {app.contact_person || 'N/A'}
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '0.95rem', color: '#cbd5e1', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} /> Location Details
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>City:</strong> {app.city || 'N/A'}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>State:</strong> {app.state || 'N/A'}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>Country:</strong> {app.country || 'N/A'}
              </p>
              <p style={{ margin: '0 0 0.5rem 0', color: '#94a3b8', fontSize: '0.9rem' }}>
                <strong>Address:</strong> {app.address || 'N/A'}
              </p>
            </div>
          </div>

          <div style={{ borderTop: '1px solid #334155', marginTop: '1.5rem', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '0.8rem' }}>
            <span>Submitted: {new Date(app.submitted_at).toLocaleString()}</span>
            {app.reviewed_at && <span>Reviewed: {new Date(app.reviewed_at).toLocaleString()} by {app.reviewed_by_username || 'System Admin'}</span>}
          </div>
        </div>
      ) : (
        <div>No application records found.</div>
      )}
    </AppShell>
  );
};
