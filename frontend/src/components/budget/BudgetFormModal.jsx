import React, { useState, useEffect } from 'react';
import { X, Target, Save } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const BudgetFormModal = ({ isOpen, onClose, groupId = null }) => {
  const { 
    personalBudget, 
    updatePersonalBudget, 
    updateCategoryBudget, 
    groups, 
    updateGroupBudget,
    categories 
  } = useExpense();

  const isGroup = !!groupId;
  const activeGrp = isGroup ? groups.find(g => g.id === groupId) : null;

  const [overallLimit, setOverallLimit] = useState('');
  const [catLimits, setCatLimits] = useState({});

  useEffect(() => {
    if (isGroup && activeGrp) {
      setOverallLimit(activeGrp.totalBudget.toString());
    } else if (personalBudget) {
      setOverallLimit(personalBudget.overallLimit.toString());
      setCatLimits({ ...(personalBudget.categoryBudgets || {}) });
    }
  }, [isOpen, groupId, personalBudget, activeGrp]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isGroup && groupId) {
      updateGroupBudget(groupId, overallLimit);
    } else {
      updatePersonalBudget(overallLimit);
      Object.keys(catLimits).forEach(catId => {
        updateCategoryBudget(catId, catLimits[catId]);
      });
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="glass-card" 
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: '#0e1420',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '8px',
              borderRadius: 'var(--radius-md)',
              background: '#18181b',
              border: '1px solid #3f3f46',
              color: '#ffffff'
            }}>
              <Target size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', color: '#ffffff', margin: 0 }}>
                {isGroup ? `Group Budget: ${activeGrp?.name}` : 'Personal Budget Settings'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Set monthly spend limits and budget alerts for August 2026
              </p>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Main Limit */}
          <div className="input-group">
            <label className="input-label">
              {isGroup ? 'Group Total Monthly Budget (₹)' : 'Overall Personal Monthly Budget (₹)'}
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontWeight: 700, fontSize: '1.1rem' }}>₹</span>
              <input 
                type="number"
                step="500"
                required
                className="input-field"
                style={{ paddingLeft: '34px', fontSize: '1.1rem', fontWeight: 700 }}
                value={overallLimit}
                onChange={(e) => setOverallLimit(e.target.value)}
                placeholder="50000"
              />
            </div>
          </div>

          {/* Optional Category Budgets for Personal */}
          {!isGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span style={{ fontSize: '0.825rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Per-Category Spend Caps (Optional)
              </span>

              <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
                {categories.map(cat => (
                  <div 
                    key={cat.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'space-between',
                      padding: '8px 12px',
                      background: '#151b26',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat.color }} />
                      <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 600 }}>{cat.name}</span>
                    </div>

                    <div style={{ width: '130px', position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>₹</span>
                      <input 
                        type="number"
                        step="100"
                        className="input-field"
                        style={{ paddingLeft: '22px', padding: '6px 8px 6px 22px', fontSize: '0.85rem' }}
                        value={catLimits[cat.id] || ''}
                        onChange={(e) => setCatLimits({ ...catLimits, [cat.id]: e.target.value })}
                        placeholder="Limit"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer CTAs */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>Save Budget</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
