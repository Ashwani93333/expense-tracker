import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

export const InsightCard = ({
  title = 'AI Spending Insight',
  description,
  actionLabel = 'View Details',
  onAction,
  style = {},
}) => {
  if (!description) return null;

  return (
    <div className="insight-card" style={{ ...style }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '8px',
          background: 'rgba(183,255,0,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Sparkles size={14} color="#B7FF00" />
        </div>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#B7FF00', letterSpacing: '0.02em' }}>
          {title}
        </span>
      </div>
      <p style={{ fontSize: '0.88rem', color: '#e5e5e5', lineHeight: 1.6, margin: 0, position: 'relative', zIndex: 1 }}>
        {description}
      </p>
      {onAction && (
        <button
          onClick={onAction}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            marginTop: '16px', padding: '8px 16px',
            background: 'rgba(183,255,0,0.1)', border: '1px solid rgba(183,255,0,0.2)',
            borderRadius: 'var(--r-md)', color: '#B7FF00',
            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
            fontFamily: 'var(--font)', transition: 'var(--t-fast)',
            position: 'relative', zIndex: 1,
          }}
        >
          {actionLabel} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};
