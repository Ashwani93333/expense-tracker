import React from 'react';
import { AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';

export const BudgetProgressBar = ({ 
  label, 
  spent = 0, 
  limit = 1000, 
  currency = '₹',
  showDetails = true,
  size = 'md'
}) => {
  const safeLimit = limit > 0 ? limit : 1;
  const ratio = spent / safeLimit;
  const percentage = Math.min(Math.round(ratio * 100), 999);

  // Determine status color and badge info
  let statusColor = '#10b981'; // Emerald
  let statusBg = 'rgba(16, 185, 129, 0.12)';
  let statusBorder = 'rgba(16, 185, 129, 0.25)';
  let statusText = 'On Track';
  let Icon = CheckCircle2;

  if (ratio >= 1.0) {
    statusColor = '#ef4444'; // Rose
    statusBg = 'rgba(239, 68, 68, 0.12)';
    statusBorder = 'rgba(239, 68, 68, 0.25)';
    statusText = 'Over Budget';
    Icon = AlertOctagon;
  } else if (ratio >= 0.7) {
    statusColor = '#f59e0b'; // Amber
    statusBg = 'rgba(245, 158, 11, 0.12)';
    statusBorder = 'rgba(245, 158, 11, 0.25)';
    statusText = 'Nearing Limit';
    Icon = AlertTriangle;
  }

  const heightMap = {
    sm: '6px',
    md: '10px',
    lg: '14px'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {showDetails && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            {label && (
              <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {label}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {currency}{spent.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                of {currency}{limit.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: 'var(--radius-sm)',
            background: statusBg,
            border: `1px solid ${statusBorder}`,
            color: statusColor,
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            <Icon size={12} />
            <span>{percentage}%</span>
            <span style={{ opacity: 0.8, fontWeight: 500 }}>• {statusText}</span>
          </div>
        </div>
      )}

      {/* Progress Track */}
      <div style={{
        width: '100%',
        height: heightMap[size] || '10px',
        background: '#18181b',
        borderRadius: '99px',
        overflow: 'hidden',
        border: '1px solid var(--border-subtle)',
        position: 'relative'
      }}>
        <div style={{
          width: `${Math.min(percentage, 100)}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${statusColor}dd, ${statusColor})`,
          boxShadow: `0 0 12px ${statusColor}66`,
          borderRadius: '99px',
          transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
};
