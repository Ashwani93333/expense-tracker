import React, { useState } from 'react';
import { Users, X, Loader2, Globe, CalendarClock } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup } = useExpense();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [expiresAt, setExpiresAt] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      const payload = { name: name.trim(), description: description.trim(), currencyCode };
      if (expiresAt) {
        payload.expiresAt = new Date(expiresAt).toISOString();
      }
      await createGroup(payload);
      setName(''); setDescription(''); setCurrencyCode('INR'); setExpiresAt('');
      onClose();
    } catch {}
    finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="card"
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '480px', padding: '26px',
          animation: 'slideUp 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: 'var(--accent-light)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={16} color="var(--accent)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>Create Group</h3>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>An invite code will be generated automatically</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Group Name *</label>
            <input
              type="text" placeholder="e.g. Goa Trip 2025, Office Lunch"
              value={name} onChange={e => setName(e.target.value)}
              className="input-field" required autoFocus
            />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Description</label>
            <input
              type="text" placeholder="Optional short description"
              value={description} onChange={e => setDescription(e.target.value)}
              className="input-field"
            />
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label">Currency</label>
            <select value={currencyCode} onChange={e => setCurrencyCode(e.target.value)} className="input-field" style={{ cursor: 'pointer' }}>
              <option value="INR">INR — Indian Rupee ₹</option>
              <option value="USD">USD — US Dollar $</option>
              <option value="EUR">EUR — Euro €</option>
              <option value="GBP">GBP — British Pound £</option>
            </select>
          </div>
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarClock size={13} /> Expiry Date <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              type="datetime-local"
              value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
              className="input-field"
              min={new Date().toISOString().slice(0, 16)}
            />
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Group will be locked after this date. No new expenses or joins allowed.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading || !name.trim()}>
              {isLoading ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Creating...</> : <><Users size={15} /> Create Group</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
