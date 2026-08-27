import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { patientService } from '../../services/api';
import { Patient } from '../../types';

export const ClinicalPatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await patientService.getPatients();
        setPatients(data);
      } catch (err) {
        console.error('Failed to load patient records:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Patient Directory (Imaging Lookup)</h2>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Full Name</th>
              <th>Date of Birth</th>
              <th>Gender</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>Loading patient records...</td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center' }}>No patient records available.</td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{p.patient_id}</td>
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.date_of_birth}</td>
                  <td>{p.gender}</td>
                  <td><StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
};
