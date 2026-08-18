import React from 'react';
import { AlertOctagon, X } from 'lucide-react';

export const RemoveMemberConfirmModal = ({ isOpen, onClose, onConfirm, memberName }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: '#0d131f',
          border: '1px solid #ef444455'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div style={{
            padding: '10px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.15)',
            color: '#ef4444'
          }}>
            <AlertOctagon size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', color: '#ffffff', margin: 0 }}>Remove Member?</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Are you sure you want to remove <strong>{memberName}</strong> from this group?
            </p>
          </div>
        </div>

        <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '18px' }}>
          Historical expense splits logged by {memberName} will remain in group records for budget accuracy.
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={onConfirm} style={{ background: '#ef4444', color: '#ffffff' }}>
            Remove Member
          </button>
        </div>
      </div>
    </div>
  );
};
