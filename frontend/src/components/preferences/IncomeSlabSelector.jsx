import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { INCOME_SLABS, fmtINR } from '../../constants/preferences';

export const IncomeSlabSelector = ({ value, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', width: '100%' }}>
    {INCOME_SLABS.map(slab => {
      const active = value === slab.key;
      return (
        <button
          key={slab.key}
          type="button"
          onClick={() => onChange(slab.key)}
          style={{
            padding: '14px 16px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
            fontFamily: 'var(--font)', textAlign: 'left',
            background: active ? 'rgba(183,255,0,0.1)' : 'var(--bg-surface)',
            border: `1px solid ${active ? 'rgba(183,255,0,0.45)' : 'var(--border)'}`,
            transition: 'var(--t-fast)',
            display: 'flex', flexDirection: 'column', gap: '6px',
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? '#B7FF00' : 'var(--text-primary)' }}>
              {slab.label}
            </span>
            {active && <CheckCircle2 size={15} color="#B7FF00" style={{ flexShrink: 0 }} />}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Suggested budget {fmtINR(slab.budget)}/mo
          </span>
        </button>
      );
    })}
  </div>
);