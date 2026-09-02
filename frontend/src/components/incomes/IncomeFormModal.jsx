import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, DollarSign, CalendarDays, AlignLeft, Repeat, StickyNote, Briefcase } from 'lucide-react';
import { useIncome } from '../../context/IncomeContext';

const INCOME_SOURCES = [
  { value: 'SALARY', label: 'Salary' },
  { value: 'FREELANCE', label: 'Freelance' },
  { value: 'INVESTMENTS', label: 'Investments' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'RENTAL', label: 'Rental Income' },
  { value: 'GIFTS', label: 'Gifts' },
  { value: 'REFUNDS', label: 'Refunds' },
  { value: 'OTHER', label: 'Other' },
];

const FREQUENCIES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'YEARLY', label: 'Yearly' },
];

export const IncomeFormModal = () => {
  const { isIncomeModalOpen, setIsIncomeModalOpen, editingIncome, addIncome, updateIncome } = useIncome();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split('T')[0]);
  const [source, setSource] = useState('SALARY');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('MONTHLY');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (editingIncome) {
      setAmount(editingIncome.amount?.toString() || '');
      setDescription(editingIncome.description || '');
      setIncomeDate(editingIncome.incomeDate || new Date().toISOString().split('T')[0]);
      setSource(editingIncome.source || 'SALARY');
      setIsRecurring(editingIncome.isRecurring || false);
      setFrequency(editingIncome.frequency || 'MONTHLY');
      setNotes(editingIncome.notes || '');
    } else {
      reset();
    }
  }, [editingIncome, isIncomeModalOpen]);

  const reset = () => {
    setAmount('');
    setDescription('');
    setIncomeDate(new Date().toISOString().split('T')[0]);
    setSource('SALARY');
    setIsRecurring(false);
    setFrequency('MONTHLY');
    setNotes('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description || !source) return;
    setIsLoading(true);
    try {
      const data = {
        amount: parseFloat(amount), description, incomeDate, source,
        isRecurring, frequency: isRecurring ? frequency : null,
        notes: notes || null,
      };
      if (editingIncome) {
        await updateIncome(editingIncome.id, data);
      } else {
        await addIncome(data);
      }
      reset();
      setIsIncomeModalOpen(false);
    } catch { }
    finally { setIsLoading(false); }
  };

  if (!isIncomeModalOpen) return null;

  return (
    <div className="modal-backdrop" onClick={() => setIsIncomeModalOpen(false)}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '520px', maxHeight: '90vh',
          overflowY: 'auto', padding: '28px', borderRadius: 'var(--r-2xl)',
          background: '#fff', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-modal)',
          animation: 'slideUp 0.18s ease',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              {editingIncome ? 'Edit Income' : 'Add Income'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {editingIncome ? 'Update income details' : 'Record income from a source'}
            </p>
          </div>
          <button
            onClick={() => setIsIncomeModalOpen(false)}
            style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              cursor: 'pointer', color: 'var(--text-muted)',
              width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'var(--t-fast)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Amount */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '0.82rem' }}><DollarSign size={12} /> Amount *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontWeight: 700, fontSize: '1.3rem' }}>₹</span>
              <input
                type="number" step="1" placeholder="0.00" required
                value={amount} onChange={e => setAmount(e.target.value)}
                className="input-field"
                style={{ paddingLeft: '32px', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', height: '60px' }}
              />
            </div>
          </div>

          {/* Description + Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '12px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label"><AlignLeft size={12} /> Description *</label>
              <input
                type="text" placeholder="e.g. March salary" required
                value={description} onChange={e => setDescription(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label"><CalendarDays size={12} /> Date</label>
              <input type="date" required value={incomeDate} onChange={e => setIncomeDate(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Source */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label"><Briefcase size={12} /> Source *</label>
            <select value={source} onChange={e => setSource(e.target.value)} className="input-field" required>
              {INCOME_SOURCES.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Recurring Toggle */}
          <div style={{
            padding: '14px 16px', borderRadius: 'var(--r-xl)',
            background: isRecurring ? 'rgba(183,255,0,0.06)' : 'var(--bg-surface)',
            border: `1px solid ${isRecurring ? 'rgba(183,255,0,0.2)' : 'var(--border)'}`,
            transition: 'var(--t-fast)',
          }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={e => setIsRecurring(e.target.checked)}
                style={{ width: '16px', height: '16px', accentColor: '#050505', cursor: 'pointer' }}
              />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Repeat size={13} /> Recurring Income
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                  Mark this as a repeating income source
                </div>
              </div>
            </label>
          </div>

          {/* Frequency (only when recurring) */}
          {isRecurring && (
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Frequency</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {FREQUENCIES.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFrequency(f.value)}
                    style={{
                      flex: 1, padding: '10px 4px', border: '1px solid',
                      borderColor: frequency === f.value ? '#050505' : 'var(--border)',
                      borderRadius: 'var(--r-md)',
                      background: frequency === f.value ? '#050505' : '#fff',
                      color: frequency === f.value ? '#B7FF00' : 'var(--text-muted)',
                      fontWeight: frequency === f.value ? 700 : 500,
                      fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font)',
                      transition: 'var(--t-fast)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label"><StickyNote size={12} /> Notes</label>
            <textarea
              placeholder="Optional notes..."
              value={notes} onChange={e => setNotes(e.target.value)}
              className="input-field"
              rows={2}
              style={{ resize: 'vertical', minHeight: '60px' }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsIncomeModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isLoading || !amount || !description}>
              {isLoading
                ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</>
                : <><CheckCircle size={15} /> {editingIncome ? 'Update Income' : 'Save Income'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
