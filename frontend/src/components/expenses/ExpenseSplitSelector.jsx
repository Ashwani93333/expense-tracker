import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const ExpenseSplitSelector = ({ 
  expenseAmount = 0, 
  onSplitChange 
}) => {
  const { groups, activeGroupId, users, currentUser } = useExpense();

  const [isGroupExpense, setIsGroupExpense] = useState(false);
  const [groupId, setGroupId] = useState(activeGroupId || (groups[0] ? groups[0].id : ''));
  const [paidBy, setPaidBy] = useState(currentUser.id);
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL | PERCENT | CUSTOM

  // Equal split selected member IDs
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  
  // Percent split mapping
  const [customPercents, setCustomPercents] = useState({});

  // Custom dollar split mapping
  const [customShares, setCustomShares] = useState({});

  const activeGrp = groups.find(g => g.id === groupId) || groups[0];

  useEffect(() => {
    if (activeGrp && activeGrp.members) {
      const allIds = activeGrp.members.map(m => m.userId);
      setSelectedMemberIds(allIds);

      // Initialize equal percent split
      const equalPct = parseFloat((100 / allIds.length).toFixed(2));
      const pMap = {};
      const sMap = {};
      const equalShare = parseFloat((expenseAmount / allIds.length).toFixed(2));

      allIds.forEach(id => {
        pMap[id] = equalPct;
        sMap[id] = equalShare;
      });
      setCustomPercents(pMap);
      setCustomShares(sMap);
    }
  }, [groupId, activeGrp, expenseAmount]);

  useEffect(() => {
    // Notify parent form of changes
    if (onSplitChange) {
      onSplitChange({
        isGroupExpense,
        groupId: isGroupExpense ? groupId : null,
        paidBy: isGroupExpense ? paidBy : currentUser.id,
        splitType,
        selectedMemberIds,
        customPercents,
        customShares
      });
    }
  }, [isGroupExpense, groupId, paidBy, splitType, selectedMemberIds, customPercents, customShares, expenseAmount]);

  if (!groups || groups.length === 0) return null;

  const numSelected = selectedMemberIds.length || 1;
  const equalShareAmount = (expenseAmount / numSelected).toFixed(2);

  // Calculate sum validation for PERCENT & CUSTOM
  const totalPercentSum = Object.values(customPercents).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const totalSharesSum = Object.values(customShares).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  const isPercentValid = Math.abs(totalPercentSum - 100) < 0.1;
  const isCustomValid = Math.abs(totalSharesSum - expenseAmount) < 0.05;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '14px',
      padding: '16px',
      borderRadius: 'var(--radius-md)',
      background: '#131a27',
      border: '1px solid #1e293b'
    }}>
      {/* Toggle Log to Group */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} color="#6366f1" />
          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff' }}>
            Split this expense with a group?
          </span>
        </div>

        <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
          <input 
            type="checkbox"
            checked={isGroupExpense}
            onChange={(e) => setIsGroupExpense(e.target.checked)}
            style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
          />
        </label>
      </div>

      {isGroupExpense && activeGrp && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
          
          {/* Select Group & Paid By */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Group</label>
              <select 
                className="input-field"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
              >
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group" style={{ margin: 0 }}>
              <label className="input-label">Paid By</label>
              <select 
                className="input-field"
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
              >
                {activeGrp.members.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.name} {m.userId === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Split Strategy Tabs */}
          <div>
            <label className="input-label" style={{ marginBottom: '6px' }}>Split Method</label>
            <div style={{
              display: 'flex',
              background: '#0d131f',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              {[
                { id: 'EQUAL', label: 'Equal (=)' },
                { id: 'PERCENT', label: 'Percent (%)' },
                { id: 'CUSTOM', label: 'Exact (₹)' }
              ].map(tab => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setSplitType(tab.id)}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: splitType === tab.id ? '#6366f1' : 'transparent',
                    color: splitType === tab.id ? '#ffffff' : 'var(--text-secondary)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* EQUAL Split Breakdown */}
          {splitType === 'EQUAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Divided equally among selected members (₹{equalShareAmount} / person):
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeGrp.members.map(m => {
                  const isChecked = selectedMemberIds.includes(m.userId);
                  return (
                    <label 
                      key={m.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '8px 12px',
                        background: '#0b1019',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMemberIds([...selectedMemberIds, m.userId]);
                            } else {
                              if (selectedMemberIds.length > 1) {
                                setSelectedMemberIds(selectedMemberIds.filter(id => id !== m.userId));
                              }
                            }
                          }}
                        />
                        <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{m.name}</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', color: isChecked ? '#6366f1' : 'var(--text-muted)', fontWeight: 700 }}>
                        {isChecked ? `₹${equalShareAmount}` : 'Excluded'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* PERCENT Split Breakdown */}
          {splitType === 'PERCENT' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Enter percentage allocation per member:</span>
                <span style={{ color: isPercentValid ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                  Total: {totalPercentSum.toFixed(1)}% {isPercentValid ? '✓' : '(Must equal 100%)'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeGrp.members.map(m => {
                  const pct = customPercents[m.userId] || 0;
                  const calculatedShare = ((expenseAmount * pct) / 100).toFixed(2);
                  return (
                    <div 
                      key={m.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '6px 12px',
                        background: '#0b1019',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{m.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>₹{calculatedShare}</span>
                        <div style={{ width: '80px', position: 'relative' }}>
                          <input 
                            type="number"
                            step="1"
                            className="input-field"
                            style={{ padding: '4px 20px 4px 8px', fontSize: '0.85rem', textAlign: 'right' }}
                            value={pct}
                            onChange={(e) => setCustomPercents({ ...customPercents, [m.userId]: e.target.value })}
                          />
                          <span style={{ position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CUSTOM Exact Dollar Split Breakdown */}
          {splitType === 'CUSTOM' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Enter exact share amount per member:</span>
                <span style={{ color: isCustomValid ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                  Total: ₹{totalSharesSum.toFixed(2)} / ₹{expenseAmount.toFixed(2)} {isCustomValid ? '✓' : '(Must match total)'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {activeGrp.members.map(m => {
                  const shareVal = customShares[m.userId] || 0;
                  return (
                    <div 
                      key={m.userId}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '6px 12px',
                        background: '#0b1019',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{m.name}</span>
                      <div style={{ width: '110px', position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                        <input 
                          type="number"
                          step="1"
                          className="input-field"
                          style={{ padding: '4px 8px 4px 18px', fontSize: '0.85rem' }}
                          value={shareVal}
                          onChange={(e) => setCustomShares({ ...customShares, [m.userId]: e.target.value })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
