import React, { useState } from 'react';
import { Trash2, Search, Plus, Calendar, Pencil, Repeat, Briefcase } from 'lucide-react';
import { useIncome } from '../../context/IncomeContext';
import { PageHeader } from '../ui/PageHeader';
import { EmptyState } from '../ui/EmptyState';

const SOURCE_COLORS = {
  SALARY: '#22c55e',
  FREELANCE: '#3b82f6',
  INVESTMENTS: '#f59e0b',
  BUSINESS: '#8b5cf6',
  RENTAL: '#ec4899',
  GIFTS: '#ef4444',
  REFUNDS: '#06b6d4',
  OTHER: '#737373',
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

export const IncomeTable = () => {
  const { incomes, deleteIncome, openAddIncome, openEditIncome, isLoading } = useIncome();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState('ALL');

  const filtered = incomes.filter(inc => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (inc.description || '').toLowerCase().includes(q) ||
      (inc.sourceLabel || '').toLowerCase().includes(q);
    const matchesSource = selectedSource === 'ALL' || inc.source === selectedSource;
    return matchesSearch && matchesSource;
  });

  const grouped = filtered.reduce((acc, inc) => {
    const d = inc.incomeDate || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(inc);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const totalFiltered = filtered.reduce((s, i) => s + (i.amount || 0), 0);

  const usedSources = [...new Set(incomes.map(i => i.source))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <PageHeader
        icon={Briefcase}
        badge="Income"
        title="Income Records"
        subtitle={`${filtered.length} entries · Total ₹${totalFiltered.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
        actions={
          <button className="btn btn-primary btn-sm" onClick={openAddIncome}>
            <Plus size={13} /> Add Income
          </button>
        }
      >
        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Search income..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '34px', fontSize: '0.83rem' }}
            />
          </div>
        </div>

        {/* Source filter pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setSelectedSource('ALL')}
            style={{
              padding: '5px 12px', borderRadius: 'var(--r-full)',
              border: selectedSource === 'ALL' ? '1px solid #050505' : '1px solid var(--border)',
              background: selectedSource === 'ALL' ? '#050505' : 'transparent',
              color: selectedSource === 'ALL' ? 'var(--accent)' : 'var(--text-muted)',
              fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              whiteSpace: 'nowrap', flexShrink: 0, fontFamily: 'var(--font)',
              transition: 'var(--t-fast)',
            }}
          >
            All
          </button>
          {usedSources.map(src => (
            <button
              key={src}
              onClick={() => setSelectedSource(src)}
              style={{
                padding: '5px 12px', borderRadius: 'var(--r-full)',
                border: selectedSource === src ? '1px solid #050505' : '1px solid var(--border)',
                background: selectedSource === src ? '#050505' : 'transparent',
                color: selectedSource === src ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap', flexShrink: 0,
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                fontFamily: 'var(--font)', transition: 'var(--t-fast)',
              }}
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: SOURCE_COLORS[src] || '#737373' }} />
              {SOURCE_LABELS[src] || src}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Income List */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px' }}>
            <div className="skeleton" style={{ height: '14px', width: '25%', marginBottom: '14px' }} />
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ height: '13px', width: '55%', marginBottom: '6px' }} />
                  <div className="skeleton" style={{ height: '10px', width: '35%' }} />
                </div>
                <div className="skeleton" style={{ height: '16px', width: '70px' }} />
              </div>
            ))}
          </div>
        ))
      ) : sortedDates.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title={searchQuery ? 'No income found' : 'No income records yet'}
          description={searchQuery ? 'Try adjusting your search or filters.' : 'Start tracking your income to see a complete financial picture.'}
          actions={[
            { label: 'Add Income', icon: Plus, onClick: openAddIncome, primary: true },
          ]}
        />
      ) : (
        sortedDates.map(dateStr => {
          const dayIncomes = grouped[dateStr];
          const dayTotal = dayIncomes.reduce((s, i) => s + (i.amount || 0), 0);
          return (
            <div key={dateStr} className="card" style={{ padding: '18px 22px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: '12px', marginBottom: '10px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="var(--text-muted)" />
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>{dayIncomes.length}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#22c55e' }}>
                  +₹{dayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayIncomes.map(inc => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '11px 14px', borderRadius: 'var(--r-lg)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                      transition: 'var(--t-fast)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {/* Source icon */}
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '10px', flexShrink: 0,
                        background: `${SOURCE_COLORS[inc.source] || '#737373'}15`,
                        border: `1px solid ${SOURCE_COLORS[inc.source] || '#737373'}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Briefcase size={17} color={SOURCE_COLORS[inc.source] || '#737373'} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                            {inc.description || 'Income'}
                          </span>
                          <span className="badge" style={{
                            fontSize: '0.63rem',
                            background: `${SOURCE_COLORS[inc.source] || '#737373'}15`,
                            color: SOURCE_COLORS[inc.source] || '#737373',
                            border: `1px solid ${SOURCE_COLORS[inc.source] || '#737373'}30`,
                          }}>
                            {inc.sourceLabel || inc.source}
                          </span>
                          {inc.isRecurring && (
                            <span className="badge" style={{ fontSize: '0.63rem' }}>
                              <Repeat size={9} /> {inc.frequency}
                            </span>
                          )}
                        </div>
                        {inc.notes && (
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            {inc.notes}
                          </p>
                        )}
                      </div>

                      {/* Amount + Actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#22c55e' }}>
                          +₹{(inc.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <button
                          onClick={() => openEditIncome(inc)}
                          title="Edit"
                          style={{
                            background: 'none', border: '1px solid transparent',
                            cursor: 'pointer', color: 'var(--text-faint)',
                            borderRadius: 'var(--r-sm)', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'var(--t-fast)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => deleteIncome(inc.id)}
                          title="Delete"
                          style={{
                            background: 'none', border: '1px solid transparent',
                            cursor: 'pointer', color: 'var(--text-faint)',
                            borderRadius: 'var(--r-sm)', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'var(--t-fast)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-light)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'transparent'; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
