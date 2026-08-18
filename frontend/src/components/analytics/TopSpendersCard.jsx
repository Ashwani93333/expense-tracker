import React from 'react';
import { Trophy, Crown, TrendingUp } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';

export const TopSpendersCard = ({ groupId }) => {
  const { groups, expenses } = useExpense();
  const currentMonth = '2026-08';

  const grp = groups.find(g => g.id === groupId);
  if (!grp) return null;

  const groupExpenses = expenses.filter(e => e.groupId === groupId && e.date.startsWith(currentMonth));
  const groupTotalSpent = groupExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Compute spend per member
  const memberSpendMap = {};
  grp.members.forEach(m => { memberSpendMap[m.userId] = 0; });

  groupExpenses.forEach(exp => {
    if (exp.splits) {
      exp.splits.forEach(sp => {
        memberSpendMap[sp.userId] = (memberSpendMap[sp.userId] || 0) + sp.shareAmount;
      });
    } else {
      memberSpendMap[exp.paidBy] = (memberSpendMap[exp.paidBy] || 0) + exp.amount;
    }
  });

  const sortedSpenders = grp.members.map(m => ({
    userId: m.userId,
    name: m.name,
    spent: memberSpendMap[m.userId] || 0,
    percentage: groupTotalSpent > 0 ? ((memberSpendMap[m.userId] || 0) / groupTotalSpent) * 100 : 0
  })).sort((a, b) => b.spent - a.spent);

  return (
    <div className="glass-card" style={{ padding: '20px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Trophy size={18} color="#f59e0b" />
          <h3 style={{ fontSize: '1.05rem', color: '#ffffff', margin: 0 }}>Top Spenders</h3>
        </div>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>August 2026</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedSpenders.map((spender, idx) => (
          <div 
            key={spender.userId}
            style={{
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: '#131926',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: idx === 0 ? 'rgba(245, 158, 11, 0.2)' : '#1e293b',
                color: idx === 0 ? '#f59e0b' : '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justify: 'center',
                fontWeight: 800,
                fontSize: '0.85rem'
              }}>
                {idx === 0 ? <Crown size={16} /> : `#${idx + 1}`}
              </div>

              <div>
                <h5 style={{ fontSize: '0.9rem', color: '#ffffff', margin: 0, fontWeight: 700 }}>
                  {spender.name}
                </h5>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {spender.percentage.toFixed(0)}% of total group spend
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
                ${spender.spent.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
