import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, X, TrendingUp, ReceiptText } from 'lucide-react';
import { useExpense } from '../context/ExpenseContext';
import { useIncome } from '../context/IncomeContext';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fmt = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => fmt(new Date());

const formatCurrency = (n) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;

const formatShortDate = (dateStr) => {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export const CalendarPage = () => {
  const { expenses } = useExpense();
  const { incomes } = useIncome();

  const today = todayStr();
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(null);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const expensesByDate = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const d = e.expenseDate || e.date;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [expenses]);

  const incomesByDate = useMemo(() => {
    const map = {};
    incomes.forEach(inc => {
      const d = inc.incomeDate;
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(inc);
    });
    return map;
  }, [incomes]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let dow = firstDay.getDay();
    dow = dow === 0 ? 6 : dow - 1;
    const days = [];
    for (let i = 0; i < dow; i++) {
      const d = new Date(year, month, -dow + i + 1);
      days.push({ date: d, dateStr: fmt(d), isCurrentMonth: false });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push({ date: d, dateStr: fmt(d), isCurrentMonth: true });
    }
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let i = 1; i <= remaining; i++) {
        const d = new Date(year, month + 1, i);
        days.push({ date: d, dateStr: fmt(d), isCurrentMonth: false });
      }
    }
    return days;
  }, [year, month]);

  const goToPrev = () => setViewDate(new Date(year, month - 1, 1));
  const goToNext = () => setViewDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayStr());
  };

  const selectedExpenses = selectedDate ? (expensesByDate[selectedDate] || []) : [];
  const selectedIncomes = selectedDate ? (incomesByDate[selectedDate] || []) : [];
  const selectedTotalExpense = selectedExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const selectedTotalIncome = selectedIncomes.reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{
        padding: '28px 32px',
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
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(1.3rem, 3vw, 1.8rem)',
              fontWeight: 800, color: '#ffffff',
              letterSpacing: '-0.03em', marginBottom: '6px', lineHeight: 1.2,
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <Calendar size={26} color="var(--accent)" /> Calendar
            </h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '420px', lineHeight: 1.5 }}>
              View your expenses and income organized by date. Click any day to see transaction details.
            </p>
          </div>
          <button className="btn btn-primary" onClick={goToToday} style={{ fontSize: '0.82rem' }}>
            Today
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={goToPrev}
            className="btn btn-ghost btn-icon"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', minWidth: '180px', textAlign: 'center' }}>
            {monthLabel}
          </h2>
          <button
            onClick={goToNext}
            className="btn btn-ghost btn-icon"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red)' }} /> Expenses
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)' }} /> Income
          </span>
        </div>
      </div>

      {/* Main Content: Calendar + Detail Panel */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Calendar Grid */}
        <div className="card" style={{ padding: '20px', flex: 1, minWidth: 0 }}>
          {/* Day of week headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '8px' }}>
            {DAY_LABELS.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
                color: 'var(--text-muted)', textTransform: 'uppercase',
                letterSpacing: '0.06em', padding: '6px 0',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Date cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {calendarDays.map((day, idx) => {
              const dayExpenses = expensesByDate[day.dateStr] || [];
              const dayIncomes = incomesByDate[day.dateStr] || [];
              const totalExpense = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
              const totalIncome = dayIncomes.reduce((s, i) => s + (i.amount || 0), 0);
              const hasTransactions = dayExpenses.length > 0 || dayIncomes.length > 0;
              const isToday = day.dateStr === today;
              const isSelected = day.dateStr === selectedDate;

              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day.dateStr)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '3px',
                    padding: '8px 6px',
                    borderRadius: 'var(--r-md)',
                    border: isSelected
                      ? '1.5px solid var(--accent)'
                      : isToday
                        ? '1.5px solid rgba(183,255,0,0.35)'
                        : '1.5px solid transparent',
                    background: isSelected
                      ? 'var(--accent-light)'
                      : isToday
                        ? 'rgba(183,255,0,0.06)'
                        : day.isCurrentMonth
                          ? 'transparent'
                          : 'rgba(0,0,0,0.015)',
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    fontFamily: 'var(--font)',
                    minHeight: '72px',
                    textAlign: 'left',
                    position: 'relative',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.background = day.isCurrentMonth ? 'var(--bg-surface)' : 'rgba(0,0,0,0.03)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.background = isToday ? 'rgba(183,255,0,0.06)' : day.isCurrentMonth ? 'transparent' : 'rgba(0,0,0,0.015)';
                  }}
                >
                  <span style={{
                    fontSize: '0.8rem',
                    fontWeight: isToday ? 800 : 600,
                    color: isSelected
                      ? 'var(--accent-text)'
                      : isToday
                        ? 'var(--accent)'
                        : day.isCurrentMonth
                          ? 'var(--text-primary)'
                          : 'var(--text-faint)',
                    lineHeight: 1,
                  }}>
                    {day.date.getDate()}
                  </span>

                  {totalExpense > 0 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--red)',
                      lineHeight: 1.1,
                    }}>
                      -{formatCurrency(totalExpense)}
                    </span>
                  )}

                  {totalIncome > 0 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: 'var(--green)',
                      lineHeight: 1.1,
                    }}>
                      +{formatCurrency(totalIncome)}
                    </span>
                  )}

                  {hasTransactions && (
                    <span style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '6px',
                      width: '5px',
                      height: '5px',
                      borderRadius: '50%',
                      background: dayExpenses.length > 0 ? 'var(--red)' : 'var(--green)',
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedDate && (
          <div style={{
            width: '340px',
            flexShrink: 0,
          }}>
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {/* Panel Header */}
              <div style={{
                padding: '18px 20px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    {formatShortDate(selectedDate)}
                  </h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
                    {selectedExpenses.length + selectedIncomes.length} transaction{(selectedExpenses.length + selectedIncomes.length) !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedDate(null)}
                  className="btn btn-ghost btn-icon"
                  style={{ padding: '4px' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Summary Row */}
              {(selectedTotalExpense > 0 || selectedTotalIncome > 0) && (
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  gap: '16px',
                }}>
                  {selectedTotalExpense > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                        Spent
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--red)' }}>
                        -{formatCurrency(selectedTotalExpense)}
                      </div>
                    </div>
                  )}
                  {selectedTotalIncome > 0 && (
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
                        Received
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--green)' }}>
                        +{formatCurrency(selectedTotalIncome)}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Transaction List */}
              <div style={{ padding: '12px 16px', maxHeight: '400px', overflowY: 'auto' }}>
                {selectedExpenses.length === 0 && selectedIncomes.length === 0 ? (
                  <div style={{
                    padding: '32px 16px',
                    textAlign: 'center',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: 'var(--bg-surface)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 10px',
                    }}>
                      <Calendar size={18} color="var(--text-faint)" />
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                      No transactions on this day
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {/* Incomes first */}
                    {selectedIncomes.map((inc) => (
                      <div key={inc.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--green-light)',
                        border: '1px solid rgba(34,197,94,0.12)',
                      }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          background: 'rgba(34,197,94,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <TrendingUp size={14} color="var(--green)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {inc.description || 'Income'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {inc.source || 'Income'}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--green)', flexShrink: 0 }}>
                          +{formatCurrency(inc.amount)}
                        </div>
                      </div>
                    ))}

                    {/* Expenses */}
                    {selectedExpenses.map((exp) => (
                      <div key={exp.id} style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px',
                        borderRadius: 'var(--r-md)',
                        background: 'var(--red-light)',
                        border: '1px solid rgba(239,68,68,0.12)',
                      }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '8px',
                          background: 'rgba(239,68,68,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <ReceiptText size={14} color="var(--red)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {exp.description || 'Expense'}
                          </div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '1px' }}>
                            {exp.categoryName || 'Uncategorized'}
                            {exp.groupName && <span> · {exp.groupName}</span>}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--red)', flexShrink: 0 }}>
                          -{formatCurrency(exp.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Net for the day */}
              {(selectedExpenses.length + selectedIncomes.length > 1) && (
                <div style={{
                  padding: '12px 20px',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Net</span>
                  <span style={{
                    fontSize: '0.9rem', fontWeight: 800,
                    color: (selectedTotalIncome - selectedTotalExpense) >= 0 ? 'var(--green)' : 'var(--red)',
                  }}>
                    {(selectedTotalIncome - selectedTotalExpense) >= 0 ? '+' : ''}{formatCurrency(selectedTotalIncome - selectedTotalExpense)}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
