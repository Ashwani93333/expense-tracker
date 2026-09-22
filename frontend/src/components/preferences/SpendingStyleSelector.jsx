import React from 'react';
import { User, Users, Layers, CheckCircle2 } from 'lucide-react';
import { SPENDING_STYLES } from '../../constants/preferences';

const STYLE_ICONS = { INDIVIDUAL: User, GROUP: Users, BOTH: Layers };

export const SpendingStyleSelector = ({ value, onChange }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px', width: '100%' }}>
    {SPENDING_STYLES.map(opt => {
      const Icon = STYLE_ICONS[opt.key];
      const active = value === opt.key;
      return (
        <button
          key={opt.key}
          type="button"
          onClick={() => onChange(opt.key)}
          style={{
            padding: '14px 16px', borderRadius: 'var(--r-lg)', cursor: 'pointer',
            fontFamily: 'var(--font)', textAlign: 'left',
            background: active ? 'rgba(183,255,0,0.1)' : 'var(--bg-surface)',
            border: `1px solid ${active ? 'rgba(183,255,0,0.45)' : 'var(--border)'}`,
            transition: 'var(--t-fast)',
            display: 'flex', alignItems: 'center', gap: '12px',
          }}
          onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px', flexShrink: 0,
            background: '#050505', border: '1px solid #1a1a1a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon size={16} color={active ? '#B7FF00' : '#737373'} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: active ? '#B7FF00' : 'var(--text-primary)' }}>
              {opt.label}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{opt.desc}</div>
          </div>
          {active && <CheckCircle2 size={15} color="#B7FF00" style={{ flexShrink: 0 }} />}
        </button>
      );
    })}
  </div>
);