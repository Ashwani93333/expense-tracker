import React from 'react';
import { Plus, ScanLine } from 'lucide-react';

export const EmptyState = ({
  icon: Icon,
  title = 'No data found',
  description = 'Get started by adding your first item.',
  actions = [],
  onAddExpense,
  onScanReceipt,
  className = '',
  style = {},
}) => {
  return (
    <div className={`empty-state card ${className}`} style={{ ...style }}>
      <div className="empty-state-icon">
        <Icon size={24} color="#737373" />
      </div>
      <h4 className="empty-state-title">{title}</h4>
      <p className="empty-state-desc">{description}</p>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {actions.map((action, i) => (
          <button
            key={i}
            className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={action.onClick}
          >
            {action.icon && <action.icon size={13} />}
            {action.label}
          </button>
        ))}
        {!actions.length && (
          <>
            {onAddExpense && (
              <button className="btn btn-primary btn-sm" onClick={onAddExpense}>
                <Plus size={13} /> Add Expense
              </button>
            )}
            {onScanReceipt && (
              <button className="btn btn-secondary btn-sm" onClick={onScanReceipt}>
                <ScanLine size={13} /> Scan Receipt
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
