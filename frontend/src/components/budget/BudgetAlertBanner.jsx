import React from 'react';
import { AlertTriangle, AlertOctagon, X, ArrowRight } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const BudgetAlertBanner = ({ groupId = null, onDismiss }) => {
  const { personalBudget, expenses, groups, setActiveTab, setIsBudgetModalOpen } = useExpense();

  const currentMonth = '2026-08';

  let alertType = null;
  let title = '';
  let message = '';
  let spent = 0;
  let limit = 0;

  if (groupId) {
    const grp = groups.find(g => g.id === groupId);
    if (!grp) return null;
    const groupExpenses = expenses.filter(e => e.groupId === groupId && e.date.startsWith(currentMonth));
    spent = groupExpenses.reduce((sum, e) => sum + e.amount, 0);
    limit = grp.totalBudget;

    const ratio = spent / (limit || 1);
    if (ratio >= 1.0) {
      alertType = 'EXCEEDED';
      title = `Group "${grp.name}" Exceeded Monthly Budget!`;
      message = `Aggregate group spend is ₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, which is ₹${(spent - limit).toLocaleString('en-IN', { minimumFractionDigits: 2 })} over the ₹${limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} budget.`;
    } else if (ratio >= 0.8) {
      alertType = 'THRESHOLD';
      title = `Group "${grp.name}" at ${(ratio * 100).toFixed(0)}% of Budget`;
      message = `Group spend reached ₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })} out of ₹${limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}. Consider reviewing shared expenses.`;
    }
  } else {
    // Personal Budget check
    spent = expenses.filter(e => e.date.startsWith(currentMonth)).reduce((sum, e) => {
      if (e.groupId && e.splits) {
        const mySplit = e.splits.find(s => s.userId === 'user-alex');
        return sum + (mySplit ? mySplit.shareAmount : 0);
      }
      return sum + e.amount;
    }, 0);

    limit = personalBudget.overallLimit;
    const ratio = spent / (limit || 1);

    if (ratio >= 1.0) {
      alertType = 'EXCEEDED';
      title = 'Personal Monthly Budget Exceeded!';
      message = `Your total spend is ₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}, exceeding your ₹${limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} target by ₹${(spent - limit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`;
    } else if (ratio >= 0.8) {
      alertType = 'THRESHOLD';
      title = `Personal Budget Alert: ${(ratio * 100).toFixed(0)}% Utilized`;
      message = `You have spent ₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })} of your ₹${limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })} monthly limit. ₹${(limit - spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })} remaining.`;
    }
  }

  if (!alertType) return null;

  const isExceeded = alertType === 'EXCEEDED';
  const accentColor = isExceeded ? '#ef4444' : '#f59e0b';
  const Icon = isExceeded ? AlertOctagon : AlertTriangle;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justify: 'space-between',
      gap: '16px',
      padding: '14px 18px',
      borderRadius: 'var(--radius-md)',
      background: isExceeded ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
      border: `1px solid ${accentColor}44`,
      borderLeft: `4px solid ${accentColor}`,
      marginBottom: '16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          padding: '8px',
          borderRadius: '50%',
          background: `${accentColor}22`,
          color: accentColor,
          display: 'flex',
          alignItems: 'center',
          justify: 'center'
        }}>
          <Icon size={20} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.925rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
            {title}
          </h4>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {message}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => {
            if (groupId) {
              setIsBudgetModalOpen(true);
            } else {
              setActiveTab('budget-settings');
            }
          }}
          style={{ borderColor: `${accentColor}44`, color: '#ffffff' }}
        >
          <span>Adjust Budget</span>
          <ArrowRight size={14} />
        </button>

        {onDismiss && (
          <button 
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onDismiss}
            title="Dismiss alert"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
};
