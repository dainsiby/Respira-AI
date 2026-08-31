import React from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Layers, AlertCircle } from 'lucide-react';

export const Models: React.FC = () => {
  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Global ResNet-50 Model Version Registry</h2>
        <StatusBadge status="PENDING_AI_PHASE" type="info" />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '2.5rem', textAlign: 'center', margin: '2rem 0' }}>
        <Layers size={48} style={{ color: '#06b6d4', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Global model management will be available after AI and Federated Learning implementation.
        </h3>
        <p style={{ color: '#94a3b8', maxWidth: '560px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
          ResNet-50 chest X-ray classifier global model weights, checkpoint versioning, and distribution manifests will be implemented after PyTorch model definition in subsequent tasks.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.5rem 1rem', borderRadius: '6px', color: '#22d3ee', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          Architectural Notice: No fake neural network weights or simulated predictions are loaded.
        </div>
      </div>
    </AppShell>
  );
};
