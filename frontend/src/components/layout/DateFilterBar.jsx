import React, { useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarRange, CalendarDays } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import {
  getCurrentMonth, getCurrentYear, describeFilter,
  clampFilterToFloor, filterReachesBeforeFloor, isBeforeFloor,
} from '../../utils/dateFilter';

const MODES = [
  { id: 'month', label: 'Month', icon: CalendarDays },
  { id: 'year', label: 'Year', icon: Calendar },
  { id: 'custom', label: 'Custom', icon: CalendarRange },
];

const shiftMonth = (month, delta) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export const DateFilterBar = () => {
  const { dateFilter, setDateFilter, earliestMonth } = useExpense();

  // Never show a period that predates the account itself.
  const set = (patch) => {
    const next = { ...dateFilter, ...patch };
    setDateFilter(clampFilterToFloor(next, earliestMonth));
  };

  const goMode = (mode) => {
    const patch = { mode };
    if (mode === 'year') {
      // Base the year on the month currently being viewed, not the (possibly
      // stale) `year` field from a previous year view.
      const month = dateFilter.month || getCurrentMonth();
      patch.year = Number(month.slice(0, 4));
    }
    if (mode === 'custom') {
      // Start the custom range from the period currently being viewed so the
      // results match what the user was looking at before the switch.
      if (dateFilter.mode === 'year') {
        const y = dateFilter.year || getCurrentYear();
        patch.dateFrom = `${y}-01-01`;
        patch.dateTo = `${y}-12-31`;
      } else {
        const month = dateFilter.month || getCurrentMonth();
        const [y, m] = month.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        patch.dateFrom = `${month}-01`;
        patch.dateTo = `${month}-${String(lastDay).padStart(2, '0')}`;
      }
    }
    set(patch);
  };

  const prev = () => {
    if (dateFilter.mode === 'year') set({ year: (dateFilter.year || getCurrentYear()) - 1 });
    else {
      const month = shiftMonth(dateFilter.month || getCurrentMonth(), -1);
      set({ month, year: Number(month.slice(0, 4)) });
    }
  };

  const next = () => {
    if (dateFilter.mode === 'year') set({ year: (dateFilter.year || getCurrentYear()) + 1 });
    else {
      const month = shiftMonth(dateFilter.month || getCurrentMonth(), 1);
      set({ month, year: Number(month.slice(0, 4)) });
    }
  };

  const onFromChange = (v) => {
    const from = v;
    const to = dateFilter.dateTo;
    if (from && to && from > to) {
      set({ dateFrom: from, dateTo: from });
    } else {
      set({ dateFrom: from });
    }
  };

  const onToChange = (v) => {
    const to = v;
    const from = dateFilter.dateFrom;
    if (from && to && from > to) {
      set({ dateFrom: to, dateTo: to });
    } else {
      set({ dateTo: to });
    }
  };

  const showPrev = dateFilter.mode !== 'custom';
  const showNext = dateFilter.mode !== 'custom';

  // Hide back-navigation entirely rather than offering periods that predate the
  // account — a new user never learns earlier periods exist.
  const earliestYear = Number(String(earliestMonth || '').slice(0, 4)) || getCurrentYear();
  const canGoPrev = dateFilter.mode === 'year'
    ? (dateFilter.year || getCurrentYear()) > earliestYear
    : !isBeforeFloor(shiftMonth(dateFilter.month || getCurrentMonth(), -1), earliestMonth);

  // Safety net: if a filter was restored pointing before the account existed, pull
  // it forward rather than issuing a request for a period the user cannot access.
  useEffect(() => {
    if (filterReachesBeforeFloor(dateFilter, earliestMonth)) {
      setDateFilter(clampFilterToFloor(dateFilter, earliestMonth));
    }
  }, [dateFilter, earliestMonth, setDateFilter]);

  // The year mode is meaningless when the account and the current year are the same.
  const yearModeAvailable = !earliestMonth
    || Number(earliestYear) < getCurrentYear()
    || (dateFilter.month && Number(dateFilter.month.slice(0, 4)) > earliestYear);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap',
      padding: '10px 12px',
      borderRadius: 'var(--r-lg)',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: '2px', padding: '3px', background: '#050505', borderRadius: 'var(--r-md)' }}>
        {MODES.map(m => {
          const Icon = m.icon;
          const active = dateFilter.mode === m.id;
          if (m.id === 'year' && !yearModeAvailable) return null;
          return (
            <button
              key={m.id}
              onClick={() => goMode(m.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                padding: '6px 12px', border: 'none', borderRadius: 'var(--r-sm)',
                background: active ? 'rgba(183,255,0,0.14)' : 'transparent',
                color: active ? '#B7FF00' : '#737373',
                fontWeight: active ? 700 : 500, fontSize: '0.8rem',
                cursor: 'pointer', fontFamily: 'var(--font)',
                transition: 'var(--t-fast)',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={13} color={active ? '#B7FF00' : 'currentColor'} />
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {showPrev && canGoPrev && (
          <button className="btn btn-ghost btn-sm" onClick={prev} title="Previous" style={{ padding: '6px', width: '30px' }}>
            <ChevronLeft size={15} />
          </button>
        )}

        {dateFilter.mode === 'custom' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              value={dateFilter.dateFrom || ''}
              min={earliestMonth ? `${earliestMonth}-01` : undefined}
              onChange={e => onFromChange(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem', cursor: 'pointer', width: '150px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
            <input
              type="date"
              value={dateFilter.dateTo || ''}
              min={earliestMonth ? `${earliestMonth}-01` : undefined}
              onChange={e => onToChange(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem', cursor: 'pointer', width: '150px' }}
            />
          </div>
        ) : dateFilter.mode === 'year' ? (
          <span style={{
            fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)',
            minWidth: '54px', textAlign: 'center',
          }}>
            {dateFilter.year || getCurrentYear()}
          </span>
        ) : (
          <span style={{
            fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)',
            minWidth: '150px', textAlign: 'center',
          }}>
            {describeFilter(dateFilter)}
          </span>
        )}

        {showNext && (
          <button className="btn btn-ghost btn-sm" onClick={next} title="Next" style={{ padding: '6px', width: '30px' }}>
            <ChevronRight size={15} />
          </button>
        )}
      </div>

      {/* Period label pill */}
      <span style={{
        marginLeft: 'auto',
        fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)',
        padding: '4px 10px', borderRadius: 'var(--r-full)',
        background: 'var(--bg-elevated, var(--bg-surface))',
        border: '1px dashed var(--border)',
        whiteSpace: 'nowrap',
      }}>
        {describeFilter(dateFilter)}
      </span>
    </div>
  );
};