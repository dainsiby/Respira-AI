import React from 'react';
import { AppShell } from '../components/ui/AppShell';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Cpu, AlertCircle } from 'lucide-react';

export const Federation: React.FC = () => {
  return (
    <AppShell>
      <div className="section-header">
        <h2 className="section-title">Federated Learning Coordinator</h2>
        <StatusBadge status="NOT_IMPLEMENTED" type="warning" />
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '2.5rem', textAlign: 'center', margin: '2rem 0' }}>
        <Cpu size={48} style={{ color: '#f59e0b', marginBottom: '1rem' }} />
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          Federated Learning coordinator not yet implemented.
        </h3>
        <p style={{ color: '#94a3b8', maxWidth: '560px', margin: '0 auto 1.5rem', fontSize: '0.9rem' }}>
          The privacy-preserving Flower FL orchestrator, client round selection, secure weight aggregation, and global checkpoint distribution engine will be configured in upcoming Task 5 phases.
        </p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.5rem 1rem', borderRadius: '6px', color: '#fbbf24', fontSize: '0.85rem' }}>
          <AlertCircle size={16} />
          Architectural Notice: No fake FL rounds or synthetic weight updates are rendered.
        </div>
      </div>
    </AppShell>
  );
};
