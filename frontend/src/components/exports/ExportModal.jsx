import React, { useState, useEffect } from 'react';
import { X, Download, FileText, Users, Calendar, ChevronDown } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { groupsApi } from '../../services/api';

const generatePersonalPDF = (expenses, categories, month, currentUser) => {
  const monthDate = new Date(month + '-01');
  const monthLabel = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const total = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const categoryBreakdown = {};
  expenses.forEach(exp => {
    const catName = exp.categoryName || 'Uncategorized';
    if (!categoryBreakdown[catName]) categoryBreakdown[catName] = 0;
    categoryBreakdown[catName] += exp.amount || 0;
  });

  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  const grouped = expenses.reduce((acc, exp) => {
    const d = exp.expenseDate || exp.date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Personal Expenses - ${monthLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; padding: 40px; background: #fff; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e5e5; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header p { color: #737373; font-size: 14px; }
    .summary { display: flex; gap: 16px; margin-bottom: 32px; }
    .summary-card { flex: 1; padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; }
    .summary-card .label { font-size: 12px; color: #737373; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .breakdown { margin-bottom: 32px; }
    .breakdown h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .breakdown-table { width: 100%; border-collapse: collapse; }
    .breakdown-table th, .breakdown-table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .breakdown-table th { background: #fafafa; font-weight: 600; color: #525252; }
    .breakdown-table td:last-child { text-align: right; font-weight: 600; }
    .expenses { margin-bottom: 24px; }
    .expenses h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .day-group { margin-bottom: 16px; }
    .day-header { display: flex; justify-content: space-between; padding: 8px 12px; background: #fafafa; border-radius: 6px; margin-bottom: 6px; font-size: 13px; font-weight: 600; }
    .expense-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .expense-row:last-child { border-bottom: none; }
    .expense-desc { flex: 1; }
    .expense-cat { color: #737373; font-size: 12px; }
    .expense-amount { font-weight: 600; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center; color: #a3a3a3; font-size: 11px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Personal Expense Report</h1>
    <p>${monthLabel}${currentUser ? ' · ' + (currentUser.name || currentUser.email || '') : ''}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Expenses</div>
      <div class="value">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-card">
      <div class="label">Transactions</div>
      <div class="value">${expenses.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Categories</div>
      <div class="value">${sortedCategories.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Avg / Transaction</div>
      <div class="value">₹${expenses.length > 0 ? (total / expenses.length).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
    </div>
  </div>

  <div class="breakdown">
    <h2>Category Breakdown</h2>
    <table class="breakdown-table">
      <thead><tr><th>Category</th><th>Amount</th><th>% of Total</th></tr></thead>
      <tbody>
        ${sortedCategories.map(([name, amount]) => `
          <tr>
            <td>${name}</td>
            <td>₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>${total > 0 ? ((amount / total) * 100).toFixed(1) : 0}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="expenses">
    <h2>Detailed Expenses</h2>
    ${sortedDates.map(dateStr => {
      const dayExpenses = grouped[dateStr];
      const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
      const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div class="day-group">
          <div class="day-header">
            <span>${dateLabel}</span>
            <span>-₹${dayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          ${dayExpenses.map(exp => `
            <div class="expense-row">
              <div class="expense-desc">
                ${exp.description || 'Expense'}
                <div class="expense-cat">${exp.categoryName || 'Uncategorized'}</div>
              </div>
              <div class="expense-amount">-₹${(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Finance Tracker
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
};

const generateGroupPDF = (groupExpenses, groupName, month, members) => {
  const monthDate = new Date(month + '-01');
  const monthLabel = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const total = groupExpenses.reduce((s, e) => s + (e.amount || 0), 0);

  const categoryBreakdown = {};
  groupExpenses.forEach(exp => {
    const catName = exp.categoryName || 'Uncategorized';
    if (!categoryBreakdown[catName]) categoryBreakdown[catName] = 0;
    categoryBreakdown[catName] += exp.amount || 0;
  });
  const sortedCategories = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1]);

  const paidByBreakdown = {};
  groupExpenses.forEach(exp => {
    const payer = exp.paidByName || 'Unknown';
    if (!paidByBreakdown[payer]) paidByBreakdown[payer] = 0;
    paidByBreakdown[payer] += exp.amount || 0;
  });
  const sortedPayers = Object.entries(paidByBreakdown).sort((a, b) => b[1] - a[1]);

  const grouped = groupExpenses.reduce((acc, exp) => {
    const d = exp.expenseDate || exp.date || 'Unknown';
    if (!acc[d]) acc[d] = [];
    acc[d].push(exp);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${groupName} Expenses - ${monthLabel}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; color: #1a1a1a; padding: 40px; background: #fff; }
    .header { text-align: center; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #e5e5e5; }
    .header h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
    .header p { color: #737373; font-size: 14px; }
    .summary { display: flex; gap: 16px; margin-bottom: 32px; flex-wrap: wrap; }
    .summary-card { flex: 1; min-width: 120px; padding: 16px; border: 1px solid #e5e5e5; border-radius: 8px; }
    .summary-card .label { font-size: 12px; color: #737373; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card .value { font-size: 20px; font-weight: 700; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section h2 { font-size: 16px; font-weight: 700; margin-bottom: 12px; }
    .table { width: 100%; border-collapse: collapse; }
    .table th, .table td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
    .table th { background: #fafafa; font-weight: 600; color: #525252; }
    .table td:last-child { text-align: right; font-weight: 600; }
    .day-group { margin-bottom: 16px; }
    .day-header { display: flex; justify-content: space-between; padding: 8px 12px; background: #fafafa; border-radius: 6px; margin-bottom: 6px; font-size: 13px; font-weight: 600; }
    .expense-row { display: flex; justify-content: space-between; padding: 8px 12px; border-bottom: 1px solid #f5f5f5; font-size: 13px; }
    .expense-row:last-child { border-bottom: none; }
    .expense-desc { flex: 1; }
    .expense-meta { color: #737373; font-size: 12px; }
    .expense-amount { font-weight: 600; }
    .splits { font-size: 11px; color: #737373; margin-top: 4px; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; text-align: center; color: #a3a3a3; font-size: 11px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>Group Expense Report</h1>
    <p>${groupName} · ${monthLabel}</p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <div class="label">Total Expenses</div>
      <div class="value">₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    </div>
    <div class="summary-card">
      <div class="label">Transactions</div>
      <div class="value">${groupExpenses.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Members</div>
      <div class="value">${members?.length || sortedPayers.length}</div>
    </div>
    <div class="summary-card">
      <div class="label">Avg / Person</div>
      <div class="value">₹${(members?.length || 1) > 0 ? (total / (members?.length || 1)).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}</div>
    </div>
  </div>

  <div class="section">
    <h2>Category Breakdown</h2>
    <table class="table">
      <thead><tr><th>Category</th><th>Amount</th><th>% of Total</th></tr></thead>
      <tbody>
        ${sortedCategories.map(([name, amount]) => `
          <tr>
            <td>${name}</td>
            <td>₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>${total > 0 ? ((amount / total) * 100).toFixed(1) : 0}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Payment Summary</h2>
    <table class="table">
      <thead><tr><th>Member</th><th>Total Paid</th><th>% of Total</th></tr></thead>
      <tbody>
        ${sortedPayers.map(([name, amount]) => `
          <tr>
            <td>${name}</td>
            <td>₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
            <td>${total > 0 ? ((amount / total) * 100).toFixed(1) : 0}%</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Detailed Expenses</h2>
    ${sortedDates.length === 0 ? '<p style="color:#737373;font-size:13px;">No expenses recorded for this period.</p>' :
    sortedDates.map(dateStr => {
      const dayExpenses = grouped[dateStr];
      const dayTotal = dayExpenses.reduce((s, e) => s + (e.amount || 0), 0);
      const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      return `
        <div class="day-group">
          <div class="day-header">
            <span>${dateLabel}</span>
            <span>-₹${dayTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          ${dayExpenses.map(exp => `
            <div class="expense-row">
              <div class="expense-desc">
                ${exp.description || 'Expense'}
                <div class="expense-meta">${exp.categoryName || 'Uncategorized'} · Paid by ${exp.paidByName || 'Unknown'} · ${exp.splitType || 'EQUAL'} split</div>
                ${exp.splits && exp.splits.length > 0 ? `
                  <div class="splits">
                    Splits: ${exp.splits.map(s => `${s.userName || s.name}: ₹${(s.shareAmount || 0).toFixed(2)}${s.isSettled ? ' ✓' : ''}`).join(' · ')}
                  </div>
                ` : ''}
              </div>
              <div class="expense-amount">-₹${(exp.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('')}
  </div>

  <div class="footer">
    Generated on ${new Date().toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })} · Finance Tracker
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
};

export const ExportModal = ({ isOpen, onClose, exportType = 'personal', initialGroupId = null }) => {
  const { expenses, categories, groups, currentMonth, currentUser } = useExpense();
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId || (groups.length > 0 ? groups[0].id : null));
  const [groupExpenses, setGroupExpenses] = useState([]);
  const [isLoadingGroup, setIsLoadingGroup] = useState(false);

  useEffect(() => {
    if (exportType === 'group' && selectedGroupId && isOpen) {
      fetchGroupExpenses();
    }
  }, [selectedGroupId, selectedMonth, exportType, isOpen]);

  useEffect(() => {
    if (initialGroupId) setSelectedGroupId(initialGroupId);
  }, [initialGroupId]);

  const fetchGroupExpenses = async () => {
    if (!selectedGroupId) return;
    setIsLoadingGroup(true);
    try {
      const data = await groupsApi.listExpenses(selectedGroupId, selectedMonth);
      setGroupExpenses(data || []);
    } catch (err) {
      console.error('Failed to fetch group expenses:', err);
      setGroupExpenses([]);
    } finally {
      setIsLoadingGroup(false);
    }
  };

  const handleExport = () => {
    if (exportType === 'personal') {
      generatePersonalPDF(expenses, categories, selectedMonth, currentUser);
    } else {
      const group = groups.find(g => g.id === selectedGroupId);
      generateGroupPDF(groupExpenses, group?.name || 'Group', selectedMonth, group?.members);
    }
  };

  if (!isOpen) return null;

  const monthDate = new Date(selectedMonth + '-01');
  const monthLabel = monthDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div
        style={{
          background: '#fff', borderRadius: '16px', width: '460px', maxWidth: '90vw',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: exportType === 'personal' ? 'rgba(183, 255, 0, 0.12)' : 'rgba(99, 102, 241, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {exportType === 'personal'
                ? <FileText size={18} color="#1a1a1a" />
                : <Users size={18} color="#6366f1" />
              }
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Export {exportType === 'personal' ? 'Personal' : 'Group'} Expenses
              </h3>
              <p style={{ fontSize: '12px', color: '#737373', margin: 0 }}>Download as PDF for printing</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#a3a3a3', padding: '4px', borderRadius: '6px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {/* Month Selector */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#525252', display: 'block', marginBottom: '6px' }}>
              Select Month
            </label>
            <div style={{ position: 'relative' }}>
              <Calendar size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3' }} />
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px 10px 36px',
                  border: '1px solid #e5e5e5', borderRadius: '8px',
                  fontSize: '13px', fontWeight: 500, color: '#1a1a1a',
                  background: '#fafafa', fontFamily: 'var(--font)',
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Group Selector (only for group export) */}
          {exportType === 'group' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#525252', display: 'block', marginBottom: '6px' }}>
                Select Group
              </label>
              <div style={{ position: 'relative' }}>
                <Users size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3' }} />
                <select
                  value={selectedGroupId || ''}
                  onChange={e => setSelectedGroupId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 32px 10px 36px',
                    border: '1px solid #e5e5e5', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 500, color: '#1a1a1a',
                    background: '#fafafa', fontFamily: 'var(--font)',
                    appearance: 'none', outline: 'none', cursor: 'pointer',
                  }}
                >
                  {groups.length === 0 && <option value="">No groups available</option>}
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a3a3a3', pointerEvents: 'none' }} />
              </div>
            </div>
          )}

          {/* Preview Stats */}
          <div style={{
            padding: '16px', background: '#fafafa', borderRadius: '10px',
            border: '1px solid #f0f0f0', marginBottom: '20px',
          }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
              Preview
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>Period</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{monthLabel}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>Expenses</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                  {exportType === 'personal' ? expenses.length : (isLoadingGroup ? '...' : groupExpenses.length)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#a3a3a3' }}>Total</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
                  ₹{(exportType === 'personal'
                    ? expenses.reduce((s, e) => s + (e.amount || 0), 0)
                    : groupExpenses.reduce((s, e) => s + (e.amount || 0), 0)
                  ).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exportType === 'group' && isLoadingGroup}
            style={{
              width: '100%', padding: '12px',
              background: exportType === 'personal' ? '#050505' : '#6366f1',
              color: exportType === 'personal' ? '#B7FF00' : '#fff',
              border: 'none', borderRadius: '10px',
              fontSize: '13px', fontWeight: 700,
              cursor: exportType === 'group' && isLoadingGroup ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              fontFamily: 'var(--font)',
              opacity: exportType === 'group' && isLoadingGroup ? 0.7 : 1,
              transition: 'var(--t-fast)',
            }}
          >
            <Download size={15} />
            {exportType === 'group' && isLoadingGroup ? 'Loading expenses...' : 'Export as PDF'}
          </button>
        </div>
      </div>
    </div>
  );
};
