import React, { useState } from 'react';
import { Edit2, Save } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { BudgetProgressBar } from './BudgetProgressBar';

export const MemberBudgetTable = ({ groupId }) => {
  const { groups, expenses, updateMemberBudgetCap, currentUser } = useExpense();
  const currentMonth = '2026-08';

  const grp = groups.find(g => g.id === groupId);
  if (!grp) return null;

  const isAdmin = grp.createdBy === currentUser.id || grp.members.some(m => m.userId === currentUser.id && m.role === 'ADMIN');
  const groupExpenses = expenses.filter(e => e.groupId === groupId && e.date.startsWith(currentMonth));

  const [editingUserId, setEditingUserId] = useState(null);
  const [tempCap, setTempCap] = useState('');

  const handleStartEdit = (member) => {
    setEditingUserId(member.userId);
    setTempCap(member.budgetCap ? member.budgetCap.toString() : '15000');
  };

  const handleSaveCap = (userId) => {
    updateMemberBudgetCap(groupId, userId, tempCap);
    setEditingUserId(null);
  };

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0 }}>
            Member Spend Caps & Utilization
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Per-member monthly spend limits inside {grp.name}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {grp.members.map(member => {
          // Calculate member's spend inside this group
          const memberSpent = groupExpenses.reduce((sum, exp) => {
            if (exp.splits) {
              const sp = exp.splits.find(s => s.userId === member.userId);
              return sum + (sp ? sp.shareAmount : 0);
            }
            return sum + (exp.paidBy === member.userId ? exp.amount : 0);
          }, 0);

          const cap = member.budgetCap || 15000;
          const isEditing = editingUserId === member.userId;

          return (
            <div 
              key={member.userId}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '14px 16px',
                background: '#131926',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    background: '#1e293b',
                    border: '1px solid #334155',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'center',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.85rem'
                  }}>
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.9rem', color: '#ffffff', fontWeight: 700 }}>
                        {member.name}
                      </span>
                      {member.userId === currentUser.id && (
                        <span style={{ fontSize: '0.7rem', color: '#6366f1', fontWeight: 600 }}>(You)</span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {member.role}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                      <input 
                        type="number"
                        className="input-field"
                        style={{ width: '100px', padding: '4px 8px', fontSize: '0.85rem' }}
                        value={tempCap}
                        onChange={(e) => setTempCap(e.target.value)}
                      />
                      <button 
                        className="btn btn-primary btn-sm btn-icon" 
                        onClick={() => handleSaveCap(member.userId)}
                        title="Save cap"
                      >
                        <Save size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>
                        Cap: ₹{cap.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      {isAdmin && (
                        <button 
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => handleStartEdit(member)}
                          title="Edit member cap"
                        >
                          <Edit2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress bar for member cap */}
              <BudgetProgressBar 
                spent={memberSpent}
                limit={cap}
                currency="₹"
                size="sm"
                showDetails={true}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
