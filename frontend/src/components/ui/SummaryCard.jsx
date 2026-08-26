import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const SummaryCard = ({
  label,
  value,
  sub,
  icon: Icon,
  accent,
  trend,
  trendUp,
  loading = false,
  onClick,
  style = {},
}) => {
  return (
    <div
      className={`metric-card${onClick ? ' card-interactive card-hover-lift' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default', ...style }}
    >
      {loading ? (
        <>
          <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '14px' }} />
          <div className="skeleton" style={{ height: '32px', width: '70%', marginBottom: '8px' }} />
          <div className="skeleton" style={{ height: '11px', width: '45%' }} />
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span className="metric-card-label">{label}</span>
            {Icon && (
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: accent ? `${accent}15` : 'var(--bg-surface)',
                border: `1px solid ${accent ? `${accent}25` : 'var(--border)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon size={17} color={accent || 'var(--text-muted)'} />
              </div>
            )}
          </div>
          <div className="metric-card-value">{value}</div>
          {(sub || trend) && (
            <div className="metric-card-sub">
              {trend && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '2px',
                  color: trendUp ? 'var(--green)' : 'var(--red)',
                  fontWeight: 700,
                }}>
                  {trendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {trend}
                </span>
              )}
              {sub && <span>{sub}</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
};
