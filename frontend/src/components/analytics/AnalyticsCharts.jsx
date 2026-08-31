import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Award, Calendar, RefreshCw, Sparkles } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { expensesApi } from '../../services/api';
import { PageHeader } from '../ui/PageHeader';
import { InsightCard } from '../ui/InsightCard';
import { DateFilterBar } from '../layout/DateFilterBar';

const PALETTE = ['#B7FF00', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];

const CustomCenterLabel = ({ viewBox, totalSpent }) => {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '1.4rem', fontWeight: 800, fill: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
        ₹{totalSpent.toLocaleString('en-IN')}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.72rem', fontWeight: 600, fill: 'var(--text-muted)' }}>
        spent
      </text>
    </g>
  );
};

export const AnalyticsCharts = () => {
  const { expenses, dateFilter, setDateFilter } = useExpense();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await expensesApi.summary(dateFilter);
        setSummary(data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [dateFilter, expenses.length]);

  const categoryPieData = summary?.categoryBreakdown?.length > 0
    ? summary.categoryBreakdown.map((c, i) => ({ name: c.categoryName, value: c.total, color: PALETTE[i % PALETTE.length] }))
    : (() => {
        const m = {};
        expenses.forEach((exp, i) => {
          const n = exp.categoryName || 'Other';
          if (!m[n]) m[n] = { name: n, value: 0, color: PALETTE[Object.keys(m).length % PALETTE.length] };
          m[n].value += exp.amount || 0;
        });
        return Object.values(m);
      })();

  const trendBarData = summary?.dailyBreakdown?.length > 0
    ? summary.dailyBreakdown.map(d => ({
        date: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        amount: parseFloat((d.total || 0).toFixed(2)),
      }))
    : (() => {
        const m = {};
        expenses.forEach(exp => {
          const d = exp.expenseDate || exp.date || 'N/A';
          if (!m[d]) m[d] = 0;
          m[d] += exp.amount || 0;
        });
        return Object.keys(m).sort().map(d => ({
          date: new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
          amount: parseFloat(m[d].toFixed(2)),
        }));
      })();

  const totalSpent = summary?.totalSpent ?? expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const avgTransaction = expenses.length > 0 ? totalSpent / expenses.length : 0;

  const merchantMap = {};
  expenses.forEach(exp => {
    const m = exp.description || 'Unknown';
    if (!merchantMap[m]) merchantMap[m] = 0;
    merchantMap[m] += exp.amount || 0;
  });
  const topMerchants = Object.entries(merchantMap).map(([d, t]) => ({ merchant: d, total: t })).sort((a, b) => b.total - a.total).slice(0, 5);

  const tooltipStyle = { background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', boxShadow: 'var(--shadow-md)' };

  const topCat = categoryPieData[0];
  const insightText = topCat && totalSpent > 0
    ? `Your ${topCat.name} spending is ₹${topCat.value.toLocaleString('en-IN')} in this period, representing ${((topCat.value / totalSpent) * 100).toFixed(1)}% of your total spending.`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header with date filter */}
      <DateFilterBar />

      <PageHeader
        icon={TrendingUp}
        badge="Analytics"
        title="Spending Analytics"
        subtitle="Understand where your money goes."
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter(prev => ({ ...prev }))} title="Refresh">
              <RefreshCw size={14} />
            </button>
          </div>
        }
      />

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Spend',      value: loading ? '—' : `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,   accent: '#B7FF00' },
          { label: 'Avg Transaction',  value: loading ? '—' : `₹${avgTransaction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, accent: '#f59e0b' },
          { label: 'Transactions',     value: loading ? '—' : `${expenses.length}`,                                                       accent: '#22c55e' },
          { label: 'Top Category',     value: loading ? '—' : (categoryPieData[0]?.name || 'N/A'),                                        accent: '#B7FF00' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            {loading ? (
              <>
                <div className="skeleton" style={{ height: '12px', width: '55%', marginBottom: '10px' }} />
                <div className="skeleton" style={{ height: '28px', width: '75%' }} />
              </>
            ) : (
              <>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>{s.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.accent === '#B7FF00' ? 'var(--text-primary)' : s.accent, letterSpacing: '-0.02em' }}>
                  {s.label === 'Top Category' ? <span style={{ color: s.accent }}>{s.value}</span> : s.value}
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* Bar Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#050505', border: '1px solid #1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={16} color="#B7FF00" />
            </div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Daily Spend Trend</h4>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--r-md)' }} />
          ) : trendBarData.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trendBarData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B7FF00" />
                    <stop offset="100%" stopColor="#8AB000" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="date" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={val => [`₹${val.toFixed(2)}`, 'Spend']} cursor={{ fill: 'rgba(183,255,0,0.04)' }} />
                <Bar dataKey="amount" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#050505', border: '1px solid #1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <PieIcon size={16} color="#B7FF00" />
            </div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Category Breakdown</h4>
          </div>
          {loading ? (
            <div className="skeleton" style={{ height: '220px', borderRadius: '50%', width: '220px', margin: '0 auto' }} />
          ) : categoryPieData.length === 0 ? (
            <div style={{ height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No expense data yet.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                    {categoryPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <CustomCenterLabel totalSpent={totalSpent} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={val => [`₹${Number(val).toFixed(2)}`, 'Spent']} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
                {categoryPieData.map(c => (
                  <span key={c.name} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '3px 8px', borderRadius: 'var(--r-md)', fontSize: '0.72rem', fontWeight: 600,
                    background: `${c.color}15`, color: c.color,
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    {c.name}: ₹{c.value.toFixed(0)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Top Merchants */}
      {topMerchants.length > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: '#050505', border: '1px solid #1a1a1a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Award size={16} color="#B7FF00" />
            </div>
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Top Expense Descriptions</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topMerchants.map((item, i) => {
              const pct = totalSpent > 0 ? ((item.total / totalSpent) * 100).toFixed(1) : '0.0';
              return (
                <div key={item.merchant} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: 'var(--r-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  transition: 'var(--t-fast)',
                }}>
                  <span style={{
                    fontWeight: 800, fontSize: '0.85rem',
                    color: i === 0 ? 'var(--accent)' : 'var(--text-faint)',
                    width: '24px', flexShrink: 0,
                  }}>#{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.merchant}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pct}%</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', flexShrink: 0 }}>
                    ₹{item.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Insight */}
      {insightText && (
        <InsightCard
          description={insightText}
          actionLabel="View Dashboard"
        />
      )}
    </div>
  );
};
