import React, { useEffect, useState } from 'react';
import {
  DollarSign, TrendingUp, Plus, Calendar, ArrowUpRight,
  Users, Target, Wallet, AlertTriangle, ScanLine, CreditCard,
  ArrowDownRight, TrendingDown, ChevronRight, Sparkles, PieChart as PieIcon,
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { expensesApi } from '../services/api';
import { SummaryCard } from '../components/ui/SummaryCard';
import { InsightCard } from '../components/ui/InsightCard';
import { DateFilterBar } from '../components/layout/DateFilterBar';
import { describeFilter } from '../utils/dateFilter';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

export const DashboardPage = () => {
  const {
    expenses, personalBudget, groups,
    setIsAddModalOpen, setActiveTab, setActiveGroupId,
    dateFilter, isLoading,
  } = useExpense();
  const { currentUser } = useAuth();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [prevSummary, setPrevSummary] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const data = await expensesApi.summary(dateFilter);
        setSummary(data);
      } catch { setSummary(null); }
      finally { setSummaryLoading(false); }
    };
    fetchSummary();
  }, [dateFilter, expenses.length]);

  useEffect(() => {
    // "vs last month" comparison only makes sense in month mode.
    if (dateFilter.mode !== 'month') { setPrevSummary(null); return; }
    const fetchPrevSummary = async () => {
      try {
        const m = dateFilter.month;
        const prev = new Date(+m.slice(0, 4), +m.slice(5, 7) - 2, 1);
        const prevKey = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
        const data = await expensesApi.summary({ month: prevKey });
        setPrevSummary(data);
      } catch { setPrevSummary(null); }
    };
    fetchPrevSummary();
  }, [dateFilter]);

  const recentExpenses = expenses.slice(0, 5);
  const periodLabel = describeFilter(dateFilter);
  const totalSpent = summary?.totalSpent ?? expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const remaining = personalBudget.overallLimit > 0 ? Math.max(personalBudget.overallLimit - (personalBudget.spent || 0), 0) : null;

  const prevTotalSpent = prevSummary?.totalSpent ?? 0;
  const spendChange = prevTotalSpent > 0 ? ((totalSpent - prevTotalSpent) / prevTotalSpent * 100) : null;
  const spendTrendUp = spendChange !== null && spendChange > 0;

  const topCategory = summary?.categoryBreakdown?.[0];
  const insightText = topCategory && summary?.totalSpent > 0
    ? `Your ${topCategory.categoryName} spending is ₹${topCategory.total.toLocaleString('en-IN')} in this period, representing ${((topCategory.total / summary.totalSpent) * 100).toFixed(1)}% of your total spending.`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Date filter bar */}
      <DateFilterBar />

      {/* Hero Section */}
      <div style={{
        padding: '36px 32px',
        borderRadius: 'var(--r-2xl)',
        background: 'linear-gradient(135deg, #050505 0%, #141414 50%, #0a0a0a 100%)',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid #1a1a1a',
      }}>
        {/* Subtle glow */}
        <div style={{
          position: 'absolute', top: '-60%', right: '-15%',
          width: '450px', height: '450px',
          background: 'radial-gradient(circle, rgba(183,255,0,0.06), transparent 65%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-40%', left: '-10%',
          width: '300px', height: '300px',
          background: 'radial-gradient(circle, rgba(139,92,246,0.04), transparent 65%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <p style={{ fontSize: '0.88rem', color: '#737373', fontWeight: 500, marginBottom: '6px' }}>
              {getGreeting()}, {currentUser?.fullName?.split(' ')[0] || 'there'}
            </p>
            <h1 style={{
              fontSize: 'clamp(1.5rem, 3vw, 2.1rem)',
              fontWeight: 800, color: '#ffffff',
              letterSpacing: '-0.03em', marginBottom: '8px', lineHeight: 1.2,
            }}>
              Your money, clearly understood.
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#737373', maxWidth: '500px', lineHeight: 1.6, marginBottom: '24px' }}>
              Track your spending. Stay within your budget. Make smarter financial decisions.
            </p>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-primary"
                onClick={() => setIsAddModalOpen(true)}
                style={{ fontSize: '0.85rem' }}
              >
                <Plus size={15} /> Add Expense
              </button>
              <button
                className="btn"
                onClick={() => setActiveTab('scan')}
                style={{
                  fontSize: '0.85rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e5e5e5',
                  border: '1px solid #333',
                }}
              >
                <ScanLine size={15} /> Scan Receipt
              </button>
            </div>
          </div>

          {/* Hero quick stat */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 'var(--r-xl)',
            padding: '20px 24px',
            minWidth: '180px',
            textAlign: 'right',
          }}>
            <p style={{ fontSize: '0.72rem', color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Total Spending
            </p>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {summaryLoading ? (
                <span style={{ display: 'inline-block', width: '100px', height: '28px' }} className="skeleton" />
              ) : (
                `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
              )}
            </div>
            {spendChange !== null && (
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: '2px',
                  color: spendTrendUp ? '#ef4444' : '#22c55e',
                  fontWeight: 700, fontSize: '0.78rem',
                }}>
                  {spendTrendUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {Math.abs(spendChange).toFixed(1)}%
                </span>
                <span style={{ fontSize: '0.72rem', color: '#737373' }}>vs last month</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }} className="responsive-grid">
        <SummaryCard
          label="Total Spending"
          value={`₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          sub={summaryLoading ? 'Loading...' : `${summary?.categoryBreakdown?.length || 0} categories`}
          icon={Wallet}
          accent="#B7FF00"
          loading={summaryLoading}
        />

        <SummaryCard
          label="Monthly Budget"
          value={personalBudget.overallLimit > 0
            ? `₹${personalBudget.overallLimit.toLocaleString('en-IN')}`
            : 'Not set'}
          sub={personalBudget.overallLimit > 0
            ? `${personalBudget.percentUsed?.toFixed(0)}% used`
            : 'Set a budget'}
          icon={Target}
          accent={personalBudget.status === 'OK' ? '#22c55e' : personalBudget.status === 'WARNING' ? '#f59e0b' : '#ef4444'}
          loading={isLoading}
          onClick={() => setActiveTab('budget-settings')}
        />

        {remaining !== null && (
          <SummaryCard
            label="Remaining"
            value={`₹${remaining.toLocaleString('en-IN')}`}
            sub={`${Math.max(100 - (personalBudget.percentUsed || 0), 0).toFixed(0)}% available`}
            icon={TrendingUp}
            accent="#22c55e"
            loading={isLoading}
          />
        )}

        <SummaryCard
          label="Transactions"
          value={`${expenses.length}`}
          sub={`in ${periodLabel}`}
          icon={CreditCard}
          accent="#B7FF00"
          loading={isLoading}
        />
      </div>

      {/* Budget Alert */}
      {(personalBudget.status === 'WARNING' || personalBudget.status === 'EXCEEDED') && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px',
          borderRadius: 'var(--r-xl)',
          background: personalBudget.status === 'EXCEEDED' ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.06)',
          border: `1px solid ${personalBudget.status === 'EXCEEDED' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '10px',
            background: personalBudget.status === 'EXCEEDED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <AlertTriangle size={18} color={personalBudget.status === 'EXCEEDED' ? '#ef4444' : '#f59e0b'} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {personalBudget.status === 'EXCEEDED' ? 'Budget Exceeded' : 'Budget Warning'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ₹{personalBudget.spent?.toFixed(2)} spent of ₹{personalBudget.overallLimit?.toFixed(2)} ({personalBudget.percentUsed?.toFixed(1)}% used)
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('budget-settings')}>
            Manage
          </button>
        </div>
      )}

      {/* AI Insight */}
      {insightText && (
        <InsightCard
          description={insightText}
          onAction={() => setActiveTab('analytics')}
          actionLabel="View Analytics"
        />
      )}

      {/* Recent + Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }} className="responsive-grid-2">

        {/* Category Breakdown */}
        <div className="card" style={{ padding: '22px' }}>
          <div className="section-header">
            <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <PieIcon size={16} color="var(--accent)" /> Where your money goes
            </h3>
          </div>
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div className="skeleton" style={{ height: '12px', width: '45%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '25%' }} />
                </div>
                <div className="skeleton" style={{ height: '5px', width: '100%' }} />
              </div>
            ))
          ) : summary?.categoryBreakdown?.length > 0 ? (
            summary.categoryBreakdown.slice(0, 5).map((cat, i) => {
              const pct = summary.totalSpent > 0 ? ((cat.total / summary.totalSpent) * 100) : 0;
              const colors = ['#B7FF00', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
              const color = colors[i % colors.length];
              return (
                <div key={cat.categoryId || cat.categoryName} style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.83rem', color: 'var(--text-primary)', fontWeight: 600 }}>{cat.categoryName}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                        ₹{cat.total.toLocaleString('en-IN')}
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
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                No expense data yet
              </p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={13} /> Add Expense
              </button>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: '22px' }}>
          <div className="section-header">
            <h3 className="section-title">Recent Expenses</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('expenses')} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '12px', width: '65%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '40%' }} />
                </div>
                <div className="skeleton" style={{ height: '16px', width: '65px' }} />
              </div>
            ))
          ) : recentExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <CreditCard size={30} color="var(--text-faint)" style={{ marginBottom: '8px' }} />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>No transactions yet.</p>
              <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
                <Plus size={13} /> Add First Expense
              </button>
            </div>
          ) : (
            recentExpenses.map(exp => (
              <div
                key={exp.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px', borderRadius: 'var(--r-lg)',
                  transition: 'var(--t-fast)', marginBottom: '3px', cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CreditCard size={16} color="var(--text-muted)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.description || 'Expense'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {exp.expenseDate || exp.date} · {exp.categoryName || 'Uncategorized'}
                    {exp.groupName && <span className="badge badge-lime" style={{ marginLeft: '6px', fontSize: '0.63rem' }}>{exp.groupName}</span>}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', flexShrink: 0 }}>
                  -₹{(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Groups Quick View */}
      {groups.length > 0 && (
        <div className="card" style={{ padding: '22px' }}>
          <div className="section-header">
            <h3 className="section-title">Your Groups</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('groups')} style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Manage <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {groups.map(grp => (
              <div
                key={grp.id}
                className="card-interactive card-hover-lift"
                onClick={() => { setActiveGroupId(grp.id); setActiveTab('group-detail'); }}
                style={{
                  padding: '16px', borderRadius: 'var(--r-lg)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#050505',
                    border: '1px solid #333',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent)',
                  }}>
                    {grp.name?.charAt(0).toUpperCase()}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {grp.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>
                    <Users size={10} /> {grp.memberCount || '?'} members
                  </span>
                  {grp.currentUserRole === 'ADMIN' && (
                    <span className="badge badge-lime" style={{ fontSize: '0.65rem' }}>Admin</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
