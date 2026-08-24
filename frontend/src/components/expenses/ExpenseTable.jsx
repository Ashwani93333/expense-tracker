import React, { useState } from 'react';
import { Trash2, Search, Users, Check, Plus, FileText, Calendar, ScanLine } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { useAuth } from '../../context/AuthContext';
import { CategoryIcon } from '../categories/categoryIcons';

export const ExpenseTable = () => {
  const { expenses, deleteExpense, categories, settleSplitShare, isLoading, setIsAddModalOpen, setActiveTab } = useExpense();
  const { currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState('ALL');

  const filteredExpenses = expenses.filter(exp => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (exp.description || '').toLowerCase().includes(q) ||
      (exp.categoryName || '').toLowerCase().includes(q) ||
      (exp.groupName || '').toLowerCase().includes(q);
    const matchesCategory = selectedCategory === 'ALL' || exp.categoryId === selectedCategory;
    const matchesGroup =
      selectedGroupFilter === 'ALL' ||
      (selectedGroupFilter === 'PERSONAL' && !exp.groupId) ||
      (selectedGroupFilter === 'GROUP' && !!exp.groupId);
    return matchesSearch && matchesCategory && matchesGroup;
  });

  const grouped = filteredExpenses.reduce((acc, exp) => {
    const d = exp.expenseDate || exp.date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));
  const totalFiltered = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Header + Filters */}
      <div className="card" style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h1 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', fontWeight: 800, marginBottom: '2px' }}>My Expenses</h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {filteredExpenses.length} transactions · Total ₹{totalFiltered.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('scan')} style={{ color: 'var(--accent)' }}>
              <ScanLine size={13} color="var(--accent)" /> Scan Receipt
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={13} /> Add Expense
            </button>
          </div>
        </div>

        {/* Search + Type Filter */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-faint)' }} />
            <input
              type="text"
              placeholder="Search by description, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '34px', fontSize: '0.83rem' }}
            />
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '3px', gap: '2px' }}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'PERSONAL', label: 'Personal' },
              { id: 'GROUP', label: 'Group' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setSelectedGroupFilter(f.id)}
                className={`btn btn-xs ${selectedGroupFilter === f.id ? 'btn-primary' : 'btn-ghost'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Category filter pills */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`btn btn-xs ${selectedCategory === 'ALL' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ borderRadius: 'var(--r-full)', whiteSpace: 'nowrap', flexShrink: 0 }}
          >
            All Categories
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn btn-xs ${selectedCategory === cat.id ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: 'var(--r-full)', whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <CategoryIcon icon={cat.icon} size={12} />
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Expense List */}
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card" style={{ padding: '18px 22px' }}>
            <div className="skeleton" style={{ height: '14px', width: '25%', marginBottom: '14px' }} />
            {Array.from({ length: 2 }).map((_, j) => (
              <div key={j} style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: '9px', flexShrink: 0 }} />
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
        <div className="card" style={{ padding: '56px 24px', textAlign: 'center' }}>
          <FileText size={36} color="var(--text-faint)" style={{ marginBottom: '12px' }} />
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '6px' }}>No expenses found</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            {searchQuery ? 'Try adjusting your search or filters.' : 'Start by adding your first expense.'}
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={13} /> Add Expense
          </button>
        </div>
      ) : (
        sortedDates.map(dateStr => {
          const dayExpenses = grouped[dateStr];
          const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
          return (
            <div key={dateStr} className="card" style={{ padding: '18px 22px' }}>
              {/* Day Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                paddingBottom: '12px', marginBottom: '10px', borderBottom: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={14} color="var(--accent)" />
                  <span style={{ fontSize: '0.88rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                    {new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="badge" style={{ fontSize: '0.65rem' }}>{dayExpenses.length}</span>
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#dc2626' }}>
                  -₹{dayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>

              {/* Transactions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {dayExpenses.map(exp => {
                  const catIcon = categories.find(c => c.id === exp.categoryId)?.icon;
                  return (
                    <div
                      key={exp.id}
                      style={{
                        padding: '10px 12px', borderRadius: 'var(--r-lg)',
                        border: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                        transition: 'var(--t-fast)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-surface)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-card)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {/* Category icon */}
                        <div style={{
                          width: '38px', height: '38px', borderRadius: '9px', flexShrink: 0,
                          background: '#eff6ff', border: '1px solid #dbeafe',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          <CategoryIcon icon={catIcon} size={17} color="#2563eb" />
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                              {exp.description || 'Expense'}
                            </span>
                            {exp.groupName && (
                              <span className="badge badge-blue" style={{ fontSize: '0.63rem' }}>
                                <Users size={9} /> {exp.groupName}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                            {exp.categoryName || 'Uncategorized'}
                            {exp.paidByName && ` · Paid by ${exp.paidByName}`}
                            {exp.splitType && ` · ${exp.splitType} split`}
                          </p>
                        </div>

                        {/* Amount + Delete */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#dc2626' }}>
                            -₹{(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </div>
                          <button
                            onClick={() => deleteExpense(exp.id)}
                            title="Delete"
                            style={{
                              background: 'none', border: '1px solid var(--border)',
                              cursor: 'pointer', color: 'var(--text-faint)',
                              borderRadius: 'var(--r-sm)', width: '30px', height: '30px',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'var(--t-fast)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = '#fecaca'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-faint)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Splits */}
                      {exp.splits && exp.splits.length > 0 && (
                        <div style={{
                          display: 'flex', flexWrap: 'wrap', gap: '5px',
                          marginTop: '9px', paddingTop: '9px', borderTop: '1px solid var(--border)',
                        }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600, alignSelf: 'center', marginRight: '4px' }}>
                            Split:
                          </span>
                          {exp.splits.map(sp => (
                            <div
                              key={sp.userId || sp.id}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                padding: '2px 8px', borderRadius: 'var(--r-full)',
                                background: sp.isSettled ? '#d1fae5' : 'var(--bg-surface)',
                                border: `1px solid ${sp.isSettled ? '#a7f3d0' : 'var(--border)'}`,
                                fontSize: '0.71rem', color: sp.isSettled ? '#065f46' : 'var(--text-secondary)',
                              }}
                            >
                              <span>{sp.userName || sp.name}: ₹{(sp.shareAmount || 0).toFixed(2)}</span>
                              {sp.isSettled ? (
                                <Check size={10} color="#059669" />
                              ) : (
                                sp.userId === currentUser?.id && (
                                  <button
                                    onClick={() => settleSplitShare(exp.id, sp.userId)}
                                    style={{
                                      background: 'none', border: 'none', cursor: 'pointer',
                                      color: 'var(--accent)', fontSize: '0.65rem', fontWeight: 700,
                                      padding: '0 2px', fontFamily: 'var(--font)',
                                    }}
                                  >
                                    Settle
                                  </button>
                                )
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};
