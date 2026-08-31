import React from 'react';
import { ChevronLeft, ChevronRight, Calendar, CalendarRange, CalendarDays } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { getCurrentMonth, getCurrentYear, describeFilter } from '../../utils/dateFilter';

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
  const { dateFilter, setDateFilter } = useExpense();

  const set = (patch) => setDateFilter(prev => ({ ...prev, ...patch }));

  const goMode = (mode) => {
    const patch = { mode };
    if (mode === 'year' && !dateFilter.year) patch.year = getCurrentYear();
    if (mode === 'custom') {
      if (!dateFilter.dateFrom || !dateFilter.dateTo) {
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
    else set({ month: shiftMonth(dateFilter.month || getCurrentMonth(), -1) });
  };

  const next = () => {
    if (dateFilter.mode === 'year') set({ year: (dateFilter.year || getCurrentYear()) + 1 });
    else set({ month: shiftMonth(dateFilter.month || getCurrentMonth(), 1) });
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
        {showPrev && (
          <button className="btn btn-ghost btn-sm" onClick={prev} title="Previous" style={{ padding: '6px', width: '30px' }}>
            <ChevronLeft size={15} />
          </button>
        )}

        {dateFilter.mode === 'custom' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="date"
              value={dateFilter.dateFrom || ''}
              onChange={e => onFromChange(e.target.value)}
              className="input-field"
              style={{ fontSize: '0.8rem', cursor: 'pointer', width: '150px' }}
            />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>→</span>
            <input
              type="date"
              value={dateFilter.dateTo || ''}
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