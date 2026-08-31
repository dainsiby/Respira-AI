import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { imagingStudyService } from '../../services/api';
import { ImagingStudy } from '../../types';

export const DoctorImaging: React.FC = () => {
  const [studies, setStudies] = useState<ImagingStudy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await imagingStudyService.getImagingStudies();
        setStudies(data);
      } catch (err) {
        console.error('Failed to load imaging studies:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Acquired Imaging Studies</h2>
      </div>

      <div className="info-banner">
        <strong>Automatic Image Ingestion Active:</strong> Chest X-ray images acquired by local PACS/X-ray hardware are automatically validated, matched with patient orders, and marked <code>READY_FOR_AI</code>.
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Study ID</th>
              <th>Patient</th>
              <th>X-Ray Order</th>
              <th>Format</th>
              <th>Modality</th>
              <th>Ingestion Status</th>
              <th>AI Diagnosis Status</th>
              <th>Ingested Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>Loading acquired imaging studies...</td>
              </tr>
            ) : studies.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>No imaging studies ingested yet. Place a test file in incoming_xrays folder.</td>
              </tr>
            ) : (
              studies.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{s.study_id}</td>
                  <td>{s.patient_name || s.patient}</td>
                  <td>{s.xray_request_id || '-'}</td>
                  <td><StatusBadge status={s.file_format} type="info" /></td>
                  <td>{s.modality}</td>
                  <td><StatusBadge status={s.status} /></td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic' }}>
                      AI analysis pending / not implemented (Task 5G)
                    </span>
                  </td>
                  <td>{new Date(s.ingested_at).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};
