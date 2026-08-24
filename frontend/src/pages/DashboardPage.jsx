import React, { useEffect, useState } from 'react';
import {
  DollarSign, TrendingUp, Plus, Calendar, ArrowUpRight,
  Users, Target, Wallet, AlertTriangle, ScanLine, ChevronRight, CreditCard
} from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { expensesApi } from '../services/api';

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, onClick, loading, trend }) => (
  <div
    className={`card${onClick ? ' card-interactive' : ''}`}
    onClick={onClick}
    style={{ padding: '20px 22px', cursor: onClick ? 'pointer' : 'default' }}
  >
    {loading ? (
      <>
        <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '14px' }} />
        <div className="skeleton" style={{ height: '30px', width: '70%', marginBottom: '8px' }} />
        <div className="skeleton" style={{ height: '11px', width: '45%' }} />
      </>
    ) : (
      <>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>{label}</span>
          {Icon && (
            <div style={{
              width: '34px', height: '34px', borderRadius: '9px',
              background: iconBg || '#eff6ff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={16} color={iconColor || 'var(--accent)'} />
            </div>
          )}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1 }}>
          {value}
        </div>
        {sub && (
          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {trend && <TrendingUp size={11} color="var(--green)" />}
            {sub}
          </div>
        )}
      </>
    )}
  </div>
);

// ─── Budget Status Pill ───────────────────────────────────────────────────────
const BudgetPill = ({ status, percentUsed }) => {
  const cfg = {
    OK:        { bg: '#d1fae5', color: '#065f46', label: 'On Track' },
    WARNING:   { bg: '#fef3c7', color: '#92400e', label: 'Warning' },
    EXCEEDED:  { bg: '#fee2e2', color: '#991b1b', label: 'Exceeded' },
    NO_BUDGET: { bg: '#ede9fe', color: '#4c1d95', label: 'No Budget' },
  };
  const c = cfg[status] || cfg.NO_BUDGET;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 9px', borderRadius: '99px', fontSize: '0.72rem', fontWeight: 700,
      background: c.bg, color: c.color,
    }}>
      {status !== 'NO_BUDGET' && `${percentUsed?.toFixed(0)}% · `}{c.label}
    </span>
  );
};

export const DashboardPage = () => {
  const {
    expenses, personalBudget, groups,
    setIsAddModalOpen, setActiveTab, setActiveGroupId,
    currentMonth, isLoading,
  } = useExpense();
  const { currentUser } = useAuth();

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setSummaryLoading(true);
      try {
        const data = await expensesApi.summary(currentMonth);
        setSummary(data);
      } catch { setSummary(null); }
      finally { setSummaryLoading(false); }
    };
    fetchSummary();
  }, [currentMonth, expenses.length]);

  const recentExpenses = expenses.slice(0, 6);
  const monthLabel = new Date(currentMonth + '-01').toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const totalSpent = summary?.totalSpent ?? expenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Welcome Banner */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-blue">
                <Calendar size={11} /> {monthLabel}
              </span>
              {personalBudget.status !== 'NO_BUDGET' && (
                <BudgetPill status={personalBudget.status} percentUsed={personalBudget.percentUsed} />
              )}
            </div>
            <h1 style={{ fontSize: '1.35rem', color: 'var(--text-primary)', marginBottom: '2px', fontWeight: 800 }}>
              Welcome back, {currentUser?.fullName?.split(' ')[0] || 'there'}
            </h1>
            <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              {expenses.length} transactions · {groups.length} group{groups.length !== 1 ? 's' : ''} · {currentMonth}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('groups')}>
              <Users size={13} /> Groups ({groups.length})
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('analytics')}>
              <TrendingUp size={13} /> Analytics
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('scan')} style={{ color: 'var(--accent)', borderColor: 'var(--border-accent)' }}>
              <ScanLine size={13} color="var(--accent)" /> Scan Receipt
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={13} /> Add Expense
            </button>
          </div>
        </div>
      </div>

      {/* Budget Alert */}
      {(personalBudget.status === 'WARNING' || personalBudget.status === 'EXCEEDED') && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px',
          borderRadius: 'var(--r-lg)',
          background: personalBudget.status === 'EXCEEDED' ? '#fef2f2' : '#fffbeb',
          border: `1px solid ${personalBudget.status === 'EXCEEDED' ? '#fecaca' : '#fde68a'}`,
        }}>
          <AlertTriangle size={17} color={personalBudget.status === 'EXCEEDED' ? '#dc2626' : '#d97706'} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
              {personalBudget.status === 'EXCEEDED' ? 'Monthly Budget Exceeded!' : 'Budget Warning — 80% Reached'}
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              ₹{personalBudget.spent?.toFixed(2)} spent of ₹{personalBudget.overallLimit?.toFixed(2)} limit ({personalBudget.percentUsed?.toFixed(1)}% used)
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('budget-settings')}>
            Manage Budget
          </button>
        </div>
      )}

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        <StatCard
          label="Total Month Spend"
          value={`₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          sub={summaryLoading ? 'Loading...' : `${summary?.categoryBreakdown?.length || 0} categories`}
          icon={Wallet}
          iconBg="#d1fae5" iconColor="#059669"
          loading={summaryLoading}
        />

        {/* Personal Budget Card */}
        <div className="card" style={{ padding: '20px 22px' }}>
          {isLoading ? (
            <>
              <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '14px' }} />
              <div className="skeleton" style={{ height: '8px', width: '100%', marginBottom: '8px' }} />
              <div className="skeleton" style={{ height: '11px', width: '45%' }} />
            </>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Personal Budget</span>
                <button className="btn btn-ghost btn-xs" onClick={() => setActiveTab('budget-settings')}>
                  <Target size={12} />
                </button>
              </div>
              {personalBudget.overallLimit > 0 ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ₹{(personalBudget.spent || 0).toLocaleString('en-IN')} / ₹{personalBudget.overallLimit.toLocaleString('en-IN')}
                    </span>
                    <span style={{
                      fontSize: '0.78rem', fontWeight: 700,
                      color: personalBudget.status === 'OK' ? '#059669' : personalBudget.status === 'WARNING' ? '#d97706' : '#dc2626',
                    }}>
                      {personalBudget.percentUsed?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{
                      width: `${Math.min(personalBudget.percentUsed || 0, 100)}%`,
                      background: personalBudget.status === 'OK' ? '#10b981' : personalBudget.status === 'WARNING' ? '#f59e0b' : '#ef4444',
                    }} />
                  </div>
                  <div style={{ marginTop: '8px' }}>
                    <BudgetPill status={personalBudget.status} percentUsed={personalBudget.percentUsed} />
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>No budget set</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('budget-settings')}>Set Budget</button>
                </div>
              )}
            </>
          )}
        </div>

        <StatCard
          label="Active Groups"
          value={`${groups.length}`}
          sub="Click to manage"
          icon={Users}
          iconBg="#ede9fe" iconColor="#7c3aed"
          loading={isLoading}
          onClick={() => setActiveTab('groups')}
        />

        <StatCard
          label="Transactions"
          value={`${expenses.length}`}
          sub={`in ${currentMonth}`}
          icon={DollarSign}
          iconBg="#dbeafe" iconColor="#2563eb"
          loading={isLoading}
        />
      </div>

      {/* Category Breakdown + Recent Transactions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>

        {/* Category Breakdown */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>
            Category Breakdown
          </h3>
          {summaryLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div className="skeleton" style={{ height: '12px', width: '45%' }} />
                  <div className="skeleton" style={{ height: '12px', width: '25%' }} />
                </div>
                <div className="skeleton" style={{ height: '5px', width: '100%' }} />
              </div>
            ))
          ) : summary?.categoryBreakdown?.length > 0 ? (
            summary.categoryBreakdown.slice(0, 6).map((cat, i) => {
              const pct = summary.totalSpent > 0 ? ((cat.total / summary.totalSpent) * 100) : 0;
              const colors = ['#2563eb', '#059669', '#7c3aed', '#d97706', '#dc2626', '#0891b2'];
              const color = colors[i % colors.length];
              return (
                <div key={cat.categoryId || cat.categoryName} style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{cat.categoryName}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ₹{cat.total.toLocaleString('en-IN')} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-track" style={{ height: '5px' }}>
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                  </div>
                </div>
              );
            })
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
              No expense data for this month.
            </p>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>Recent Transactions</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('expenses')} style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '12px', width: '65%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '40%' }} />
                </div>
                <div className="skeleton" style={{ height: '16px', width: '65px' }} />
              </div>
            ))
          ) : recentExpenses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <DollarSign size={30} color="var(--text-faint)" style={{ marginBottom: '8px' }} />
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
                  padding: '9px 10px', borderRadius: 'var(--r-lg)',
                  transition: 'var(--t-fast)', marginBottom: '3px', cursor: 'default',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  width: '36px', height: '36px', borderRadius: '9px', flexShrink: 0,
                  background: '#dbeafe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CreditCard size={16} color="#2563eb" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {exp.description || 'Expense'}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                    {exp.expenseDate || exp.date} · {exp.categoryName || 'Uncategorized'}
                    {exp.groupName && <span className="badge badge-blue" style={{ marginLeft: '6px', fontSize: '0.63rem' }}>{exp.groupName}</span>}
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626', flexShrink: 0 }}>
                  -₹{(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Groups Quick View */}
      {groups.length > 0 && (
        <div className="card" style={{ padding: '20px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 700 }}>Your Groups</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setActiveTab('groups')} style={{ fontSize: '0.78rem', color: 'var(--accent)' }}>
              Manage <ArrowUpRight size={12} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {groups.map(grp => (
              <div
                key={grp.id}
                className="card-interactive"
                onClick={() => { setActiveGroupId(grp.id); setActiveTab('group-detail'); }}
                style={{
                  padding: '14px 16px', borderRadius: 'var(--r-lg)',
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '30px', height: '30px', borderRadius: '8px',
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.8rem', fontWeight: 800, color: '#fff',
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
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>Admin</span>
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
