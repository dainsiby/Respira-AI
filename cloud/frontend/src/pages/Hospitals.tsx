import React, { useEffect, useState } from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Modal } from '../components/ui/Modal';
import { hospitalService } from '../services/api';
import { HospitalRegistry } from '../types';
import { Plus, Building2, CheckCircle, XCircle } from 'lucide-react';

export const Hospitals: React.FC = () => {
  const [hospitals, setHospitals] = useState<HospitalRegistry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [hospitalCode, setHospitalCode] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');

  const loadHospitals = async () => {
    try {
      const data = await hospitalService.getHospitals();
      setHospitals(data);
    } catch (err) {
      console.error('Failed to load hospitals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHospitals();
  }, []);

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await hospitalService.createHospital({
        hospital_code: hospitalCode,
        name,
        city,
        country,
      });
      setIsModalOpen(false);
      setHospitalCode('');
      setName('');
      setCity('');
      setCountry('');
      loadHospitals();
    } catch (err: any) {
      const msg = err.response?.data?.hospital_code?.[0] || err.response?.data?.error || 'Failed to register hospital.';
      setError(msg);
    }
  };

  const handleToggleActive = async (hosp: HospitalRegistry) => {
    try {
      await hospitalService.updateHospital(hosp.id, { is_active: !hosp.is_active });
      loadHospitals();
    } catch (err) {
      console.error('Failed to update hospital status:', err);
    }
  };

  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Hospital Partners Registry</h2>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} />
          Register New Hospital
        </button>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Hospital Code</th>
              <th>Hospital Name</th>
              <th>City</th>
              <th>Country</th>
              <th>Deployed Nodes</th>
              <th>Status</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>Loading registered hospitals...</td>
              </tr>
            ) : hospitals.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center' }}>No hospital partner records registered.</td>
              </tr>
            ) : (
              hospitals.map((h) => (
                <tr key={h.id}>
                  <td style={{ fontWeight: 600, color: '#3b82f6' }}>{h.hospital_code}</td>
                  <td>{h.name}</td>
                  <td>{h.city || '-'}</td>
                  <td>{h.country || '-'}</td>
                  <td>{h.node_count} node(s)</td>
                  <td>
                    <StatusBadge status={h.is_active ? 'ACTIVE' : 'INACTIVE'} type={h.is_active ? 'success' : 'error'} />
                  </td>
                  <td>{new Date(h.registered_at).toLocaleDateString()}</td>
                  <td>
                    <button
                      className={`btn btn-sm ${h.is_active ? 'btn-danger' : 'btn-secondary'}`}
                      onClick={() => handleToggleActive(h)}
                    >
                      {h.is_active ? <XCircle size={14} /> : <CheckCircle size={14} />}
                      {h.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Register Clinical Hospital Partner">
        {error && <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleCreateHospital}>
          <div className="form-group">
            <label>Unique Hospital Code (e.g. HOSP-NY-01)</label>
            <input type="text" className="form-control" value={hospitalCode} onChange={(e) => setHospitalCode(e.target.value)} required placeholder="HOSP-NY-01" />
          </div>

          <div className="form-group">
            <label>Hospital Name</label>
            <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Mount Sinai Health Network" />
          </div>

          <div className="form-group">
            <label>City</label>
            <input type="text" className="form-control" value={city} onChange={(e) => setCity(e.target.value)} placeholder="New York" />
          </div>

          <div className="form-group">
            <label>Country</label>
            <input type="text" className="form-control" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="USA" />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Register Partner</button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
};
