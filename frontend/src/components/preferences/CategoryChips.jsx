import React from 'react';
import { Tag, CheckCircle2 } from 'lucide-react';

export const CategoryChips = ({ categories, selected = [], onToggle }) => {
  if (!categories || categories.length === 0) {
    return <p style={{ fontSize: '0.8rem', color: 'var(--text-faint)' }}>No categories available yet.</p>;
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', width: '100%' }}>
      {categories.map(cat => {
        const active = selected.includes(cat.id);
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              padding: '9px 15px', borderRadius: '99px', cursor: 'pointer',
              fontFamily: 'var(--font)', fontSize: '0.8rem', fontWeight: 600,
              background: active ? 'rgba(183,255,0,0.12)' : 'var(--bg-surface)',
              color: active ? '#B7FF00' : 'var(--text-secondary)',
              border: `1px solid ${active ? 'rgba(183,255,0,0.5)' : 'var(--border)'}`,
              transition: 'var(--t-fast)',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            {active && <CheckCircle2 size={13} />}
            <Tag size={13} color={active ? '#B7FF00' : 'var(--text-faint)'} />
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};