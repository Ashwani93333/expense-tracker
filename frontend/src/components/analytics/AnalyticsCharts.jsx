import React, { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  ComposedChart, Bar, Line, Area, XAxis, YAxis, CartesianGrid, ReferenceLine,
} from 'recharts';
import {
  TrendingUp, PieChart as PieIcon, Award, RefreshCw, Layers, Activity, Clock, Sigma, Hash,
  Wallet, Briefcase, PiggyBank,
} from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useIncome } from '../../context/IncomeContext';
import { expensesApi } from '../../services/api';
import { SOURCE_COLORS, SOURCE_LABELS } from '../../constants/incomesources';
import { PageHeader } from '../ui/PageHeader';
import { InsightCard } from '../ui/InsightCard';
import { SummaryCard } from '../ui/SummaryCard';
import { DateFilterBar } from '../layout/DateFilterBar';
import {
  GRANULARITIES, buildTimeSeries, resolveFilterRange, clampRangeToToday,
  granularityLabel, granularityTitle,
} from '../../utils/analytics';

const PALETTE = ['#B7FF00', '#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899'];

const inr = (n, dp = 2) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`;

const compactInr = (n) => {
  const v = Number(n) || 0;
  if (Math.abs(v) >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (Math.abs(v) >= 100000) return `₹${(v / 100000).toFixed(2)}L`;
  if (Math.abs(v) >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
  return `₹${v.toFixed(0)}`;
};

const CustomCenterLabel = ({ viewBox, value, caption = 'spent' }) => {
  const { cx, cy } = viewBox;
  return (
    <g>
      <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '1.4rem', fontWeight: 800, fill: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
        ₹{(Number(value) || 0).toLocaleString('en-IN')}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" dominantBaseline="central" style={{ fontSize: '0.72rem', fontWeight: 600, fill: 'var(--text-muted)' }}>
        {caption}
      </text>
    </g>
  );
};

const SectionTitle = ({ icon: Icon, title, right }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '32px', height: '32px', borderRadius: '8px',
        background: '#050505', border: '1px solid #1a1a1a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color="#B7FF00" />
      </div>
      <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', fontWeight: 700 }}>{title}</h4>
    </div>
    {right}
  </div>
);

const GranularityPicker = ({ value, onChange }) => (
  <div className="pill-group">
    {GRANULARITIES.map(g => (
      <button
        key={g.id}
        className={`pill-item${value === g.id ? ' active' : ''}`}
        onClick={() => onChange(g.id)}
      >
        {g.label}
      </button>
    ))}
  </div>
);

const EmptyChart = ({ height, message }) => (
  <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
    {message}
  </div>
);

export const AnalyticsCharts = () => {
  const { expenses, dateFilter, setDateFilter, dataVersion, setActiveTab } = useExpense();
  const { incomes, incomeSummary, isLoading: incomeLoading, financialOverview } = useIncome();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [granularity, setGranularity] = useState('day');
  const [compareMode, setCompareMode] = useState('spend');

  useEffect(() => {
    let cancelled = false;
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const data = await expensesApi.summary(dateFilter);
        if (!cancelled) setSummary(data);
      } catch {
        if (!cancelled) setSummary(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchSummary();
    return () => { cancelled = true; };
  }, [dateFilter, dataVersion]);

  // Keep the chart readable: day buckets for short ranges, coarser for long ones.
  useEffect(() => {
    const { start, end } = resolveFilterRange(dateFilter);
    const spanDays = Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
    setGranularity(spanDays <= 45 ? 'day' : spanDays <= 240 ? 'week' : 'month');
  }, [dateFilter]);

  const range = useMemo(() => clampRangeToToday(resolveFilterRange(dateFilter)), [dateFilter]);

  // Single source of truth: both the totals and the averages come from the same
  // expense list, bucketed by time. No more `sqlTotal / jsArrayLength`.
  const series = useMemo(
    () => buildTimeSeries(expenses, range, granularity),
    [expenses, range, granularity],
  );

  const { totals, extremes, rows } = series;
  const bucketUnit = granularityLabel(granularity);

  // Income bucketed with the exact same ranges as spend, so every chart can
  // plot the two series side by side for comparison.
  const incomeSeries = useMemo(
    () => buildTimeSeries(incomes.map(i => ({ ...i, expenseDate: i.incomeDate })), range, granularity),
    [incomes, range, granularity],
  );

  const incomeByKey = useMemo(() => {
    const m = new Map();
    incomeSeries.rows.forEach(r => m.set(r.key, r.spend));
    return m;
  }, [incomeSeries]);

  const categoryPieData = summary?.categoryBreakdown?.length > 0
    ? summary.categoryBreakdown.map((c, i) => ({ name: c.categoryName, value: Number(c.total) || 0, color: PALETTE[i % PALETTE.length] }))
    : (() => {
        const m = {};
        expenses.forEach(exp => {
          const n = exp.categoryName || 'Uncategorised';
          if (!m[n]) m[n] = { name: n, value: 0 };
          m[n].value += Number(exp.amount) || 0;
        });
        return Object.values(m).sort((a, b) => b.value - a.value)
          .map((c, i) => ({ ...c, color: PALETTE[i % PALETTE.length] }));
      })();

  // Chart series: spend, transaction count and the time-wise average, aligned
  // on the same bucket so the bars can be read against the average line.
  // `income` rides along on every row so the chart can switch to a
  // spend-vs-income comparison without re-bucketing.
  const chartData = rows.map(r => ({
    label: r.label,
    fullLabel: r.fullLabel,
    spend: r.spend,
    count: r.count,
    avg: r.avgPerTransaction,
    rollingAvg: r.rollingAvg,
    avgPerDay: r.avgPerDay,
    income: incomeByKey.get(r.key) || 0,
  }));

  // In comparison mode the axis has to fit the taller of the two series.
  const chartMax = compareMode === 'income'
    ? Math.max(1, ...chartData.map(d => Math.max(d.spend, d.income)))
    : Math.max(1, ...chartData.map(d => d.spend));
  const avgLineMax = Math.max(1, ...chartData.map(d => Math.max(d.rollingAvg, d.avg)));
  const peakLabel = extremes.biggestBucket?.label;
  const busiestLabel = extremes.busiestBucket?.label;

  const merchantMap = {};
  expenses.forEach(exp => {
    const m = exp.description || 'Unknown';
    merchantMap[m] = (merchantMap[m] || 0) + (Number(exp.amount) || 0);
  });
  const topMerchants = Object.entries(merchantMap)
    .map(([d, t]) => ({ merchant: d, total: t }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const tooltipStyle = { background: '#fff', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '0.8rem', boxShadow: 'var(--shadow-md)' };

  const periodTotals = useMemo(() => {
    const local = totals.spend;
    const server = Number(summary?.totalSpent);
    return {
      spend: Number.isFinite(server) && server > 0 ? server : local,
      mismatch: Number.isFinite(server) && server > 0 && Math.abs(server - local) > 1,
    };
  }, [totals.spend, summary?.totalSpent]);

  const avgPerBucket = totals.avgPerTransaction;
  const avgPerDaySpend = totals.avgPerCalendarDay;
  const topCat = categoryPieData[0];

  // ─── Income analytics (same bucketing as spend so both series line up) ─────
  const sourceBreakdown = incomeSummary?.sourceBreakdown || [];
  const sourcePieData = sourceBreakdown.map(s => ({
    name: SOURCE_LABELS[s.source] || s.source,
    value: Number(s.total) || 0,
    color: SOURCE_COLORS[s.source] || '#737373',
  }));
  const topSource = sourceBreakdown[0];

  const summaryIncomeTotal = Number(incomeSummary?.totalIncome);
  const totalIncome = Number.isFinite(summaryIncomeTotal)
    ? summaryIncomeTotal
    : incomeSeries.totals.spend;
  const summaryIncomeCount = Number(incomeSummary?.count);
  const incomeCount = Number.isFinite(summaryIncomeCount)
    ? summaryIncomeCount
    : incomeSeries.totals.count;

  const netBalance = financialOverview?.netBalance != null
    ? Number(financialOverview.netBalance)
    : totalIncome - periodTotals.spend;
  const savingsRate = totalIncome > 0 ? (netBalance / totalIncome) * 100 : 0;

  const incomeChartData = rows.map(r => {
    const income = incomeByKey.get(r.key) || 0;
    return { label: r.label, fullLabel: r.fullLabel, income, spend: r.spend, net: income - r.spend };
  });
  const incomeChartMax = Math.max(1, ...incomeChartData.map(d => Math.max(d.income, d.spend)));
  const peakIncomeBucket = incomeSeries.extremes.biggestBucket?.count > 0
    ? incomeSeries.extremes.biggestBucket
    : null;
  const hasAnyActivity = totals.count > 0 || incomeSeries.totals.count > 0;

  const topIncomeEntries = useMemo(
    () => [...incomes].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 5),
    [incomes],
  );

  const weekdayPeak = series.weekday.reduce((m, d) => (d.count > 0 && (!m || d.count > m.count ? d : m)), null);

  const insightText = topCat && periodTotals.spend > 0
    ? `${topCat.name} is your top category at ${inr(topCat.value)} — ${((topCat.value / periodTotals.spend) * 100).toFixed(1)}% of ${inr(periodTotals.spend)} spent ${bucketUnit} at ${inr(avgPerBucket, 0)} per transaction.${busiestLabel ? ` You transacted most on ${busiestLabel} (${extremes.busiestBucket.count} transactions).` : ''}`
    : null;

  const incomeInsightText = totalIncome > 0
    ? `You received ${inr(totalIncome)} across ${incomeCount} ${incomeCount === 1 ? 'entry' : 'entries'} and spent ${inr(periodTotals.spend)} — a savings rate of ${savingsRate.toFixed(1)}% (${netBalance >= 0 ? 'surplus' : 'deficit'} of ${inr(Math.abs(netBalance))}).${topSource ? ` ${SOURCE_LABELS[topSource.source] || topSource.source} contributed ${((Number(topSource.total) / totalIncome) * 100).toFixed(1)}% of your income.` : ''}`
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      <DateFilterBar />

      <PageHeader
        icon={TrendingUp}
        badge="Analytics"
        title="Spending & Income Analytics"
        subtitle="Averages broken down by day, week and month — spend, income and savings rate, not just a flat total."
        actions={
          <button className="btn btn-secondary btn-sm" onClick={() => setDateFilter(prev => ({ ...prev }))} title="Refresh">
            <RefreshCw size={14} />
          </button>
        }
      />

      {/* Time-wise summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
        <SummaryCard
          label="Total Spend"
          value={inr(periodTotals.spend)}
          sub={`${totals.count} transactions · ${totals.activeDays}/${totals.calendarDays} active days`}
          icon={Sigma}
          accent="#B7FF00"
          loading={loading}
        />
        <SummaryCard
          label={`Avg Spend ${bucketUnit}`}
          value={inr(avgPerDaySpend)}
          sub={granularity === 'day'
            ? `Across ${totals.calendarDays} calendar days`
            : `Rolling ${granularityTitle(granularity).toLowerCase()} average`}
          icon={Clock}
          accent="#3b82f6"
          loading={loading}
        />
        <SummaryCard
          label="Avg / Transaction"
          value={inr(avgPerBucket)}
          sub={extremes.biggestBucket ? `Peak ${inr(extremes.biggestBucket.avgPerTransaction)} on ${peakLabel}` : 'No transactions yet'}
          icon={Activity}
          accent="#f59e0b"
          loading={loading}
        />
        <SummaryCard
          label={`Peak ${granularityTitle(granularity).toLowerCase()}`}
          value={extremes.biggestBucket ? compactInr(extremes.biggestBucket.spend) : '—'}
          sub={extremes.biggestBucket ? `${peakLabel} · ${extremes.biggestBucket.count} transactions` : 'No data'}
          icon={TrendingUp}
          accent="#ef4444"
          loading={loading}
        />
        <SummaryCard
          label="Busiest Period"
          value={busiestLabel || '—'}
          sub={busiestLabel ? `${extremes.busiestBucket.count} transactions · avg ${inr(extremes.busiestBucket.avgPerTransaction, 0)}` : 'No data'}
          icon={Hash}
          accent="#8b5cf6"
          loading={loading}
        />
        <SummaryCard
          label="Top Category"
          value={topCat?.name || 'N/A'}
          sub={topCat && periodTotals.spend > 0 ? `${((topCat.value / periodTotals.spend) * 100).toFixed(1)}% of spend` : '—'}
          icon={Layers}
          accent="#22c55e"
          loading={loading}
        />
      </div>

      {/* Spend vs transactions vs average — the core time-wise chart */}
      <div className="card" style={{ padding: '24px' }}>
        <SectionTitle
          icon={TrendingUp}
          title={compareMode === 'income'
            ? `${granularityTitle(granularity)} Spend vs Income`
            : `${granularityTitle(granularity)} Spend vs Transactions vs Average`}
          right={
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div className="pill-group">
                <button className={`pill-item${compareMode === 'spend' ? ' active' : ''}`} onClick={() => setCompareMode('spend')}>Bars</button>
                <button className={`pill-item${compareMode === 'split' ? ' active' : ''}`} onClick={() => setCompareMode('split')}>Stacked</button>
                <button className={`pill-item${compareMode === 'income' ? ' active' : ''}`} onClick={() => setCompareMode('income')}>Vs Income</button>
              </div>
              <GranularityPicker value={granularity} onChange={setGranularity} />
            </div>
          }
        />

        {loading ? (
          <div className="skeleton" style={{ height: '280px', borderRadius: 'var(--r-md)' }} />
        ) : chartData.length === 0 ? (
          <EmptyChart height={280} message="No data for this period." />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="spendBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#B7FF00" />
                  <stop offset="100%" stopColor="#8AB000" />
                </linearGradient>
                <linearGradient id="countBarGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#1d4ed8" />
                </linearGradient>
                <linearGradient id="incomeBarGradMain" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#16a34a" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
              <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis yAxisId="left" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} domain={[0, chartMax * 1.15]} />
              {compareMode !== 'income' && (
                <YAxis yAxisId="right" orientation="right" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={38} />
              )}
              {compareMode !== 'income' && <YAxis yAxisId="avg" hide domain={[0, avgLineMax * 1.6]} />}
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: 'rgba(183,255,0,0.04)' }}
                labelFormatter={(_, payload) => (payload?.[0]?.payload?.fullLabel) || ''}
                formatter={(val, name) => {
                  if (name === 'Transactions') return [`${val}`, name];
                  if (name === 'Avg / Txn') return [inr(val), name];
                  return [inr(val), name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
              {compareMode !== 'income' && (
                <ReferenceLine yAxisId="avg" y={avgPerDaySpend} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: `avg ${bucketUnit}`, position: 'right', fill: '#f59e0b', fontSize: 10 }} />
              )}
              <Bar
                yAxisId="left"
                dataKey="spend"
                name="Spend"
                stackId={compareMode === 'split' ? 'spendStack' : undefined}
                fill="url(#spendBarGrad)"
                radius={compareMode === 'split' ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                maxBarSize={46}
              />
              {compareMode === 'split' && (
                <Bar yAxisId="left" dataKey="rollingAvg" name="Rolling avg" stackId="spendStack" fill="#22c55e" opacity={0.55} maxBarSize={46} />
              )}
              {compareMode === 'income' && (
                <Bar yAxisId="left" dataKey="income" name="Income" fill="url(#incomeBarGradMain)" radius={[4, 4, 0, 0]} maxBarSize={46} />
              )}
              {compareMode !== 'income' && (
                <Bar yAxisId="right" dataKey="count" name="Transactions" fill="url(#countBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={46} />
              )}
              {compareMode !== 'income' && (
                <Line yAxisId="avg" type="monotone" dataKey="avg" name="Avg / Txn" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2.5, fill: '#f59e0b' }} activeDot={{ r: 5 }} connectNulls />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        )}
        {compareMode === 'income' && incomeSeries.totals.count === 0 && (
          <p style={{ margin: '10px 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            No income entries in this period — there is nothing to compare against yet.
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* Average-per-transaction trend over time */}
        <div className="card" style={{ padding: '24px' }}>
          <SectionTitle icon={Activity} title={`Average Transaction Value ${bucketUnit}`} />
          {loading ? (
            <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--r-md)' }} />
          ) : chartData.length === 0 ? (
            <EmptyChart height={220} message="No data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="avgAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ stroke: '#f59e0b', strokeDasharray: '3 3' }}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.fullLabel) || ''}
                  formatter={(val, name) => [inr(val), name === 'rollingAvg' ? 'Rolling avg / txn' : 'Avg / txn']}
                />
                <Area type="monotone" dataKey="avg" name="avg" stroke="#f59e0b" strokeWidth={2} fill="url(#avgAreaGrad)" />
                <Line type="monotone" dataKey="rollingAvg" name="rollingAvg" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Spend distribution across weekdays */}
        <div className="card" style={{ padding: '24px' }}>
          <SectionTitle icon={Clock} title="Spend by Weekday" />
          {loading ? (
            <div className="skeleton" style={{ height: '220px', borderRadius: 'var(--r-md)' }} />
          ) : totals.count === 0 ? (
            <EmptyChart height={220} message="No expense data yet." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={series.weekday} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="day" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} />
                <YAxis yAxisId="right" orientation="right" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={32} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(183,255,0,0.04)' }}
                  formatter={(val, name) => (name === 'Transactions' ? [`${val}`, name] : [inr(val), name])}
                />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
                <Bar yAxisId="left" dataKey="spend" name="Spend" stackId="w" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={34} />
                <Bar yAxisId="right" dataKey="count" name="Transactions" stackId="w" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={34} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>

        {/* Pie Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <SectionTitle icon={PieIcon} title="Category Breakdown" />
          {loading ? (
            <div className="skeleton" style={{ height: '220px', borderRadius: '50%', width: '220px', margin: '0 auto' }} />
          ) : categoryPieData.length === 0 ? (
            <EmptyChart height={220} message="No expense data yet." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                    {categoryPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                    <CustomCenterLabel value={periodTotals.spend} caption="spent" />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} formatter={val => [inr(val), 'Spent']} />
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

        {/* Top Merchants */}
        {topMerchants.length > 0 && (
          <div className="card" style={{ padding: '24px' }}>
            <SectionTitle icon={Award} title="Top Expense Descriptions" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topMerchants.map((item, i) => {
                const pct = periodTotals.spend > 0 ? ((item.total / periodTotals.spend) * 100).toFixed(1) : '0.0';
                return (
                  <div key={item.merchant} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderRadius: 'var(--r-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    transition: 'var(--t-fast)',
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: i === 0 ? 'var(--accent)' : 'var(--text-faint)', width: '24px', flexShrink: 0 }}>
                      #{i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.merchant}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{pct}%</span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', flexShrink: 0 }}>
                      {inr(item.total)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Time-wise read-out */}
      {totals.count > 0 && (
        <div className="card" style={{ padding: '24px' }}>
          <SectionTitle icon={Clock} title={`Time-wise breakdown ${bucketUnit}`} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
            {[
              { label: `Avg / transaction`, value: inr(totals.avgPerTransaction), sub: `${totals.count} transactions in range` },
              { label: `Avg / active day`, value: inr(totals.avgPerActiveDay), sub: `Across ${totals.activeDays} spending days` },
              { label: `Avg / calendar day`, value: inr(totals.avgPerCalendarDay), sub: `Across all ${totals.calendarDays} days` },
              { label: 'Avg / week', value: inr(totals.avgPerWeek), sub: 'Normalised weekly burn' },
              { label: 'Avg / month', value: inr(totals.avgPerMonth), sub: 'Normalised monthly burn' },
              { label: 'Largest single expense', value: inr(extremes.largestTransaction?.amount || 0), sub: extremes.largestTransaction?.label || '—' },
              { label: 'Quietest periods', value: `${extremes.quietestBucket}`, sub: `${granularityTitle(granularity).toLowerCase()} buckets with zero spend` },
              { label: 'Busiest weekday', value: weekdayPeak?.day || '—', sub: weekdayPeak ? `${weekdayPeak.count} transactions · avg ${inr(weekdayPeak.avg, 0)}` : '—' },
            ].map(row => (
              <div key={row.label} style={{
                padding: '14px 16px', borderRadius: 'var(--r-lg)',
                background: 'var(--bg-surface)', border: '1px solid var(--border)',
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{row.label}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: '6px 0 4px', letterSpacing: '-0.02em' }}>{row.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.sub}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {periodTotals.mismatch && (
        <div style={{
          fontSize: '0.75rem', color: 'var(--text-muted)',
          padding: '10px 14px', borderRadius: 'var(--r-lg)',
          background: 'var(--bg-surface)', border: '1px dashed var(--border)',
        }}>
          Server total ({inr(periodTotals.spend)}) differs from the itemised total ({inr(totals.spend)}).
          Averages are computed from the itemised transactions.
        </div>
      )}

      {/* ── Income analytics ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: '20px',
        paddingTop: '20px', borderTop: '1px solid var(--border)',
      }}>
        <SectionTitle icon={Wallet} title="Income Analytics" />

        {/* Income summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px' }}>
          <SummaryCard
            label="Total Income"
            value={inr(totalIncome)}
            sub={`${incomeCount} ${incomeCount === 1 ? 'entry' : 'entries'} · ${incomeSeries.totals.activeDays} income days`}
            icon={Wallet}
            accent="#22c55e"
            loading={incomeLoading}
          />
          <SummaryCard
            label={`Avg Income ${bucketUnit}`}
            value={inr(incomeSeries.totals.avgPerCalendarDay)}
            sub={`Across ${incomeSeries.totals.calendarDays} calendar days`}
            icon={Clock}
            accent="#3b82f6"
            loading={incomeLoading}
          />
          <SummaryCard
            label="Avg / Entry"
            value={inr(incomeSeries.totals.avgPerTransaction)}
            sub={incomeSeries.extremes.largestTransaction
              ? `Largest ${inr(incomeSeries.extremes.largestTransaction.amount, 0)} · ${incomeSeries.extremes.largestTransaction.label}`
              : 'No income entries yet'}
            icon={Hash}
            accent="#f59e0b"
            loading={incomeLoading}
          />
          <SummaryCard
            label={`Peak ${granularityTitle(granularity).toLowerCase()}`}
            value={peakIncomeBucket ? compactInr(peakIncomeBucket.spend) : '—'}
            sub={peakIncomeBucket ? `${peakIncomeBucket.label} · ${peakIncomeBucket.count} entries` : 'No data'}
            icon={TrendingUp}
            accent="#06b6d4"
            loading={incomeLoading}
          />
          <SummaryCard
            label="Top Source"
            value={topSource ? (SOURCE_LABELS[topSource.source] || topSource.source) : 'N/A'}
            sub={topSource && totalIncome > 0 ? `${((Number(topSource.total) / totalIncome) * 100).toFixed(1)}% of income` : '—'}
            icon={Briefcase}
            accent={topSource ? (SOURCE_COLORS[topSource.source] || '#737373') : '#737373'}
            loading={incomeLoading}
          />
          <SummaryCard
            label="Savings Rate"
            value={`${savingsRate.toFixed(1)}%`}
            sub={`${netBalance >= 0 ? 'Surplus' : 'Deficit'} of ${inr(Math.abs(netBalance))}`}
            icon={PiggyBank}
            accent={netBalance >= 0 ? '#22c55e' : '#ef4444'}
            loading={incomeLoading || loading}
          />
        </div>

        {/* Income vs spend over time */}
        <div className="card" style={{ padding: '24px' }}>
          <SectionTitle
            icon={TrendingUp}
            title={`${granularityTitle(granularity)} Income vs Spend`}
            right={<GranularityPicker value={granularity} onChange={setGranularity} />}
          />
          {loading && incomeLoading ? (
            <div className="skeleton" style={{ height: '280px', borderRadius: 'var(--r-md)' }} />
          ) : !hasAnyActivity ? (
            <EmptyChart height={280} message="No data for this period." />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={incomeChartData} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="#16a34a" />
                  </linearGradient>
                  <linearGradient id="spendBarGradCmp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#B7FF00" />
                    <stop offset="100%" stopColor="#8AB000" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                <XAxis dataKey="label" stroke="#525252" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis stroke="#525252" fontSize={11} tickLine={false} axisLine={false} tickFormatter={compactInr} domain={[0, incomeChartMax * 1.15]} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: 'rgba(183,255,0,0.04)' }}
                  labelFormatter={(_, payload) => (payload?.[0]?.payload?.fullLabel) || ''}
                  formatter={(val, name) => [inr(val), name]}
                />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                <Bar dataKey="income" name="Income" fill="url(#incomeBarGrad)" radius={[4, 4, 0, 0]} maxBarSize={46} />
                <Bar dataKey="spend" name="Spend" fill="url(#spendBarGradCmp)" radius={[4, 4, 0, 0]} maxBarSize={46} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          {/* Income by source donut */}
          <div className="card" style={{ padding: '24px' }}>
            <SectionTitle icon={PieIcon} title="Income by Source" />
            {incomeLoading ? (
              <div className="skeleton" style={{ height: '220px', borderRadius: '50%', width: '220px', margin: '0 auto' }} />
            ) : sourcePieData.length === 0 ? (
              <EmptyChart height={220} message="No income entries in this period." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={sourcePieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                      {sourcePieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                      <CustomCenterLabel value={totalIncome} caption="income" />
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} formatter={val => [inr(val), 'Received']} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center', marginTop: '12px' }}>
                  {sourcePieData.map(c => (
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

          {/* Largest income entries */}
          <div className="card" style={{ padding: '24px' }}>
            <SectionTitle icon={Award} title="Top Income Entries" />
            {topIncomeEntries.length === 0 ? (
              <EmptyChart height={220} message="No income entries in this period." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {topIncomeEntries.map((inc, i) => (
                  <div key={inc.id || i} style={{
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                    borderRadius: 'var(--r-lg)', background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    transition: 'var(--t-fast)',
                  }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: i === 0 ? 'var(--accent)' : 'var(--text-faint)', width: '24px', flexShrink: 0 }}>
                      #{i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inc.description || SOURCE_LABELS[inc.source] || inc.source}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {inc.incomeDate ? new Date(`${inc.incomeDate.slice(0, 10)}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                    </span>
                    <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', flexShrink: 0 }}>
                      {inr(inc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {insightText && (
        <InsightCard description={insightText} actionLabel="View Dashboard" />
      )}

      {incomeInsightText && (
        <InsightCard
          title="Income Insight"
          description={incomeInsightText}
          actionLabel="View Income"
          onAction={() => setActiveTab('incomes')}
        />
      )}
    </div>
  );
};