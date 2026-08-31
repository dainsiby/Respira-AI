import React, { useEffect, useState } from 'react';
import { AppShell } from '../../components/ui/AppShell';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Modal } from '../../components/ui/Modal';
import { appointmentService, patientService, userService } from '../../services/api';
import { Appointment, Patient, User } from '../../types';
import { Calendar, Plus } from 'lucide-react';

export const DoctorAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const [patientId, setPatientId] = useState<number | ''>('');
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [scheduledAt, setScheduledAt] = useState('2026-09-01T10:00');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const loadData = async () => {
    try {
      const [appData, patData, usrData] = await Promise.all([
        appointmentService.getAppointments(),
        patientService.getPatients(),
        userService.getUsers(),
      ]);
      setAppointments(appData);
      setPatients(patData);

      const docList = usrData.filter((u) => u.role === 'DOCTOR');
      setDoctors(docList);
      if (docList.length > 0) setDoctorId(docList[0].id);
      if (patData.length > 0) setPatientId(patData[0].id);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !doctorId || !reason) return;

    try {
      await appointmentService.createAppointment({
        patient: Number(patientId),
        doctor: Number(doctorId),
        scheduled_at: new Date(scheduledAt).toISOString(),
        reason,
        notes,
      });
      setIsModalOpen(false);
      setReason('');
      setNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to create appointment:', err);
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Clinical Appointments & Consultations</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Schedule Consultation
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Appointment ID</th>
              <th>Patient</th>
              <th>Attending Doctor</th>
              <th>Scheduled Time</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>Loading consultations...</td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center' }}>No appointments scheduled.</td>
              </tr>
            ) : (
              appointments.map((apt) => (
                <tr key={apt.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{apt.appointment_id}</td>
                  <td>{apt.patient_name || apt.patient}</td>
                  <td>Dr. {apt.doctor_username || apt.doctor}</td>
                  <td>{new Date(apt.scheduled_at).toLocaleString()}</td>
                  <td>{apt.reason}</td>
                  <td><StatusBadge status={apt.status} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Schedule Patient Consultation">
        <form onSubmit={handleCreateAppointment}>
          <div className="form-group">
            <label>Select Patient</label>
            <select className="form-control" value={patientId} onChange={(e) => setPatientId(Number(e.target.value))} required>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.first_name} {p.last_name} ({p.patient_id})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Assigned Doctor</label>
            <select className="form-control" value={doctorId} onChange={(e) => setDoctorId(Number(e.target.value))} required>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>
                  Dr. {d.first_name ? `${d.first_name} ${d.last_name}` : d.username}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Scheduled Date & Time</label>
            <input type="datetime-local" className="form-control" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>Reason for Consultation</label>
            <input type="text" className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} required placeholder="Chest pain evaluation" />
          </div>

          <div className="form-group">
            <label>Clinical Notes</label>
            <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Initial symptoms" />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Save Appointment</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
