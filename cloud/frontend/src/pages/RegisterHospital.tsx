import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { hospitalOnboardingService } from '../services/api';
import { Building2, ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

export const RegisterHospital: React.FC = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    hospital_name: '',
    official_email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    contact_person: '',
  });

  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedApp, setSubmittedApp] = useState<{ application_id: string; status: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await hospitalOnboardingService.registerHospital({
        username: formData.username,
        password: formData.password,
        hospital_name: formData.hospital_name,
        official_email: formData.official_email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        contact_person: formData.contact_person,
      });

      setSubmittedApp({
        application_id: res.application_id,
        status: res.status,
      });
    } catch (err: any) {
      const respData = err.response?.data;
      let msg = 'Registration failed. Please check inputs.';
      if (respData) {
        if (typeof respData === 'string') msg = respData;
        else if (respData.error) msg = respData.error;
        else {
          const firstKey = Object.keys(respData)[0];
          const val = respData[firstKey];
          if (Array.isArray(val)) msg = `${firstKey}: ${val[0]}`;
          else if (typeof val === 'string') msg = `${firstKey}: ${val}`;
        }
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedApp) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: '540px', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <CheckCircle2 size={54} style={{ color: '#10b981' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Application Submitted</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Your hospital onboarding application has been successfully transmitted to the RESPIRA AI Cloud Control Plane.
          </p>

          <div style={{ background: '#1e293b', borderRadius: '8px', padding: '1.25rem', marginBottom: '1.5rem', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Application ID:</span>
              <strong style={{ color: '#38bdf8' }}>{submittedApp.application_id}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Application Status:</span>
              <span className="status-badge badge-offline">{submittedApp.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Account Username:</span>
              <span style={{ color: '#f8fafc' }}>{formData.username}</span>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.5rem' }}>
            A System Administrator will review your hospital credentials. Once approved, your hospital code will be generated and node installation access will become eligible.
          </p>

          <button onClick={() => navigate('/login')} className="btn btn-primary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            Proceed to Cloud Sign In <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page" style={{ padding: '2rem 1rem' }}>
      <div className="login-card" style={{ maxWidth: '640px' }}>
        <div className="login-header">
          <div className="login-logo">R</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>RESPIRA AI</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Building2 size={16} style={{ color: '#3b82f6' }} />
            Hospital Cloud Onboarding Application
          </p>
        </div>

        {error && (
          <div className="status-badge badge-error" style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Hospital Name *</label>
              <input type="text" name="hospital_name" className="form-control" value={formData.hospital_name} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Official Email *</label>
              <input type="email" name="official_email" className="form-control" value={formData.official_email} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input type="text" name="phone" className="form-control" value={formData.phone} onChange={handleChange} placeholder="+1-555-0199" />
            </div>

            <div className="form-group">
              <label>Contact Person</label>
              <input type="text" name="contact_person" className="form-control" value={formData.contact_person} onChange={handleChange} placeholder="Dr. Jane Doe" />
            </div>

            <div className="form-group">
              <label>City</label>
              <input type="text" name="city" className="form-control" value={formData.city} onChange={handleChange} placeholder="Boston" />
            </div>

            <div className="form-group">
              <label>State / Province</label>
              <input type="text" name="state" className="form-control" value={formData.state} onChange={handleChange} placeholder="MA" />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input type="text" name="country" className="form-control" value={formData.country} onChange={handleChange} placeholder="USA" />
            </div>

            <div className="form-group">
              <label>Address</label>
              <input type="text" name="address" className="form-control" value={formData.address} onChange={handleChange} placeholder="100 Medical Center Way" />
            </div>
          </div>

          <div style={{ borderTop: '1px solid #334155', marginTop: '1rem', paddingTop: '1rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.75rem' }}>Cloud Account Credentials</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label>Username *</label>
                <input type="text" name="username" className="form-control" value={formData.username} onChange={handleChange} required placeholder="hosp_admin" />
              </div>

              <div className="form-group">
                <label>Password *</label>
                <input type="password" name="password" className="form-control" value={formData.password} onChange={handleChange} required placeholder="••••••••" />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label>Confirm Password *</label>
                <input type="password" name="confirmPassword" className="form-control" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1.25rem' }} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting Application...' : 'Submit Hospital Cloud Application'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.85rem' }}>
          <span style={{ color: '#94a3b8' }}>Already registered? </span>
          <Link to="/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 600 }}>Sign In here</Link>
        </div>
      </div>
    </div>
  );
};
