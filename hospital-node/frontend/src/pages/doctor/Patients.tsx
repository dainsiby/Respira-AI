import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { patientService } from '../../services/api';
import { Patient, MedicalHistory } from '../../types';
import { UserPlus, FileText, PlusCircle } from 'lucide-react';

export const DoctorPatients: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalHistories, setMedicalHistories] = useState<MedicalHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);

  // New patient form
  const [patientId, setPatientId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('1990-01-01');
  const [gender, setGender] = useState<'M' | 'F' | 'Other'>('M');
  const [error, setError] = useState('');

  // New medical history form
  const [condition, setCondition] = useState('');
  const [notes, setNotes] = useState('');

  const loadPatients = async () => {
    try {
      const data = await patientService.getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Failed to load patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await patientService.createPatient({
        patient_id: patientId,
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        gender,
      });
      setIsPatientModalOpen(false);
      setPatientId('');
      setFirstName('');
      setLastName('');
      loadPatients();
    } catch (err: any) {
      const msg = err.response?.data?.patient_id?.[0] || err.response?.data?.error || 'Failed to create patient record.';
      setError(msg);
    }
  };

  const handleOpenHistory = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsHistoryModalOpen(true);
    setHistoryLoading(true);
    try {
      const histories = await patientService.getMedicalHistory(patient.patient_id);
      setMedicalHistories(histories);
    } catch (err) {
      console.error('Failed to load medical history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleAddHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !condition) return;

    try {
      await patientService.addMedicalHistory(selectedPatient.patient_id, {
        condition,
        notes,
      });
      setCondition('');
      setNotes('');
      const histories = await patientService.getMedicalHistory(selectedPatient.patient_id);
      setMedicalHistories(histories);
    } catch (err) {
      console.error('Failed to add medical history:', err);
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Patient Directory & Clinical Records</h2>
        <button className="btn btn-primary" onClick={() => setIsPatientModalOpen(true)}>
          <UserPlus size={16} />
          Register New Patient
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Patient ID</th>
              <th>Full Name</th>
              <th>Date of Birth</th>
              <th>Gender</th>
              <th>Registered Date</th>
              <th>Status</th>
              <th>Medical Records</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>Loading patients...</td>
              </tr>
            ) : patients.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center' }}>No patient records registered.</td>
              </tr>
            ) : (
              patients.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{p.patient_id}</td>
                  <td>{p.first_name} {p.last_name}</td>
                  <td>{p.date_of_birth}</td>
                  <td>{p.gender}</td>
                  <td>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td><StatusBadge status={p.is_active ? 'ACTIVE' : 'INACTIVE'} /></td>
                  <td>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleOpenHistory(p)}>
                      <FileText size={14} />
                      Medical History
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Register Patient */}
      <Modal isOpen={isPatientModalOpen} onClose={() => setIsPatientModalOpen(false)} title="Register New Patient Record">
        {error && <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleCreatePatient}>
          <div className="form-group">
            <label>Patient ID (e.g. PAT-1002)</label>
            <input type="text" className="form-control" value={patientId} onChange={(e) => setPatientId(e.target.value)} required placeholder="PAT-1002" />
          </div>

          <div className="form-group">
            <label>First Name</label>
            <input type="text" className="form-control" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Last Name</label>
            <input type="text" className="form-control" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input type="date" className="form-control" value={dob} onChange={(e) => setDob(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Gender</label>
            <select className="form-control" value={gender} onChange={(e) => setGender(e.target.value as any)}>
              <option value="M">Male</option>
              <option value="F">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsPatientModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Patient Record</button>
          </div>
        </form>
      </Modal>

      {/* Modal: Medical History */}
      <Modal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} title={`Medical History: ${selectedPatient?.first_name} ${selectedPatient?.last_name} (${selectedPatient?.patient_id})`}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Record Clinical Diagnosis</h4>
          <form onSubmit={handleAddHistory} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Clinical Condition (e.g. Acute Bronchitis)"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              required
            />
            <textarea
              className="form-control"
              placeholder="Clinical Notes / Findings"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" style={{ alignSelf: 'flex-end' }}>
              <PlusCircle size={14} />
              Add Medical Diagnosis
            </button>
          </form>
        </div>

        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Recorded Diagnoses History</h4>
        {historyLoading ? (
          <div>Loading medical history...</div>
        ) : medicalHistories.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>No medical history recorded for this patient.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {medicalHistories.map((h) => (
              <div key={h.id} style={{ background: '#111827', padding: '0.75rem', borderRadius: '6px', border: '1px solid #374151' }}>
                <div style={{ fontWeight: 600, color: '#3b82f6', fontSize: '0.9rem' }}>{h.condition}</div>
                {h.notes && <div style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '0.25rem' }}>{h.notes}</div>}
                <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                  Recorded by Dr. {h.recorded_by_username || 'Attending Doctor'} on {new Date(h.recorded_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AppShell>
  );
};
