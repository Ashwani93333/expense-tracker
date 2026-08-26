import React from 'react';

export const PageHeader = ({
  icon: Icon,
  badge,
  badgeColor = '#050505',
  badgeTextColor = '#B7FF00',
  title,
  subtitle,
  actions,
  children,
  style = {},
}) => {
  return (
    <div className="card" style={{ padding: '22px 24px', ...style }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          {badge && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge" style={{ background: badgeColor, color: badgeTextColor }}>
                {Icon && <Icon size={11} />}
                {badge}
              </span>
            </div>
          )}
          <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
            {actions}
          </div>
        )}
      </div>
      {children}
    </div>
  );
};
