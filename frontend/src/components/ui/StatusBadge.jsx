import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock, Info } from 'lucide-react';

const STATUS_CONFIG = {
  OK:        { color: 'var(--green)', bg: 'var(--green-light)', border: 'rgba(34,197,94,0.2)', label: 'On Track', icon: CheckCircle2 },
  WARNING:   { color: 'var(--amber)', bg: 'var(--amber-light)', border: 'rgba(245,158,11,0.2)', label: 'Warning', icon: AlertTriangle },
  EXCEEDED:  { color: 'var(--red)',   bg: 'var(--red-light)',   border: 'rgba(239,68,68,0.2)',   label: 'Exceeded', icon: AlertTriangle },
  PENDING:   { color: 'var(--amber)', bg: 'var(--amber-light)', border: 'rgba(245,158,11,0.2)', label: 'Pending', icon: Clock },
  APPROVED:  { color: 'var(--green)', bg: 'var(--green-light)', border: 'rgba(34,197,94,0.2)',  label: 'Verified', icon: CheckCircle2 },
  REJECTED:  { color: 'var(--red)',   bg: 'var(--red-light)',   border: 'rgba(239,68,68,0.2)',  label: 'Rejected', icon: XCircle },
  NO_BUDGET: { color: 'var(--text-muted)', bg: 'var(--bg-muted)', border: 'var(--border)',       label: 'No Limit', icon: Info },
};

export const StatusBadge = ({
  status,
  label,
  size = 'sm',
  showIcon = true,
  style = {},
}) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.NO_BUDGET;
  const Icon = config.icon;
  const displayLabel = label || config.label;
  const isSmall = size === 'sm';

  return (
    <span
      className="badge"
      style={{
        fontSize: isSmall ? '0.72rem' : '0.8rem',
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        padding: isSmall ? '2px 8px' : '4px 12px',
        gap: '4px',
        ...style,
      }}
    >
      {showIcon && <Icon size={isSmall ? 11 : 13} />}
      {displayLabel}
    </span>
  );
};
