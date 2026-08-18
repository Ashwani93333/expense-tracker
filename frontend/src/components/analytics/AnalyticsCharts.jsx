import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, PieChart as PieIcon, Award, Calendar, RefreshCw } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { expensesApi } from '../../services/api';

const PALETTE = ['#2563eb', '#10b981', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#84cc16'];

export const AnalyticsCharts = () => {
  const { expenses, currentMonth, setCurrentMonth } = useExpense();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await expensesApi.summary(currentMonth);
        setSummary(data);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSummary();
  }, [currentMonth, expenses.length]);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Header with month picker */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span className="badge badge-blue"><TrendingUp size={11} /> Analytics</span>
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 }}>Spending Analytics</h2>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="month"
              value={currentMonth}
              onChange={e => setCurrentMonth(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.83rem', cursor: 'pointer', maxWidth: '180px' }}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        {[
          { label: 'Total Spend',      value: loading ? '—' : `₹${totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,   color: '#dc2626' },
          { label: 'Avg Transaction',  value: loading ? '—' : `₹${avgTransaction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, color: '#d97706' },
          { label: 'Transactions',     value: loading ? '—' : `${expenses.length}`,                                                       color: '#059669' },
          { label: 'Top Category',     value: loading ? '—' : (categoryPieData[0]?.name || 'N/A'),                                        color: '#2563eb' },
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
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
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
            <TrendingUp size={18} color="var(--accent)" />
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
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="100%" stopColor="#60a5fa" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={val => `₹${val}`} />
                <Tooltip contentStyle={tooltipStyle} formatter={val => [`₹${val.toFixed(2)}`, 'Spend']} cursor={{ fill: 'var(--bg-muted)' }} />
                <Bar dataKey="amount" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <PieIcon size={18} color="var(--accent)" />
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
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none">
                    {categoryPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
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
            <Award size={18} color="#d97706" />
            <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>Top Expense Descriptions</h4>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {topMerchants.map((item, i) => {
              const pct = totalSpent > 0 ? ((item.total / totalSpent) * 100).toFixed(1) : '0.0';
              return (
                <div key={item.merchant} style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                  borderRadius: 'var(--r-md)', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                }}>
                  <span style={{
                    fontWeight: 800, fontSize: '0.9rem',
                    color: i === 0 ? '#d97706' : 'var(--text-muted)',
                    width: '22px', flexShrink: 0,
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
    </div>
  );
};
