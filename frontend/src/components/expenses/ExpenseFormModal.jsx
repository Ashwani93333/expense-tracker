import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Users, DollarSign, CalendarDays, Tag, AlignLeft, ScanLine, Scale, PenLine, Percent, AlertTriangle } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { groupsApi } from '../../services/api';
import { CategorySearchSelect } from '../categories/CategorySearchSelect';

const SplitTypeBtn = ({ value, current, label, icon: Icon, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    style={{
      flex: 1, padding: '10px 4px', border: '1px solid',
      borderColor: current === value ? '#050505' : 'var(--border)',
      borderRadius: 'var(--r-md)',
      background: current === value ? '#050505' : '#fff',
      color: current === value ? '#B7FF00' : 'var(--text-muted)',
      fontWeight: current === value ? 700 : 500,
      fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'var(--font)',
      transition: 'var(--t-fast)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px',
    }}
  >
    <Icon size={13} /> {label}
  </button>
);

export const ExpenseFormModal = () => {
  const { isAddModalOpen, setIsAddModalOpen, setActiveTab, categories, addCategory, addExpense, groups } = useExpense();
  const { currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [categoryId, setCategoryId] = useState('');
  const [isGroupExpense, setIsGroupExpense] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [paidBy, setPaidBy] = useState(currentUser?.id || '');
  const [splitType, setSplitType] = useState('EQUAL');
  const [groupMembers, setGroupMembers] = useState([]);
  const [splits, setSplits] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    if (categories.length > 0 && !categoryId) setCategoryId(categories[0].id);
  }, [categories]);

  useEffect(() => {
    if (currentUser?.id) setPaidBy(currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    if (!selectedGroupId || !isGroupExpense) { setGroupMembers([]); setSplits([]); return; }
    const fetchMembers = async () => {
      setMembersLoading(true);
      try {
        const data = await groupsApi.get(selectedGroupId);
        const mems = data.members || [];
        setGroupMembers(mems);
        buildSplits(mems, parseFloat(amount) || 0, splitType);
      } catch { setGroupMembers([]); }
      finally { setMembersLoading(false); }
    };
    fetchMembers();
  }, [selectedGroupId, isGroupExpense]);

  useEffect(() => {
    if (groupMembers.length > 0) buildSplits(groupMembers, parseFloat(amount) || 0, splitType);
  }, [amount, splitType, groupMembers]);

  const buildSplits = (members, totalAmount, type) => {
    if (type === 'EQUAL') {
      const share = totalAmount / (members.length || 1);
      setSplits(members.map(m => ({
        userId: m.userId, userName: m.userName,
        shareAmount: parseFloat(share.toFixed(2)),
        sharePercent: parseFloat((100 / members.length).toFixed(2)),
      })));
    } else if (type === 'PERCENT') {
      const pct = parseFloat((100 / members.length).toFixed(2));
      setSplits(members.map(m => ({
        userId: m.userId, userName: m.userName,
        sharePercent: pct,
        shareAmount: parseFloat(((totalAmount * pct) / 100).toFixed(2)),
      })));
    } else {
      const share = totalAmount / (members.length || 1);
      setSplits(members.map(m => ({
        userId: m.userId, userName: m.userName,
        shareAmount: parseFloat(share.toFixed(2)),
      })));
    }
  };

  const updateSplitAmount = (userId, value) =>
    setSplits(prev => prev.map(s => s.userId === userId ? { ...s, shareAmount: parseFloat(value) || 0 } : s));

  const updateSplitPercent = (userId, value) => {
    const pct = parseFloat(value) || 0;
    const total = parseFloat(amount) || 0;
    setSplits(prev => prev.map(s =>
      s.userId === userId ? { ...s, sharePercent: pct, shareAmount: parseFloat(((total * pct) / 100).toFixed(2)) } : s
    ));
  };

  const reset = () => {
    setAmount(''); setDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setCategoryId(categories[0]?.id || '');
    setIsGroupExpense(false); setSelectedGroupId('');
    setSplitType('EQUAL'); setSplits([]); setGroupMembers([]);
    setPaidBy(currentUser?.id || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;
    setIsLoading(true);
    try {
      await addExpense({
        amount: parseFloat(amount), description, expenseDate, categoryId,
        groupId: isGroupExpense ? selectedGroupId : null,
        paidBy: isGroupExpense ? paidBy : null,
        splitType: isGroupExpense ? splitType : null,
        splits: isGroupExpense ? splits : null,
      });
      reset();
      setIsAddModalOpen(false);
    } catch { }
    finally { setIsLoading(false); }
  };

  if (!isAddModalOpen) return null;

  const splitTotal = splits.reduce((s, sp) => s + (sp.shareAmount || 0), 0);
  const splitError = isGroupExpense && Math.abs(splitTotal - (parseFloat(amount) || 0)) > 0.5;

  return (
    <div className="modal-backdrop" onClick={() => setIsAddModalOpen(false)}>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '580px', maxHeight: '90vh',
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
              {isGroupExpense ? 'Log Group Expense' : 'Add Expense'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {isGroupExpense ? 'Split this expense with your group members' : 'Record a personal transaction'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => { setIsAddModalOpen(false); setActiveTab('scan'); }}
              style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}
            >
              <ScanLine size={13} /> Scan
            </button>
            <button
              onClick={() => setIsAddModalOpen(false)}
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
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Amount — large hero input */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label" style={{ fontSize: '0.82rem' }}><DollarSign size={12} /> Amount *</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)', fontWeight: 700, fontSize: '1.3rem' }}>₹</span>
              <input
                type="number" step="0.01" placeholder="0.00" required
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
                type="text" placeholder="e.g. Lunch at Bikanervala" required
                value={description} onChange={e => setDescription(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label"><CalendarDays size={12} /> Date</label>
              <input type="date" required value={expenseDate} onChange={e => setExpenseDate(e.target.value)} className="input-field" />
            </div>
          </div>

          {/* Category */}
          <div className="input-group" style={{ margin: 0 }}>
            <label className="input-label"><Tag size={12} /> Category</label>
            <CategorySearchSelect
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              addCategory={addCategory}
            />
          </div>

          {/* Group Toggle */}
          {groups.length > 0 && (
            <div style={{
              padding: '14px 16px', borderRadius: 'var(--r-xl)',
              background: isGroupExpense ? 'rgba(183,255,0,0.06)' : 'var(--bg-surface)',
              border: `1px solid ${isGroupExpense ? 'rgba(183,255,0,0.2)' : 'var(--border)'}`,
              transition: 'var(--t-fast)',
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={isGroupExpense}
                  onChange={e => {
                    setIsGroupExpense(e.target.checked);
                    if (e.target.checked && !selectedGroupId && groups.length > 0) setSelectedGroupId(groups[0].id);
                  }}
                  style={{ width: '16px', height: '16px', accentColor: '#050505', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Users size={13} /> Split with a group
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    Assign shares to group members
                  </div>
                </div>
              </label>
            </div>
          )}

          {/* Group options */}
          {isGroupExpense && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Select Group</label>
                  <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="input-field">
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="input-group" style={{ margin: 0 }}>
                  <label className="input-label">Paid By</label>
                  <select value={paidBy} onChange={e => setPaidBy(e.target.value)} className="input-field">
                    {groupMembers.map(m => <option key={m.userId} value={m.userId}>{m.userName}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Split Method</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <SplitTypeBtn value="EQUAL"   current={splitType} label="Equal"    icon={Scale}   onClick={setSplitType} />
                  <SplitTypeBtn value="PERCENT" current={splitType} label="% Percent" icon={Percent} onClick={setSplitType} />
                  <SplitTypeBtn value="CUSTOM"  current={splitType} label="Custom"   icon={PenLine} onClick={setSplitType} />
                </div>
              </div>

              {/* Split table */}
              {membersLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <div className="spinner spinner-sm" /> Loading members...
                </div>
              ) : splits.length > 0 && (
                <div style={{ background: 'var(--bg-surface)', borderRadius: 'var(--r-lg)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '8px 14px', borderBottom: '1px solid var(--border)', background: '#050505' }}>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Member</span>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#525252', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Share</span>
                  </div>
                  {splits.map(sp => (
                    <div key={sp.userId} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                        {sp.userName}
                        {sp.userId === currentUser?.id && <span className="badge" style={{ marginLeft: '6px', fontSize: '0.62rem', background: '#050505', color: '#B7FF00' }}>You</span>}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        {splitType === 'EQUAL' ? (
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>₹{sp.shareAmount.toFixed(2)}</span>
                        ) : splitType === 'PERCENT' ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                            <input
                              type="number" step="0.1" min="0" max="100"
                              value={sp.sharePercent || ''}
                              onChange={e => updateSplitPercent(sp.userId, e.target.value)}
                              style={{ width: '55px', padding: '4px 7px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontSize: '0.82rem', outline: 'none', textAlign: 'right', fontFamily: 'var(--font)', background: '#fff' }}
                            />
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem' }}>% = ₹{sp.shareAmount.toFixed(2)}</span>
                          </div>
                        ) : (
                          <input
                            type="number" step="0.01" min="0"
                            value={sp.shareAmount || ''}
                            onChange={e => updateSplitAmount(sp.userId, e.target.value)}
                            style={{ width: '90px', padding: '4px 7px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text-primary)', fontSize: '0.87rem', fontWeight: 700, outline: 'none', textAlign: 'right', fontFamily: 'var(--font)', background: '#fff' }}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '9px 14px', background: '#050505' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#737373' }}>Total</span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: splitError ? '#ef4444' : '#B7FF00', textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: '5px', justifyContent: 'flex-end' }}>
                      ₹{splitTotal.toFixed(2)} {splitError && <AlertTriangle size={13} />}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border)', marginTop: '4px' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || (isGroupExpense && splitError)}
            >
              {isLoading
                ? <><Loader2 size={15} style={{ animation: 'spin 0.7s linear infinite' }} /> Saving...</>
                : <><CheckCircle size={15} /> Save Expense</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
