import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { imagingStudyService } from '../../services/api';
import { ImagingStudy } from '../../types';

export const ClinicalImaging: React.FC = () => {
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
        <h2 className="section-title">Ingested Imaging Studies Status</h2>
      </div>

      <div className="info-banner">
        <strong>Automatic Folder Watcher Operational:</strong> All incoming DICOM/PNG files dropped into <code>storage/incoming_xrays/</code> are parsed, validated, and linked to patient X-ray requests automatically. Manual browser upload is disabled to enforce PACS clinical security.
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
              <th>Ingested Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Loading ingested imaging studies...</td>
              </tr>
            ) : studies.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>No ingested imaging studies found. Save an X-ray image in incoming_xrays directory to test automatic watcher.</td>
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
