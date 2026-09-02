import React from 'react';
import { Briefcase, TrendingUp, Plus, Repeat, Wallet, ArrowUpRight } from 'lucide-react';
import { useIncome } from '../context/IncomeContext';
import { useExpense } from '../context/ExpenseContext';
import { DateFilterBar } from '../components/layout/DateFilterBar';
import { SummaryCard } from '../components/ui/SummaryCard';

const SOURCE_COLORS = {
  SALARY: 'var(--accent)',
  FREELANCE: 'var(--blue)',
  INVESTMENTS: 'var(--amber)',
  BUSINESS: 'var(--violet)',
  RENTAL: '#ec4899',
  GIFTS: 'var(--red)',
  REFUNDS: '#06b6d4',
  OTHER: 'var(--text-muted)',
};

const SOURCE_LABELS = {
  SALARY: 'Salary',
  FREELANCE: 'Freelance',
  INVESTMENTS: 'Investments',
  BUSINESS: 'Business',
  RENTAL: 'Rental',
  GIFTS: 'Gifts',
  REFUNDS: 'Refunds',
  OTHER: 'Other',
};

export const IncomePage = () => {
  const { incomes, incomeSummary, isLoading, openAddIncome } = useIncome();
  const { setActiveTab } = useExpense();

  const totalIncome = incomeSummary?.totalIncome ?? incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const count = incomeSummary?.count ?? incomes.length;
  const sourceBreakdown = incomeSummary?.sourceBreakdown || [];
  const recurringCount = incomes.filter(i => i.isRecurring).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <DateFilterBar />

      {/* Hero */}
      <div style={{
        padding: '32px',
        borderRadius: 'var(--r-2xl)',
        background: 'linear-gradient(135deg, #050505 0%, #0d0d0d 50%, #050505 100%)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(183,255,0,0.12)',
      }}>
        <div style={{
          position: 'absolute', top: '-60%', right: '-15%',
          width: '400px', height: '400px',
          background: 'radial-gradient(circle, rgba(183,255,0,0.06), transparent 65%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.4rem, 3vw, 2rem)',
              fontWeight: 800, color: '#ffffff',
              letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.2,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Briefcase size={28} color="var(--accent)" /> Income Tracker
            </h1>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', maxWidth: '460px', lineHeight: 1.6, marginBottom: '24px' }}>
              Track all your income sources in one place. Monitor earnings, spot trends, and understand your total financial picture.
            </p>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={openAddIncome} style={{ fontSize: '0.85rem' }}>
                <Plus size={15} /> Add Income
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setActiveTab('dashboard')}
                style={{ fontSize: '0.85rem' }}
              >
                <Wallet size={15} /> View Dashboard
              </button>
            </div>
          </div>

          <div style={{
            background: 'var(--accent-light)',
            border: '1px solid rgba(183,255,0,0.15)',
            borderRadius: 'var(--r-xl)',
            padding: '20px 24px',
            minWidth: '180px',
            textAlign: 'right',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Total Income
            </p>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '-0.03em', lineHeight: 1 }}>
              ₹{totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              {count} {count === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <SummaryCard
          label="Total Income"
          value={`₹${totalIncome.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          sub={`${count} entries`}
          icon={TrendingUp}
          accent="var(--accent)"
          loading={isLoading}
        />
        <SummaryCard
          label="Recurring"
          value={`${recurringCount}`}
          sub={`of ${count} entries`}
          icon={Repeat}
          accent="#3b82f6"
          loading={isLoading}
        />
        {sourceBreakdown.length > 0 && (
          <SummaryCard
            label="Top Source"
            value={SOURCE_LABELS[sourceBreakdown[0].source] || sourceBreakdown[0].source}
            sub={`₹${Number(sourceBreakdown[0].total).toLocaleString('en-IN')}`}
            icon={Briefcase}
            accent={SOURCE_COLORS[sourceBreakdown[0].source] || '#737373'}
            loading={isLoading}
          />
        )}
      </div>

      {/* Source Breakdown */}
      {sourceBreakdown.length > 0 && (
        <div className="card" style={{ padding: '22px' }}>
          <div className="section-header">
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Briefcase size={16} color="var(--accent)" /> Income by Source
            </h3>
          </div>
          {sourceBreakdown.map((item, i) => {
            const pct = totalIncome > 0 ? ((Number(item.total) / totalIncome) * 100) : 0;
            const color = SOURCE_COLORS[item.source] || '#737373';
            return (
              <div key={item.source || i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }} />
                    {SOURCE_LABELS[item.source] || item.source}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ₹{Number(item.total).toLocaleString('en-IN')}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)' }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
                <div className="progress-track" style={{ height: '5px' }}>
                  <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
